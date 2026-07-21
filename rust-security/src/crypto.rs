use base64::{engine::general_purpose::STANDARD as B64, Engine};
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;

type HmacSha256 = Hmac<Sha256>;

/// Hash a PIN with a salt using SHA-256. Returns base64-encoded hex digest.
#[wasm_bindgen]
pub fn hash_pin(pin: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    hasher.update(salt.as_bytes());
    let result = hasher.finalize();
    B64.encode(result)
}

/// Verify a PIN against a stored hash and salt.
#[wasm_bindgen]
pub fn verify_pin(pin: &str, salt: &str, stored_hash: &str) -> bool {
    let computed = hash_pin(pin, salt);
    // Constant-time comparison to prevent timing attacks
    if computed.len() != stored_hash.len() {
        return false;
    }
    let a = computed.as_bytes();
    let b = stored_hash.as_bytes();
    let mut diff = 0u8;
    for i in 0..a.len() {
        diff |= a[i] ^ b[i];
    }
    diff == 0
}

/// Sign a request body with HMAC-SHA256. Returns base64-encoded signature.
#[wasm_bindgen]
pub fn sign_request(body: &str, secret: &str) -> String {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(body.as_bytes());
    let result = mac.finalize();
    B64.encode(result.into_bytes())
}

/// Verify an HMAC-SHA256 signature against a body and secret.
#[wasm_bindgen]
pub fn verify_signature(body: &str, secret: &str, signature: &str) -> bool {
    let expected = sign_request(body, secret);
    if expected.len() != signature.len() {
        return false;
    }
    let a = expected.as_bytes();
    let b = signature.as_bytes();
    let mut diff = 0u8;
    for i in 0..a.len() {
        diff |= a[i] ^ b[i];
    }
    diff == 0
}

/// Generate a random 32-byte hex string (64 hex chars) for nonces.
#[wasm_bindgen]
pub fn generate_nonce() -> String {
    let mut bytes = [0u8; 32];
    getrandom::getrandom(&mut bytes).expect("getrandom failed");
    hex_encode(&bytes)
}

/// Generate a random salt of given byte length, returned as hex.
#[wasm_bindgen]
pub fn generate_salt(length: usize) -> String {
    let mut bytes = vec![0u8; length];
    getrandom::getrandom(&mut bytes).expect("getrandom failed");
    hex_encode(&bytes)
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_pin_deterministic() {
        let h1 = hash_pin("1234", "abc");
        let h2 = hash_pin("1234", "abc");
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_hash_pin_different_salt() {
        let h1 = hash_pin("1234", "salt1");
        let h2 = hash_pin("1234", "salt2");
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_verify_pin_correct() {
        let salt = "testsalt";
        let hash = hash_pin("1234", salt);
        assert!(verify_pin("1234", salt, &hash));
    }

    #[test]
    fn test_verify_pin_wrong() {
        let salt = "testsalt";
        let hash = hash_pin("1234", salt);
        assert!(!verify_pin("5678", salt, &hash));
    }

    #[test]
    fn test_sign_and_verify() {
        let body = r#"{"action":"approve"}"#;
        let secret = "my-secret-key";
        let sig = sign_request(body, secret);
        assert!(verify_signature(body, secret, &sig));
    }

    #[test]
    fn test_generate_nonce_length() {
        let nonce = generate_nonce();
        assert_eq!(nonce.len(), 64);
    }

    #[test]
    fn test_generate_salt() {
        let salt = generate_salt(16);
        assert_eq!(salt.len(), 32);
    }
}
