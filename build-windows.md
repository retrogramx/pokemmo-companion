# Building for Windows

## Prerequisites

1. Install [Rust](https://rustup.rs/) — run `rustup-init.exe`
2. Install [Node.js](https://nodejs.org/) (v18+)
3. Install Visual Studio Build Tools with "Desktop development with C++" workload

## Build

```powershell
# Clone or copy this repo to your Windows machine
cd pokemmo-companion
npm install
npx tauri build --bundles msi,nsis
```

The build outputs will be in:
- `src-tauri/target/release/bundle/msi/` — MSI installer
- `src-tauri/target/release/bundle/nsis/` — NSIS installer (.exe)

Copy the `.msi` or `.exe` to the `dist/windows/` folder.
