import * as vscode from 'vscode';

export class VisionPanel {
    public static render(extensionUri: vscode.Uri) {
        const panel = vscode.window.createWebviewPanel(
            'uxVision', 'UX-Vision Inspector', vscode.ViewColumn.Two, { enableScripts: true }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
                <body>
                    <h3>Drop UI Screenshot Here</h3>
                    <input type="file" id="imageInput" accept="image/*">
                    <div id="preview"></div>
                    <button id="analyze">Analyze with AI</button>
                    <script>
                        const vscode = acquireVsCodeApi();
                        document.getElementById('analyze').onclick = () => {
                            const file = document.getElementById('imageInput').files[0];
                            // Send image data to extension.ts
                            vscode.postMessage({ command: 'analyze', data: '...' });
                        };
                    </script>
                </body>
            </html>
        `;
    }
}