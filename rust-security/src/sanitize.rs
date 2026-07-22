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

/// Validate a phone number: accepts Mauritius (+230 or local) and general E.164 international formats.
#[wasm_bindgen]
pub fn validate_phone(phone: &str) -> bool {
    let stripped: String = phone.chars().filter(|c| c.is_ascii_digit() || *c == '+').collect();

    // General international E.164: starts with '+' and has 7 to 15 digits
    if stripped.starts_with('+') {
        let rest = &stripped[1..];
        return rest.len() >= 7 && rest.len() <= 15 && rest.chars().all(|c| c.is_ascii_digit());
    }

    // Accept formats: 230XXXXXXXX, 0XXXXXXXX or generic digit-only numbers between 8 to 15 digits
    if stripped.chars().all(|c| c.is_ascii_digit()) {
        return stripped.len() >= 8 && stripped.len() <= 15;
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
