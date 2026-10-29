import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  decryptPassword,
  encryptPassword,
  prepareRegistration,
  prepareUnlock,
} from '../crypto/vaultCrypto';

/**
 * Opt-in integration test against a running Go backend:
 *
 *   ALPINE_INTEGRATION=1 VITE_API_BASE_URL=http://127.0.0.1:18080 \
 *     npx vitest run src/lib/api/integration.test.ts
 *
 * It is skipped during the normal unit-test run.
 */
const enabled = process.env.ALPINE_INTEGRATION === '1';
const username = `itest_${Date.now()}`;
let apiModule: typeof import('./client');
let saltBase64 = '';
let token = '';
let itemId = 0;

describe.skipIf(!enabled)('real backend integration', () => {
  beforeAll(async () => {
    vi.stubEnv('VITE_API_BASE_URL', process.env.VITE_API_BASE_URL ?? '');
    apiModule = await import('./client');
    const registration = await prepareRegistration('integration-master-password');
    saltBase64 = registration.saltBase64;

    await apiModule.api.register({
      username,
      master_salt: registration.saltBase64,
      verifier: registration.verifierBase64,
    });

    const login = await apiModule.api.login({
      username,
      auth_key: registration.authKeyBase64,
    });
    token = login.token;
  }, 60_000);

  it('registers and signs in with the real endpoint contract', async () => {
    expect(token.split('.')).toHaveLength(3);

    const salt = await apiModule.api.getSalt(username);
    expect(salt.salt).toBe(saltBase64);
  }, 30_000);

  it('rejects an incorrect master password with 403', async () => {
    const { authKeyBase64 } = await prepareUnlock(
      'definitely-the-wrong-password',
      saltBase64,
    );

    await expect(
      apiModule.api.login({ username, auth_key: authKeyBase64 }),
    ).rejects.toMatchObject({ status: 403 });
  }, 30_000);

  it('rejects a missing or invalid bearer token', async () => {
    await expect(apiModule.api.getPasswords('not-a-jwt')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('saves an entry and decrypts the real server response', async () => {
    const registration = await prepareUnlock(
      'integration-master-password',
      saltBase64,
    );
    const encrypted = await encryptPassword(
      registration.vaultKey,
      'a-real-encrypted-secret',
    );

    await apiModule.api.savePassword(token, {
      service_name: 'Integration Test Service',
      login: 'test@example.com',
      encrypted_password: encrypted.ciphertextBase64,
      nonce: encrypted.nonceBase64,
    });

    const response = await apiModule.api.getPasswords(token);
    expect(response.passwords).not.toBeNull();
    const block = response.passwords?.find(
      (entry) => entry.ServiceName === 'Integration Test Service',
    );
    expect(block).toBeDefined();
    expect(block?.ID).toBeTypeOf('number');
    expect(block?.Login).toBe('test@example.com');

    itemId = block?.ID ?? 0;
    const plaintext = await decryptPassword(
      registration.vaultKey,
      block?.EncPassword ?? '',
      block?.Nonce ?? '',
    );
    expect(plaintext).toBe('a-real-encrypted-secret');
    expect(JSON.stringify(response)).not.toContain('a-real-encrypted-secret');
  }, 30_000);

  it('updates an entry with a fresh nonce', async () => {
    const { vaultKey } = await prepareUnlock(
      'integration-master-password',
      saltBase64,
    );
    const encrypted = await encryptPassword(vaultKey, 'updated-integration-secret');

    await apiModule.api.updatePassword(token, {
      id: itemId,
      service_name: 'Integration Test Service Updated',
      login: 'updated@example.com',
      encrypted_password: encrypted.ciphertextBase64,
      nonce: encrypted.nonceBase64,
    });

    const response = await apiModule.api.getPasswords(token);
    const block = response.passwords?.find((entry) => entry.ID === itemId);
    expect(block?.ServiceName).toBe('Integration Test Service Updated');
    expect(block?.Login).toBe('updated@example.com');
    await expect(
      decryptPassword(
        vaultKey,
        block?.EncPassword ?? '',
        block?.Nonce ?? '',
      ),
    ).resolves.toBe('updated-integration-secret');
  }, 30_000);

  it('deletes an entry', async () => {
    await apiModule.api.deletePassword(token, { id: itemId });

    const response = await apiModule.api.getPasswords(token);
    expect(response.passwords?.some((entry) => entry.ID === itemId)).toBeFalsy();
  });

  it('surfaces backend limitations without crashing', async () => {
    await expect(apiModule.api.getSalt('__missing_account__')).rejects.toMatchObject({
      status: 500,
      serverMessage: 'Failed to get salt',
    });

    const duplicate = await prepareRegistration('another-master-password');
    await expect(
      apiModule.api.register({
        username,
        master_salt: duplicate.saltBase64,
        verifier: duplicate.verifierBase64,
      }),
    ).rejects.toMatchObject({ status: 500 });
  }, 30_000);
});
