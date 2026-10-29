import {
  ApiError,
  NetworkError,
  ProtocolError,
} from '../../lib/api/client';

type VaultAction = 'load' | 'save' | 'delete';

const fallback: Record<VaultAction, string> = {
  load: 'The vault could not be loaded. Please try again.',
  save: 'The entry could not be saved. Please try again.',
  delete: 'The entry could not be deleted. Please try again.',
};

export function vaultErrorMessage(error: unknown, action: VaultAction): string {
  if (error instanceof NetworkError) {
    return 'The server could not be reached. Check that the backend is running and try again.';
  }

  if (error instanceof ProtocolError) {
    return 'The server returned an unexpected response. Please try again.';
  }

  if (error instanceof ApiError) {
    if (error.status === 413) {
      return 'The entry is too large for the server to accept.';
    }
    if (error.status === 400) {
      return 'The server rejected the request. Check the fields and try again.';
    }
    if (error.status >= 500) {
      return 'The server could not complete the request. Please try again in a moment.';
    }
    return fallback[action];
  }

  return fallback[action];
}
