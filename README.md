# PokeMMO Companion

A lightweight desktop overlay app for PokeMMO that guides you through the Unova region walkthrough step-by-step. Inspired by RestedXP.

## Features

- **Always-on-top overlay** — sits on top of the PokeMMO window
- **Compact + Full modes** — minimal view or full scrollable guide
- **Color-coded steps** — items, NPCs, Pokemon, battles, directions highlighted
- **Multiple profiles** — separate progress per account
- **Global hotkeys** — Ctrl+Shift+G (toggle), Ctrl+Shift+D (complete step), Ctrl+Shift+E (expand/collapse)
- **Controller-friendly** — all actions have clickable buttons

## Prerequisites

- [Rust](https://rustup.rs/) (1.75+)
- [Node.js](https://nodejs.org/) (18+)
- Tauri CLI: `cargo install tauri-cli@^2.0`

## Development

```bash
npm install
npx tauri dev
```

## Testing

```bash
# Frontend tests
npm test

# Rust tests
cd src-tauri && cargo test
```

## Building

```bash
npx tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## License

MIT
