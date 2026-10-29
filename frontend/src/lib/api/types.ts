/**
 * Wire types mirror the Go structs exactly. Note that PasswordBlock has no
 * JSON tags in the backend, so its fields are PascalCase on the wire.
 */

export interface GetSaltPayload {
  username: string;
}

export interface SaltResponse {
  salt: string;
}

export interface RegisterPayload {
  username: string;
  master_salt: string;
  verifier: string;
}

export interface LoginPayload {
  username: string;
  auth_key: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiPasswordBlock {
  ID: number | null;
  ServiceName: string | null;
  Login: string | null;
  EncPassword: string | null;
  Nonce: string | null;
}

export interface GetPasswordsResponse {
  passwords: ApiPasswordBlock[] | null;
}

export interface SavePasswordPayload {
  service_name: string;
  login: string;
  encrypted_password: string;
  nonce: string;
}

export interface UpdatePasswordPayload extends SavePasswordPayload {
  id: number;
}

export interface DeletePasswordPayload {
  id: number;
}
