import { beforeAll, describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64 } from '../base64';
import { getTokenExpiry } from '../jwt';
import {
  createUnlockedKeyMaterial,
  decryptPassword,
  deriveMasterKey,
  deriveSubKeys,
  deriveVerifier,
  encryptPassword,
} from './vaultCrypto';

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromAscii = (value: string) => new TextEncoder().encode(value);

/**
 * These expected values were generated with the project's Go implementation
 * (argon2.IDKey + HKDF-SHA256 + SHA-256) using the same input. They guard the
 * browser implementation against accidentally drifting from the backend.
 */
describe('vault cryptography compatibility', () => {
  const password = 'correct horse battery staple';
  const salt = fromAscii('0123456789abcdef');

  let masterKey: Uint8Array;
  let authKey: Uint8Array;
  let encryptionKey: Uint8Array;
  let verifier: Uint8Array;

  beforeAll(async () => {
    masterKey = await deriveMasterKey(password, salt);
    const subKeys = await deriveSubKeys(masterKey);
    authKey = subKeys.authKey;
    encryptionKey = subKeys.encryptionKey;
    verifier = await deriveVerifier(authKey);
  });

  it('derives the same Argon2id master key as Go', () => {
    expect(toHex(masterKey)).toBe(
      '2af63da13250f3819144f0c55dd72c3fb0bae91b799a3e6f348af969faddfe61',
    );
  });

  it('derives the same HKDF subkeys as Go', () => {
    expect(toHex(encryptionKey)).toBe(
      '62ea0b7483e21cfa17b8b367ed311db33507b3a062d6c7807e57e484580d5002',
    );
    expect(toHex(authKey)).toBe(
      'bc38dd8450b9fc0ab31f13446d1646d8cf39163ef7d7097051878b4c885c5785',
    );
  });

  it('derives the same SHA-256 verifier as Go', () => {
    expect(toHex(verifier)).toBe(
      '2dc6ab78000408030beda9e256ba9f7fd01615cc1e86fc4af51b176c78f21794',
    );
  });

  it('encrypts and decrypts a Unicode password with AES-256-GCM', async () => {
    const { vaultKey } = await createUnlockedKeyMaterial(password, salt);
    const secret = 'pässwörd-🔐-with spaces';
    const encrypted = await encryptPassword(vaultKey, secret);

    expect(encrypted.ciphertextBase64).not.toContain(secret);
    await expect(
      decryptPassword(vaultKey, encrypted.ciphertextBase64, encrypted.nonceBase64),
    ).resolves.toBe(secret);
  });

  it('rejects tampered ciphertext', async () => {
    const { vaultKey } = await createUnlockedKeyMaterial(password, salt);
    const encrypted = await encryptPassword(vaultKey, 'a secret');
    const bytes = base64ToBytes(encrypted.ciphertextBase64);
    bytes[0] ^= 1;

    await expect(
      decryptPassword(vaultKey, bytesToBase64(bytes), encrypted.nonceBase64),
    ).rejects.toThrow();
  });
});

describe('base64 helpers', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(
      Array.from(bytes),
    );
  });
});

describe('JWT expiry parsing', () => {
  it('reads the exp claim without verifying the signature', () => {
    const encode = (value: unknown) =>
      btoa(JSON.stringify(value))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const token = `${encode({ alg: 'HS256' })}.${encode({ exp: 1_700_000_000 })}.sig`;

    expect(getTokenExpiry(token)).toBe(1_700_000_000_000);
  });

  it('returns null for malformed tokens', () => {
    expect(getTokenExpiry('not-a-token')).toBeNull();
  });
});
