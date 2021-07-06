/// Return string with ANSI color codes
pub fn color(text: &str, color: i32) -> String {
    ["\x1B[0;", &color.to_string()[..], "m", text, "\x1B[0;0m"].join("")
}

/// Return string with ANSI color codes for bold text
pub fn color_bold(text: &str, color: i32) -> String {
    ["\x1B[1;", &color.to_string()[..], "m", text, "\x1B[0;0m"].join("")
}

#[allow(dead_code)]
/// Get the type of a value
pub fn get_type<T>(_: &T) -> String {
    std::any::type_name::<T>().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_color_1() {
        assert_eq!(color("Hello", 32), "\x1B[0;32mHello\x1B[0;0m");
    }

    #[test]
    fn test_color_bold_1() {
        assert_eq!(color_bold("Hello", 32), "\x1B[1;32mHello\x1B[0;0m")
    }

    #[test]
    fn test_get_type_1() {
        assert_eq!(get_type(&1), "i32");
    }
}
