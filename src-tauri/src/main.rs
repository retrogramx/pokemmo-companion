#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

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
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            save_profile,
            load_profile,
            list_profiles,
            delete_profile,
        ])
        .setup(|app| {
            let toggle = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyG);
            let complete = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD);
            let expand = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyE);

            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(toggle, move |_, _, _| {
                let _ = app_handle.emit("hotkey-toggle", ());
            })?;

            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(complete, move |_, _, _| {
                let _ = app_handle.emit("hotkey-complete", ());
            })?;

            let app_handle = app.handle().clone();
            app.global_shortcut().on_shortcut(expand, move |_, _, _| {
                let _ = app_handle.emit("hotkey-expand", ());
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
