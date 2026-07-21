/**
 * Rust WASM Security Layer for Nita Dashboard
 *
 * Wraps the nita-security WASM module with typed async initialization.
 * All cryptographic operations (PIN hashing, HMAC signing, session tokens,
 * input sanitization) run in Rust/WASM for speed and safety.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasm: any = null

async function loadWasm() {
  if (wasm) return wasm
  // Dynamic import — the WASM JS glue lives in /public/wasm/
  const mod = await (Function("return import('/wasm/nita_security.js')")() as Promise<any>)
  await mod.default("/wasm/nita_security_bg.wasm")
  wasm = mod
  return mod
}

// --- Sanitization ---

export async function sanitize(input: string): Promise<string> {
  const m = await loadWasm()
  return m.sanitize_input(input)
}

export async function isSafe(input: string): Promise<boolean> {
  const m = await loadWasm()
  return m.is_safe_input(input)
}

// --- Phone validation ---

export async function validatePhone(phone: string): Promise<boolean> {
  const m = await loadWasm()
  return m.validate_phone(phone)
}

// --- PIN hashing ---

export async function hashPin(pin: string, salt: string): Promise<string> {
  const m = await loadWasm()
  return m.hash_pin(pin, salt)
}

export async function verifyPin(
  pin: string,
  salt: string,
  storedHash: string,
): Promise<boolean> {
  const m = await loadWasm()
  return m.verify_pin(pin, salt, storedHash)
}

// --- Request signing ---

export async function signRequest(
  body: string,
  secret: string,
): Promise<string> {
  const m = await loadWasm()
  return m.sign_request(body, secret)
}

export async function verifyRequestSignature(
  body: string,
  secret: string,
  signature: string,
): Promise<boolean> {
  const m = await loadWasm()
  return m.verify_signature(body, secret, signature)
}

// --- Nonce / Salt generation ---

export async function generateNonce(): Promise<string> {
  const m = await loadWasm()
  return m.generate_nonce()
}

export async function generateSalt(length = 16): Promise<string> {
  const m = await loadWasm()
  return m.generate_salt(length)
}

// --- Session tokens ---

export async function createSessionToken(
  userId: string,
  role: string,
  secret: string,
  expiresInSeconds: number,
): Promise<string> {
  const m = await loadWasm()
  return m.create_session_token(userId, role, secret, BigInt(expiresInSeconds))
}

export async function validateSessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const m = await loadWasm()
  return m.validate_session_token(token, secret)
}

export async function getTokenExpiry(token: string): Promise<number> {
  const m = await loadWasm()
  return Number(m.get_token_expiry(token))
}

export async function getTokenUserId(token: string): Promise<string> {
  const m = await loadWasm()
  return m.get_token_user_id(token)
}

export async function getTokenRole(token: string): Promise<string> {
  const m = await loadWasm()
  return m.get_token_role(token)
}
