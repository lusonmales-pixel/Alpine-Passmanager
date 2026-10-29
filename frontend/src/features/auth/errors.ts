import {
  ApiError,
  NetworkError,
  ProtocolError,
} from '../../lib/api/client';
import { CryptoSupportError } from '../../lib/crypto/vaultCrypto';

export class AccountNotFoundError extends Error {
  constructor() {
    super('No account exists for that username.');
    this.name = 'AccountNotFoundError';
  }
}

export class InvalidMasterPasswordError extends Error {
  constructor() {
    super('The master password is incorrect.');
    this.name = 'InvalidMasterPasswordError';
  }
}

export class UsernameUnavailableError extends Error {
  constructor() {
    super('That username may already be taken.');
    this.name = 'UsernameUnavailableError';
  }
}

export class RegistrationCompletedError extends Error {
  constructor() {
    super('The vault was created, but automatic sign-in did not complete.');
    this.name = 'RegistrationCompletedError';
  }
}

function genericServerMessage(error: ApiError): string {
  if (error.status >= 500) {
    return 'The server could not complete the request. Please try again in a moment.';
  }
  if (error.status === 400) {
    return 'The server rejected the request. Check the details and try again.';
  }
  return 'The request could not be completed. Please try again.';
}

function commonMessage(error: unknown): string | null {
  if (error instanceof NetworkError) {
    return 'The server could not be reached. Check that the backend is running and try again.';
  }
  if (error instanceof CryptoSupportError) {
    return error.message;
  }
  if (error instanceof ProtocolError) {
    return 'The server returned an unexpected response. Please try again.';
  }
  return null;
}

export function signInErrorMessage(error: unknown): string {
  const common = commonMessage(error);
  if (common) {
    return common;
  }
  if (error instanceof AccountNotFoundError) {
    return 'No account exists for that username.';
  }
  if (error instanceof InvalidMasterPasswordError) {
    return 'That master password is incorrect.';
  }
  if (error instanceof ApiError) {
    return genericServerMessage(error);
  }
  return 'Sign-in failed. Please try again.';
}

export function registrationErrorMessage(error: unknown): string {
  const common = commonMessage(error);
  if (common) {
    return common;
  }
  if (error instanceof UsernameUnavailableError) {
    return 'That username may already be taken. Try signing in instead.';
  }
  if (error instanceof RegistrationCompletedError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    return genericServerMessage(error);
  }
  return 'The vault could not be created. Please try again.';
}
