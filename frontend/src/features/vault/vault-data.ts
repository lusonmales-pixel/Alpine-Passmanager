import { api } from '../../lib/api/client';
import type { ApiPasswordBlock } from '../../lib/api/types';
import { decryptPassword } from '../../lib/crypto/vaultCrypto';

export interface VaultItem {
  id: number;
  serviceName: string;
  login: string;
  password: string;
  decryptionFailed: boolean;
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function sortItems(items: VaultItem[]): VaultItem[] {
  return items.sort((a, b) => {
    const byService = collator.compare(a.serviceName, b.serviceName);
    return byService !== 0 ? byService : collator.compare(a.login, b.login);
  });
}

async function mapBlock(
  block: ApiPasswordBlock,
  vaultKey: CryptoKey,
): Promise<VaultItem | null> {
  if (typeof block.ID !== 'number' || !Number.isInteger(block.ID) || block.ID <= 0) {
    return null;
  }

  const serviceName =
    typeof block.ServiceName === 'string' && block.ServiceName.trim()
      ? block.ServiceName
      : 'Untitled entry';
  const login = typeof block.Login === 'string' ? block.Login : '';

  let password = '';
  let decryptionFailed = false;

  if (
    typeof block.EncPassword === 'string' &&
    block.EncPassword &&
    typeof block.Nonce === 'string' &&
    block.Nonce
  ) {
    try {
      password = await decryptPassword(vaultKey, block.EncPassword, block.Nonce);
    } catch {
      decryptionFailed = true;
    }
  } else {
    decryptionFailed = true;
  }

  return {
    id: block.ID,
    serviceName,
    login,
    password,
    decryptionFailed,
  };
}

export async function fetchVaultItems(
  token: string,
  vaultKey: CryptoKey,
): Promise<VaultItem[]> {
  const response = await api.getPasswords(token);
  const blocks = response.passwords ?? [];
  const mapped = await Promise.all(blocks.map((block) => mapBlock(block, vaultKey)));

  const seen = new Set<number>();
  const unique: VaultItem[] = [];
  for (const item of mapped) {
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      unique.push(item);
    }
  }

  return sortItems(unique);
}

export function matchesQuery(item: VaultItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return `${item.serviceName} ${item.login}`.toLowerCase().includes(needle);
}

export function sortVaultItems(items: VaultItem[]): VaultItem[] {
  return sortItems([...items]);
}
