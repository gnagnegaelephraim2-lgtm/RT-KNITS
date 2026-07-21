/* tslint:disable */
/* eslint-disable */

/**
 * Simple JWT-like session token: base64(header).base64(payload).base64(signature)
 * Header: { "alg": "HS256", "typ": "session" }
 * Payload: { "sub": user_id, "role": role, "iat": issued_at, "exp": expires_at, "jti": nonce }
 */
export function create_session_token(user_id: string, role: string, secret: string, expires_in_secs: bigint): string;

/**
 * Generate a random 32-byte hex string (64 hex chars) for nonces.
 */
export function generate_nonce(): string;

/**
 * Generate a random salt of given byte length, returned as hex.
 */
export function generate_salt(length: number): string;

/**
 * Extract the expiry timestamp from a session token. Returns Unix timestamp or 0 on error.
 */
export function get_token_expiry(token: string): bigint;

/**
 * Extract the role from a session token.
 */
export function get_token_role(token: string): string;

/**
 * Extract the user_id from a session token.
 */
export function get_token_user_id(token: string): string;

/**
 * Hash a PIN with a salt using SHA-256. Returns base64-encoded hex digest.
 */
export function hash_pin(pin: string, salt: string): string;

/**
 * Quick boolean check: returns true if input passes all safety checks.
 */
export function is_safe_input(input: string): boolean;

/**
 * Strip HTML tags, null bytes, and common XSS/SQL injection patterns from input.
 */
export function sanitize_input(input: string): string;

/**
 * Sign a request body with HMAC-SHA256. Returns base64-encoded signature.
 */
export function sign_request(body: string, secret: string): string;

/**
 * Validate a Mauritius phone number: +230 followed by 8 digits.
 */
export function validate_phone(phone: string): boolean;

/**
 * Validate a session token. Returns true if signature is valid and not expired.
 */
export function validate_session_token(token: string, secret: string): boolean;

/**
 * Verify a PIN against a stored hash and salt.
 */
export function verify_pin(pin: string, salt: string, stored_hash: string): boolean;

/**
 * Verify an HMAC-SHA256 signature against a body and secret.
 */
export function verify_signature(body: string, secret: string, signature: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly generate_nonce: () => [number, number];
    readonly generate_salt: (a: number) => [number, number];
    readonly hash_pin: (a: number, b: number, c: number, d: number) => [number, number];
    readonly is_safe_input: (a: number, b: number) => number;
    readonly sanitize_input: (a: number, b: number) => [number, number];
    readonly sign_request: (a: number, b: number, c: number, d: number) => [number, number];
    readonly validate_phone: (a: number, b: number) => number;
    readonly verify_pin: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly verify_signature: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly create_session_token: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint) => [number, number];
    readonly get_token_expiry: (a: number, b: number) => bigint;
    readonly get_token_role: (a: number, b: number) => [number, number];
    readonly get_token_user_id: (a: number, b: number) => [number, number];
    readonly validate_session_token: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
