#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod profiles;

#[tauri::command]
fn save_profile(name: String, data: String) -> Result<(), String> {
    profiles::save_profile(&name, &data)
}

#[tauri::command]
fn load_profile(name: String) -> Result<String, String> {
    profiles::load_profile(&name)
}

#[tauri::command]
fn list_profiles() -> Result<Vec<String>, String> {
    profiles::list_profiles()
}

#[tauri::command]
fn delete_profile(name: String) -> Result<(), String> {
    profiles::delete_profile(&name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_profile,
            load_profile,
            list_profiles,
            delete_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
