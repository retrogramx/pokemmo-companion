use std::fs;
use std::path::{Path, PathBuf};

/// Returns the default profiles directory: <data_dir>/pokemmo-companion/profiles/
fn profiles_dir() -> Result<PathBuf, String> {
    let base = dirs::data_dir().ok_or_else(|| "Could not determine data directory".to_string())?;
    Ok(base.join("pokemmo-companion").join("profiles"))
}

// ---------------------------------------------------------------------------
// Internal helpers (testable with a custom dir)
// ---------------------------------------------------------------------------

pub fn save_profile_to_dir(dir: &Path, name: &str, data: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Profile name must not be empty".to_string());
    }
    fs::create_dir_all(dir).map_err(|e| format!("Failed to create directory: {e}"))?;
    let path = dir.join(format!("{name}.json"));
    fs::write(&path, data).map_err(|e| format!("Failed to write profile: {e}"))
}

pub fn load_profile_from_dir(dir: &Path, name: &str) -> Result<String, String> {
    let path = dir.join(format!("{name}.json"));
    fs::read_to_string(&path).map_err(|e| format!("Failed to read profile '{name}': {e}"))
}

pub fn list_profiles_in_dir(dir: &Path) -> Result<Vec<String>, String> {
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {e}"))?;
    let mut names: Vec<String> = entries
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect();
    names.sort();
    Ok(names)
}

pub fn delete_profile_from_dir(dir: &Path, name: &str) -> Result<(), String> {
    let path = dir.join(format!("{name}.json"));
    if !path.exists() {
        return Err(format!("Profile '{name}' not found"));
    }
    fs::remove_file(&path).map_err(|e| format!("Failed to delete profile '{name}': {e}"))
}

// ---------------------------------------------------------------------------
// Public API (uses default profiles dir)
// ---------------------------------------------------------------------------

pub fn save_profile(name: &str, data: &str) -> Result<(), String> {
    save_profile_to_dir(&profiles_dir()?, name, data)
}

pub fn load_profile(name: &str) -> Result<String, String> {
    load_profile_from_dir(&profiles_dir()?, name)
}

pub fn list_profiles() -> Result<Vec<String>, String> {
    list_profiles_in_dir(&profiles_dir()?)
}

pub fn delete_profile(name: &str) -> Result<(), String> {
    delete_profile_from_dir(&profiles_dir()?, name)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn save_and_load_round_trip() {
        let tmp = TempDir::new().unwrap();
        let data = r#"{"region":"Unova","badges":5}"#;
        save_profile_to_dir(tmp.path(), "player1", data).unwrap();
        let loaded = load_profile_from_dir(tmp.path(), "player1").unwrap();
        assert_eq!(loaded, data);
    }

    #[test]
    fn list_returns_sorted_names() {
        let tmp = TempDir::new().unwrap();
        save_profile_to_dir(tmp.path(), "zeta", "{}").unwrap();
        save_profile_to_dir(tmp.path(), "alpha", "{}").unwrap();
        save_profile_to_dir(tmp.path(), "mid", "{}").unwrap();
        let names = list_profiles_in_dir(tmp.path()).unwrap();
        assert_eq!(names, vec!["alpha", "mid", "zeta"]);
    }

    #[test]
    fn delete_removes_file() {
        let tmp = TempDir::new().unwrap();
        save_profile_to_dir(tmp.path(), "doomed", "{}").unwrap();
        delete_profile_from_dir(tmp.path(), "doomed").unwrap();
        let names = list_profiles_in_dir(tmp.path()).unwrap();
        assert!(names.is_empty());
    }

    #[test]
    fn load_missing_profile_returns_error() {
        let tmp = TempDir::new().unwrap();
        let result = load_profile_from_dir(tmp.path(), "ghost");
        assert!(result.is_err());
    }

    #[test]
    fn empty_name_rejected() {
        let tmp = TempDir::new().unwrap();
        let result = save_profile_to_dir(tmp.path(), "", "{}");
        assert!(result.is_err());
        let result2 = save_profile_to_dir(tmp.path(), "   ", "{}");
        assert!(result2.is_err());
    }

    #[test]
    fn multiple_profiles_dont_interfere() {
        let tmp = TempDir::new().unwrap();
        save_profile_to_dir(tmp.path(), "a", r#"{"id":"a"}"#).unwrap();
        save_profile_to_dir(tmp.path(), "b", r#"{"id":"b"}"#).unwrap();
        assert_eq!(load_profile_from_dir(tmp.path(), "a").unwrap(), r#"{"id":"a"}"#);
        assert_eq!(load_profile_from_dir(tmp.path(), "b").unwrap(), r#"{"id":"b"}"#);
    }
}
