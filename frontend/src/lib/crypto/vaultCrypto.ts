import { base64ToBytes, bytesToBase64 } from '../base64';

/**
 * Parameters are copied verbatim from backend/internal/crypto/DeriveKey.go.
 * Argon2id: time=4, memory=65536 KiB, threads=2, keyLen=32.
 */
const ARGON2_ITERATIONS = 4;
const ARGON2_MEMORY_KIB = 65_536;
const ARGON2_PARALLELISM = 2;
const KEY_BYTES = 32;

export const MASTER_SALT_BYTES = 16;
export const GCM_NONCE_BYTES = 12;

const HKDF_INFO_AUTH = 'auth';
const HKDF_INFO_ENCRYPTION = 'encryption';
const textEncoder = new TextEncoder();

export class CryptoSupportError extends Error {
  constructor() {
    super(
      'This browser cannot run the cryptography required to open the vault. Use a current browser with WebAssembly and Web Crypto enabled.',
    );
    this.name = 'CryptoSupportError';
  }
}

function getCrypto(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new CryptoSupportError();
  }
  return crypto.subtle;
}

/**
 * Web Crypto's TypeScript definitions require a concrete ArrayBuffer rather
 * than a generic ArrayBufferLike. Copying also gives us a buffer we own.
 */
function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function deriveMasterKey(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  getCrypto();
  try {
    const { argon2id } = await import('hash-wasm');
    return await argon2id({
      password: textEncoder.encode(password),
      salt,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY_KIB,
      parallelism: ARGON2_PARALLELISM,
      hashLength: KEY_BYTES,
      outputType: 'binary',
    });
  } catch (error) {
    if (error instanceof CryptoSupportError) {
      throw error;
    }
    throw new CryptoSupportError();
  }
}

async function hkdfSha256(
  inputKeyMaterial: Uint8Array,
  info: string,
): Promise<Uint8Array> {
  const subtle = getCrypto();
  const baseKey = await subtle.importKey(
    'raw',
    asArrayBuffer(inputKeyMaterial),
    'HKDF',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: textEncoder.encode(info),
    },
    baseKey,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function deriveSubKeys(
  masterKey: Uint8Array,
): Promise<{ authKey: Uint8Array; encryptionKey: Uint8Array }> {
  const [authKey, encryptionKey] = await Promise.all([
    hkdfSha256(masterKey, HKDF_INFO_AUTH),
    hkdfSha256(masterKey, HKDF_INFO_ENCRYPTION),
  ]);
  return { authKey, encryptionKey };
}

export async function deriveVerifier(authKey: Uint8Array): Promise<Uint8Array> {
  const digest = await getCrypto().digest('SHA-256', asArrayBuffer(authKey));
  return new Uint8Array(digest);
}

export interface UnlockedKeyMaterial {
  authKey: Uint8Array;
  vaultKey: CryptoKey;
}

/**
 * Runs the same derivation path as the Go backend. The returned AES key is
 * non-extractable and lives only in memory.
 */
export async function createUnlockedKeyMaterial(
  password: string,
  salt: Uint8Array,
): Promise<UnlockedKeyMaterial> {
  const masterKey = await deriveMasterKey(password, salt);
  try {
    const { authKey, encryptionKey } = await deriveSubKeys(masterKey);
    try {
      const vaultKey = await getCrypto().importKey(
        'raw',
        asArrayBuffer(encryptionKey),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt'],
      );
      return { authKey, vaultKey };
    } finally {
      encryptionKey.fill(0);
    }
  } finally {
    masterKey.fill(0);
  }
}

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(MASTER_SALT_BYTES);
  crypto.getRandomValues(salt);
  return salt;
}

export interface RegistrationMaterial {
  saltBase64: string;
  verifierBase64: string;
  authKeyBase64: string;
  vaultKey: CryptoKey;
}

export async function prepareRegistration(
  password: string,
): Promise<RegistrationMaterial> {
  const salt = generateSalt();
  const { authKey, vaultKey } = await createUnlockedKeyMaterial(password, salt);

  try {
    const verifier = await deriveVerifier(authKey);
    try {
      return {
        saltBase64: bytesToBase64(salt),
        verifierBase64: bytesToBase64(verifier),
        authKeyBase64: bytesToBase64(authKey),
        vaultKey,
      };
    } finally {
      verifier.fill(0);
    }
  } finally {
    authKey.fill(0);
  }
}

export interface UnlockMaterial {
  authKeyBase64: string;
  vaultKey: CryptoKey;
}

export async function prepareUnlock(
  password: string,
  saltBase64: string,
): Promise<UnlockMaterial> {
  const salt = base64ToBytes(saltBase64);
  const { authKey, vaultKey } = await createUnlockedKeyMaterial(password, salt);
  try {
    return {
      authKeyBase64: bytesToBase64(authKey),
      vaultKey,
    };
  } finally {
    authKey.fill(0);
  }
}

export interface EncryptedPassword {
  ciphertextBase64: string;
  nonceBase64: string;
}

export async function encryptPassword(
  vaultKey: CryptoKey,
  password: string,
): Promise<EncryptedPassword> {
  const nonce = new Uint8Array(GCM_NONCE_BYTES);
  crypto.getRandomValues(nonce);

  const ciphertext = await getCrypto().encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    vaultKey,
    textEncoder.encode(password),
  );

  return {
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    nonceBase64: bytesToBase64(nonce),
  };
}

export async function decryptPassword(
  vaultKey: CryptoKey,
  ciphertextBase64: string,
  nonceBase64: string,
): Promise<string> {
  const ciphertext = base64ToBytes(ciphertextBase64);
  const nonce = base64ToBytes(nonceBase64);

  if (nonce.length !== GCM_NONCE_BYTES || ciphertext.length === 0) {
    throw new Error('Invalid encrypted payload.');
  }

  const plaintext = await getCrypto().decrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(nonce), tagLength: 128 },
    vaultKey,
    asArrayBuffer(ciphertext),
  );

  return new TextDecoder().decode(plaintext);
}
