use wasm_bindgen::prelude::*;

/// Strip HTML tags, null bytes, and common XSS/SQL injection patterns from input.
#[wasm_bindgen]
pub fn sanitize_input(input: &str) -> String {
    let mut result = String::with_capacity(input.len());

    let mut chars = input.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            // Block null bytes
            '\0' => continue,
            // Skip HTML tags
            '<' => {
                // Consume until matching '>'
                while let Some(&next) = chars.peek() {
                    chars.next();
                    if next == '>' {
                        break;
                    }
                }
            }
            // Block single and double quotes that could break attributes
            '\'' | '"' => {
                result.push(' ');
            }
            // Block backslashes (escape sequences)
            '\\' => {
                result.push('/');
            }
            _ => result.push(ch),
        }
    }

    result.trim().to_string()
}

/// Quick boolean check: returns true if input passes all safety checks.
#[wasm_bindgen]
pub fn is_safe_input(input: &str) -> bool {
    // All patterns lowercase — matching against lowercased input
    let dangerous_patterns = [
        "script",
        "javascript:",
        "onerror",
        "onload",
        "onclick",
        "onfocus",
        "onblur",
        "onmouseover",
        "eval(",
        "document.cookie",
        "document.domain",
        "window.location",
        "innerHTML",
        "outerhtml",
        "execcommand",
        "--",
        "union select",
        "drop table",
        "insert into",
        "delete from",
        "1=1",
        "' or '",
        "\" or \"",
        "' or 1=1",
    ];

    let lower = input.to_lowercase();
    for pattern in &dangerous_patterns {
        if lower.contains(pattern) {
            return false;
        }
    }

    true
}

/// Validate a Mauritius phone number: +230 followed by 8 digits.
#[wasm_bindgen]
pub fn validate_phone(phone: &str) -> bool {
    let stripped: String = phone.chars().filter(|c| c.is_ascii_digit() || *c == '+').collect();

    // Accept formats: +230XXXXXXXX, 230XXXXXXXX, 0XXXXXXXX
    if let Some(rest) = stripped.strip_prefix("+230") {
        return rest.len() == 8 && rest.chars().all(|c| c.is_ascii_digit());
    }
    if let Some(rest) = stripped.strip_prefix("230") {
        return rest.len() == 8 && rest.chars().all(|c| c.is_ascii_digit());
    }
    if stripped.len() == 8 && stripped.starts_with('0') {
        return stripped.chars().all(|c| c.is_ascii_digit());
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_html() {
        // All HTML tags stripped, quotes become spaces, content preserved
        assert_eq!(
            sanitize_input("<script>alert('xss')</script>"),
            "alert( xss )"
        );
    }

    #[test]
    fn test_sanitize_null_bytes() {
        assert_eq!(sanitize_input("hello\0world"), "helloworld");
    }

    #[test]
    fn test_is_safe_clean_input() {
        assert!(is_safe_input("Replace the bearing on Machine #3"));
    }

    #[test]
    fn test_is_safe_xss() {
        assert!(!is_safe_input("<script>alert(1)</script>"));
    }

    #[test]
    fn test_is_safe_sql() {
        assert!(!is_safe_input("' OR '1'='1"));
    }

    #[test]
    fn test_validate_phone_valid() {
        assert!(validate_phone("+23051234567"));
        assert!(validate_phone("23051234567"));
    }

    #[test]
    fn test_validate_phone_invalid() {
        assert!(!validate_phone("12345"));
        assert!(!validate_phone("+230123"));
    }
}
