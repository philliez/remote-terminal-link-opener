# Remote Terminal Link Opener

A lightweight VS Code extension that intercepts terminal file paths, stack traces, and `file:///` URIs to open them directly in editor tabs—without OS-level path failures (such as Windows `0x2` file not found errors) and with seamless remote SSH routing.

## Features

- **Direct Editor Navigation**: Automatically activates for terminal file links and opens them in an active editor tab instead of relying on default OS shell handlers.
- **Line & Column Jumps**: Accurately parses line and column targets across formats:
  - Markdown/Web links (`path/to/file#L42`, `#L12-L24`)
  - Standard colons (`path/to/file:42`, `path/to/file:42:10`)
  - Python stack traces (`File "path/to/file", line 42`)
  - Compiler errors (`--> path/to/file:42:10`)
- **Remote SSH & Multi-Host Routing**: When working across remote servers or jump hosts, links automatically resolve to the active SSH environment (`vscode-remote://ssh-remote+...`) or prompt for the target host defined in `~/.ssh/config`.
- **Zero Heavy Dependencies**: Pure JavaScript implementation using native VS Code APIs.

## Supported Link Formats

| Format | Example | Action |
| :--- | :--- | :--- |
| **file:/// URI** | `file:///home/user/project/src/index.ts#L25` | Opens at line 25 |
| **Unix Absolute Path** | `/home/user/app/server.py:104:12` | Opens at line 104, col 12 |
| **Python Traceback** | `File "/var/log/worker.py", line 88` | Opens at line 88 |
| **Rust / Compiler Arrow** | `--> src/main.rs:15:4` | Opens at line 15, col 4 |
| **Windows Drive Path** | `C:\Users\Username\code\app.js:30` | Opens at line 30 |

## Configuration Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `remoteTerminalLinks.preferEditor` | `true` | Always open matched terminal links inside an active editor tab. |
| `remoteTerminalLinks.autoDetectHostFromTerminalName` | `true` | Automatically detects the SSH host alias from terminal title or process name. |
| `remoteTerminalLinks.defaultRemoteHost` | `""` | Fallback SSH host alias (from `~/.ssh/config`) when clicking remote paths from a local terminal. |
| `remoteTerminalLinks.promptIfHostUnknown` | `true` | Prompt to pick an SSH host if it cannot be inferred automatically. |

## License

MIT
