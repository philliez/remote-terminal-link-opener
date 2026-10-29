# Change Log

All notable changes to the "Remote Terminal Link Opener" extension will be documented in this file.

## [1.0.0] - 2026-10-10

### Initial Release
- **Smart Link Detection**: Intercepts `file:///` URIs, Unix absolute paths (`/home/...`, `/var/...`), Windows drive paths, and compiler/test traces.
- **Line & Column Jumping**: Supports `#L10`, `#L10-L20`, `:line:col`, `:line`, and Python `File "...", line X` syntax.
- **Remote-SSH Seamless Routing**: Automatically translates remote paths into `vscode-remote://ssh-remote+<host>` when clicked from local terminal windows.
- **Zero OS Modal Popups**: Bypasses the Windows `0x2` / default shell browser dispatch error entirely.
- **Auto-Host Detection**: Infers SSH hosts dynamically from terminal titles or commands.
