# Plugins

Isolated modules that can add features without modifying core code.

- Each plugin should be self-contained under a subfolder (e.g. `plugins/my-feature/`).
- Plugins are loaded or registered by the application as needed.
- Do not depend on core internals; use public APIs and configuration only.
