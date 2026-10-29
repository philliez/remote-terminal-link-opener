# Remote Terminal Link Opener

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/philliez.remote-terminal-link-opener?style=flat-square&color=blue)](https://marketplace.visualstudio.com/items?itemName=philliez.remote-terminal-link-opener)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![VS Code Engine](https://img.shields.io/badge/vscode-%3E%3D1.75.0-blueviolet?style=flat-square)](https://code.visualstudio.com/)

> **Never see `Error 0x2: The system cannot find the file specified` again.**  
> Click terminal file links, stack traces, and `file:///` URIs to jump directly into VS Code editor tabs—across Local, Remote-SSH, and WSL.

---

## 🚫 The Problem

When running modern CLI agents (Antigravity, Claude Code, Aider), test runners (`pytest`, `jest`), or compilers over SSH or on Windows:
1. Links often print as `file:///home/ubuntu/app.py#L42` or `/var/log/syslog`.
2. Clicking them in VS Code's integrated terminal causes Windows to invoke the OS shell handler, failing with:
   ```
   An error occurred while opening the file:
   The system cannot find the file specified (0x2)
   ```
   ...or it erroneously launches Microsoft Edge / your web browser!
3. If you run an SSH session in your local terminal window, VS Code doesn't know the remote path belongs to your server, so clicking it fails completely.

## ✨ The Solution

**Remote Terminal Link Opener** installs a native `TerminalLinkProvider` inside VS Code that intercepts clicks before the OS shell sees them:
- 🎯 **Opens in Editor Tabs**: Routes every valid file link straight into a VS Code editor tab.
- 📍 **Exact Line & Column Jump**: Automatically parses `#L42`, `#L42-L60`, `:42:10`, `:42`, and Python tracebacks to position your cursor directly on the line.
- 🌐 **Seamless Remote-SSH Routing**: Clicking a remote Linux path from your local terminal automatically routes through `vscode-remote://ssh-remote+<host>/...`.
- ⚡ **Zero Configuration Needed**: Auto-detects SSH hosts from your active terminal title or command.

---

## 🔍 Supported Link Patterns

| Pattern Format | Example | Behavior |
| :--- | :--- | :--- |
| **`file:///` URIs** | `file:///home/ubuntu/main.py#L85` | Opens `main.py`, jumps to line 85 |
| **Unix Absolute Paths** | `/var/log/nginx/access.log` | Opens `/var/log/nginx/access.log` |
| **Line & Column Suffixes** | `/home/ubuntu/server.ts:124:15` | Opens `server.ts` at line 124, col 15 |
| **Python Tracebacks** | `File "controllers/auth.py", line 42` | Opens `auth.py`, jumps to line 42 |
| **Compiler Error Arrows** | `--> src/main.rs:52:9` | Opens `src/main.rs` at line 52, col 9 |
| **Windows Local Paths** | `C:\Users\Dev\project\test.py:10` | Opens locally on line 10 |

---

## ⚙️ Extension Settings

This extension contributes the following settings (`settings.json`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `remoteTerminalLinks.defaultRemoteHost` | `""` | Default SSH host alias (from your `~/.ssh/config`) when clicking remote paths from a local terminal. |
| `remoteTerminalLinks.autoDetectHostFromTerminalName` | `true` | Automatically detects the SSH host from the terminal title or command (e.g. `ssh myserver`). |
| `remoteTerminalLinks.promptIfHostUnknown` | `true` | Prompts with a quick input box to pick an SSH host if it cannot be auto-detected. |
| `remoteTerminalLinks.preferEditor` | `true` | Always opens file links in active editor tabs rather than external handlers. |

---

## 🚀 Quick Setup

1. Install from the Visual Studio Marketplace.
2. In VS Code settings (`Ctrl+,`), ensure link handling is enabled:
   ```json
   "terminal.integrated.enableFileLinks": "on"
   ```
3. Open any terminal, run your tests or agent, and `Ctrl+Click` any link!

---

## 📄 License

MIT © [philliez](https://github.com/philliez)
