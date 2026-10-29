import type {
  DeletePasswordPayload,
  GetPasswordsResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  SaltResponse,
  SavePasswordPayload,
  UpdatePasswordPayload,
} from './types';

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredBase || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | null;

  constructor(status: number, message: string, serverMessage: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(serverMessage: string | null) {
    super(401, 'Your session is no longer valid.', serverMessage);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('The server could not be reached.');
    this.name = 'NetworkError';
  }
}

export class ProtocolError extends Error {
  constructor() {
    super('The server returned an unexpected response.');
    this.name = 'ProtocolError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string;
}

/**
 * The current Go backend keeps a single pgx connection for the whole process.
 * Two in-flight requests that touch the database can therefore fail with
 * "conn busy" (observed under React StrictMode's development double-effect).
 * Serialize requests from this tab so the client never creates that condition.
 */
let requestQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(task, task);
  requestQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readServerMessage(response: Response): Promise<string | null> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return null;
  }

  if (!text) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'message' in parsed &&
      typeof parsed.message === 'string'
    ) {
      return parsed.message;
    }
  } catch {
    // The backend returns a bare JSON string for errors, but proxies may return
    // plain text. Keep a short excerpt and never expose it as HTML.
    return text.length > 240 ? text.slice(0, 240) : text;
  }

  return null;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    const serverMessage = await readServerMessage(response);
    if (response.status === 401) {
      throw new UnauthorizedError(serverMessage);
    }
    throw new ApiError(
      response.status,
      `Request failed with status ${response.status}.`,
      serverMessage,
    );
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ProtocolError();
  }
}

function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return enqueue(() => performRequest<T>(path, options));
}

function assertSaltResponse(value: SaltResponse): SaltResponse {
  if (value === null || typeof value !== 'object' || typeof value.salt !== 'string') {
    throw new ProtocolError();
  }
  return value;
}

function assertLoginResponse(value: LoginResponse): LoginResponse {
  if (value === null || typeof value !== 'object' || typeof value.token !== 'string') {
    throw new ProtocolError();
  }
  return value;
}

function assertPasswordsResponse(value: GetPasswordsResponse): GetPasswordsResponse {
  if (
    value === null ||
    typeof value !== 'object' ||
    !('passwords' in value) ||
    !(value.passwords === null || Array.isArray(value.passwords))
  ) {
    throw new ProtocolError();
  }
  return value;
}

export const api = {
  async getSalt(username: string): Promise<SaltResponse> {
    const response = await request<SaltResponse>('/getSalt', {
      method: 'POST',
      body: { username } satisfies { username: string },
    });
    return assertSaltResponse(response);
  },

  async register(payload: RegisterPayload): Promise<void> {
    await request<void>('/register', { method: 'POST', body: payload });
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/login', {
      method: 'POST',
      body: payload,
    });
    return assertLoginResponse(response);
  },

  async getPasswords(token: string): Promise<GetPasswordsResponse> {
    const response = await request<GetPasswordsResponse>('/getPasswords', {
      token,
    });
    return assertPasswordsResponse(response);
  },

  async savePassword(token: string, payload: SavePasswordPayload): Promise<void> {
    await request<void>('/savePassword', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  async updatePassword(token: string, payload: UpdatePasswordPayload): Promise<void> {
    await request<void>('/updatePassword', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  async deletePassword(token: string, payload: DeletePasswordPayload): Promise<void> {
    await request<void>('/deletePassword', {
      method: 'POST',
      token,
      body: payload,
    });
  },
};

export { API_BASE };
