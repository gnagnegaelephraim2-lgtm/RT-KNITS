use base64::{engine::general_purpose::STANDARD as B64, Engine};
use hmac::{Hmac, Mac};
use js_sys::Date;
use sha2::Sha256;
use wasm_bindgen::prelude::*;

type HmacSha256 = Hmac<Sha256>;

/// Simple JWT-like session token: base64(header).base64(payload).base64(signature)
/// Header: { "alg": "HS256", "typ": "session" }
/// Payload: { "sub": user_id, "role": role, "iat": issued_at, "exp": expires_at, "jti": nonce }

#[wasm_bindgen]
pub fn create_session_token(
    user_id: &str,
    role: &str,
    secret: &str,
    expires_in_secs: u64,
) -> String {
    let now = (Date::now() / 1000.0) as u64;

    // Generate a unique token ID
    let mut nonce_bytes = [0u8; 16];
    getrandom::getrandom(&mut nonce_bytes).expect("getrandom failed");
    let jti: String = nonce_bytes
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect();

    let header = r#"{"alg":"HS256","typ":"session"}"#;

    let payload = format!(
        r#"{{"sub":"{}","role":"{}","iat":{},"exp":{},"jti":"{}"}}"#,
        escape_json(user_id),
        escape_json(role),
        now,
        now + expires_in_secs,
        jti
    );

    let header_b64 = B64.encode(header.as_bytes());
    let payload_b64 = B64.encode(payload.as_bytes());

    let signing_input = format!("{}.{}", header_b64, payload_b64);

    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(signing_input.as_bytes());
    let sig = B64.encode(mac.finalize().into_bytes());

    format!("{}.{}.{}", header_b64, payload_b64, sig)
}

/// Validate a session token. Returns true if signature is valid and not expired.
#[wasm_bindgen]
pub fn validate_session_token(token: &str, secret: &str) -> bool {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return false;
    }

    let signing_input = format!("{}.{}", parts[0], parts[1]);

    // Verify signature
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(signing_input.as_bytes());

    let expected_sig = match B64.decode(parts[2]) {
        Ok(bytes) => bytes,
        Err(_) => return false,
    };

    if mac.verify_slice(&expected_sig).is_err() {
        return false;
    }

    // Check expiry
    let payload_bytes = match B64.decode(parts[1]) {
        Ok(bytes) => bytes,
        Err(_) => return false,
    };

    let payload_str = match std::str::from_utf8(&payload_bytes) {
        Ok(s) => s,
        Err(_) => return false,
    };

    let payload: serde_json::Value = match serde_json::from_str(payload_str) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let exp = payload.get("exp").and_then(|v| v.as_u64());
    match exp {
        Some(expiry) => {
            let now = (Date::now() / 1000.0) as u64;
            now < expiry
        }
        None => false,
    }
}

/// Extract the expiry timestamp from a session token. Returns Unix timestamp or 0 on error.
#[wasm_bindgen]
pub fn get_token_expiry(token: &str) -> u64 {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return 0;
    }

    let payload_bytes = match B64.decode(parts[1]) {
        Ok(bytes) => bytes,
        Err(_) => return 0,
    };

    let payload_str = match std::str::from_utf8(&payload_bytes) {
        Ok(s) => s,
        Err(_) => return 0,
    };

    let payload: serde_json::Value = match serde_json::from_str(payload_str) {
        Ok(v) => v,
        Err(_) => return 0,
    };

    payload.get("exp").and_then(|v| v.as_u64()).unwrap_or(0)
}

/// Extract the user_id from a session token.
#[wasm_bindgen]
pub fn get_token_user_id(token: &str) -> String {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return String::new();
    }

    let payload_bytes = match B64.decode(parts[1]) {
        Ok(bytes) => bytes,
        Err(_) => return String::new(),
    };

    let payload_str = match std::str::from_utf8(&payload_bytes) {
        Ok(s) => s,
        Err(_) => return String::new(),
    };

    let payload: serde_json::Value = match serde_json::from_str(payload_str) {
        Ok(v) => v,
        Err(_) => return String::new(),
    };

    payload
        .get("sub")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

/// Extract the role from a session token.
#[wasm_bindgen]
pub fn get_token_role(token: &str) -> String {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return String::new();
    }

    let payload_bytes = match B64.decode(parts[1]) {
        Ok(bytes) => bytes,
        Err(_) => return String::new(),
    };

    let payload_str = match std::str::from_utf8(&payload_bytes) {
        Ok(s) => s,
        Err(_) => return String::new(),
    };

    let payload: serde_json::Value = match serde_json::from_str(payload_str) {
        Ok(v) => v,
        Err(_) => return String::new(),
    };

    payload
        .get("role")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

fn escape_json(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t")
}

// Session tests require WASM target (uses js_sys::Date::now())
#[cfg(test)]
#[cfg(target_arch = "wasm32")]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_validate_token() {
        let token = create_session_token("user-123", "admin", "test-secret", 3600);
        assert!(validate_session_token(&token, "test-secret"));
    }

    #[test]
    fn test_token_wrong_secret() {
        let token = create_session_token("user-123", "admin", "test-secret", 3600);
        assert!(!validate_session_token(&token, "wrong-secret"));
    }

    #[test]
    fn test_get_token_user_id() {
        let token = create_session_token("user-456", "technician", "s", 3600);
        assert_eq!(get_token_user_id(&token), "user-456");
    }

    #[test]
    fn test_get_token_role() {
        let token = create_session_token("u", "operator", "s", 3600);
        assert_eq!(get_token_role(&token), "operator");
    }

    #[test]
    fn test_invalid_token() {
        assert!(!validate_session_token("not.a.valid.token", "secret"));
    }
}
