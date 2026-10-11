const vscode = require('vscode');

/**
 * Activates the Remote Terminal Link Opener extension.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('[RemoteTerminalLinkOpener] Activated. Registering TerminalLinkProvider...');

    const linkProvider = vscode.window.registerTerminalLinkProvider({
        /**
         * Scans terminal lines for file links, stack traces, and URI patterns.
         */
        provideTerminalLinks(terminalContext, token) {
            const line = terminalContext.line;
            if (!line) return [];

            const links = [];

            // Pattern 1: file:/// URIs (e.g. file:///home/ubuntu/main.py#L42 or file:///C:/Users/...)
            const fileUriRegex = /file:\/\/\/[^\s"'`\)\]>]+/g;

            // Pattern 2: Absolute Unix/Linux paths (e.g. /home/ubuntu/app.py:12:5 or /var/log/syslog)
            const unixPathRegex = /(?:~|\/(?:home|root|var|etc|opt|tmp|usr|srv|app))[^\s"'`\)\]>]+/g;

            // Pattern 3: Windows drive paths (e.g. C:\Users\..., D:/Projects/...)
            const winPathRegex = /[a-zA-Z]:[\\\/][^\s"'`\)\]>]+/g;

            // Pattern 4: Python traceback: File "...", line 123
            const pyTracebackRegex = /File\s+["']([^"']+)["'],\s+line\s+(\d+)/g;

            // Pattern 5: Rust / Compiler style: --> src/main.rs:12:5
            const compilerArrowRegex = /-->\s+([^\s:]+):(\d+)(?::(\d+))?/g;

            // Helper to add link avoiding duplicate spans
            const addLink = (startIndex, length, rawText, explicitLine = null, explicitCol = null) => {
                // Trim trailing punctuation like commas, periods, closing parens from console prose
                let cleaned = rawText.replace(/[.,;:!?)]+$/, '');
                if (!cleaned || cleaned.length < 3) return;

                const actualLength = cleaned.length;
                links.push({
                    startIndex,
                    length: actualLength,
                    tooltip: `Open in Editor: ${cleaned}${explicitLine ? ` (Line ${explicitLine})` : ''}`,
                    data: {
                        rawText: cleaned,
                        explicitLine,
                        explicitCol,
                        terminalName: terminalContext.terminal ? terminalContext.terminal.name : ''
                    }
                });
            };

            let match;

            // 1. Python tracebacks
            while ((match = pyTracebackRegex.exec(line)) !== null) {
                addLink(match.index, match[0].length, match[1], parseInt(match[2], 10), 1);
            }

            // 2. Compiler arrow syntax
            while ((match = compilerArrowRegex.exec(line)) !== null) {
                const lineNum = parseInt(match[2], 10);
                const colNum = match[3] ? parseInt(match[3], 10) : 1;
                addLink(match.index, match[0].length, match[1], lineNum, colNum);
            }

            // 3. file:/// URIs
            while ((match = fileUriRegex.exec(line)) !== null) {
                addLink(match.index, match[0].length, match[0]);
            }

            // 4. Unix paths
            while ((match = unixPathRegex.exec(line)) !== null) {
                addLink(match.index, match[0].length, match[0]);
            }

            // 5. Windows paths
            while ((match = winPathRegex.exec(line)) !== null) {
                addLink(match.index, match[0].length, match[0]);
            }

            return links;
        },

        /**
         * Dispatches link clicks to the editor with smart local/remote routing.
         */
        async handleTerminalLink(link) {
            try {
                let { rawText, explicitLine, explicitCol, terminalName } = link.data;

                // 1. Strip file:/// scheme prefix
                let pathStr = rawText.replace(/^file:\/\/\/?/, '/');

                // 2. Extract line & column if not already parsed
                let lineNumber = explicitLine;
                let columnNumber = explicitCol;

                if (!lineNumber) {
                    // Check for #L12 or #L12-L24
                    const hashMatch = pathStr.match(/#L(\d+)(?:-L\d+)?$/i);
                    if (hashMatch) {
                        lineNumber = parseInt(hashMatch[1], 10);
                        pathStr = pathStr.replace(/#L\d+(?:-L\d+)?$/i, '');
                    } else {
                        // Check for :line:col or :line
                        const colonMatch = pathStr.match(/:(\d+)(?::(\d+))?$/);
                        if (colonMatch) {
                            lineNumber = parseInt(colonMatch[1], 10);
                            if (colonMatch[2]) {
                                columnNumber = parseInt(colonMatch[2], 10);
                            }
                            pathStr = pathStr.replace(/:\d+(?::\d+)?$/, '');
                        }
                    }
                }

                pathStr = pathStr.trim();

                // 3. Check if path is a Windows local drive (e.g. C:\... or /C:/...)
                const winDriveMatch = pathStr.match(/^\/?([a-zA-Z]:[\\\/].*)/);
                if (winDriveMatch) {
                    const localPath = winDriveMatch[1].replace(/\//g, '\\');
                    const uri = vscode.Uri.file(localPath);
                    await openUriInEditor(uri, lineNumber, columnNumber);
                    return;
                }

                // 4. Remote vs Local routing
                const isCurrentlyRemote = !!vscode.env.remoteName;

                if (isCurrentlyRemote) {
                    // Already in a remote window (SSH / WSL / Container).
                    // The path is local to the active remote server.
                    const remoteFileUri = vscode.Uri.file(pathStr);
                    await openUriInEditor(remoteFileUri, lineNumber, columnNumber);
                    return;
                }

                // We are in a LOCAL window, but clicked a Unix/Remote path (e.g. /home/ubuntu/...)
                const config = vscode.workspace.getConfiguration('remoteTerminalLinks');
                const autoDetect = config.get('autoDetectHostFromTerminalName', true);
                let targetHost = config.get('defaultRemoteHost', '');

                // Try auto-detecting host from terminal name (e.g., 'ssh scoring', 'ubuntu@lab', 'tak-jump')
                if (autoDetect && terminalName) {
                    const termLower = terminalName.toLowerCase();
                    const sshMatch = termLower.match(/(?:ssh\s+|@)([a-zA-Z0-9_.-]+)/);
                    if (sshMatch && sshMatch[1]) {
                        targetHost = sshMatch[1];
                    }
                }

                if (!targetHost && config.get('promptIfHostUnknown', true)) {
                    // Prompt user which host this belongs to
                    const selected = await vscode.window.showInputBox({
                        prompt: `Which SSH host does "${pathStr}" belong to? (from ~/.ssh/config)`,
                        placeHolder: 'e.g. lab, scoring, patterns'
                    });
                    if (selected) {
                        targetHost = selected.trim();
                    }
                }

                if (targetHost) {
                    const remoteUriStr = `vscode-remote://ssh-remote+${targetHost}${pathStr}`;
                    const remoteUri = vscode.Uri.parse(remoteUriStr);
                    await openUriInEditor(remoteUri, lineNumber, columnNumber);
                } else {
                    // Fallback to local file attempt
                    const localFallbackUri = vscode.Uri.file(pathStr);
                    await openUriInEditor(localFallbackUri, lineNumber, columnNumber);
                }
            } catch (err) {
                vscode.window.showErrorMessage(
                    `[Remote Terminal Links] Failed to open: ${err.message || err}`
                );
            }
        }
    });

    context.subscriptions.push(linkProvider);
}

/**
 * Opens a URI in the active editor and highlights/centers the requested line.
 */
async function openUriInEditor(uri, lineNumber, columnNumber) {
    const options = {
        preview: false
    };

    if (lineNumber) {
        const line = Math.max(0, lineNumber - 1);
        const col = Math.max(0, (columnNumber || 1) - 1);
        options.selection = new vscode.Range(line, col, line, col);
    }

    try {
        const editor = await vscode.window.showTextDocument(uri, options);
        if (lineNumber && editor) {
            const pos = new vscode.Position(Math.max(0, lineNumber - 1), 0);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfClose);
        }
    } catch (err) {
        // Fallback to vscode.open command
        await vscode.commands.executeCommand('vscode.open', uri, options);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
