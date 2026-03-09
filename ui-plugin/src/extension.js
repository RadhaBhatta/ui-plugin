"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    // 1. Register the Webview Provider (Sidebar)
    const provider = new UXVisionProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("uxVisionView", provider));
    // 2. Command to apply code fixes (called from React UI)
    context.subscriptions.push(vscode.commands.registerCommand("ux-vision.applyFix", (code) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit((editBuilder) => {
                // This is a simple implementation; ideally, you'd use a diffing tool
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                editBuilder.replace(range, code);
            });
            vscode.window.showInformationMessage("Fix applied successfully!");
        }
    }));
}
class UXVisionProvider {
    _extensionUri;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the React UI
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "analyze-ui":
                    await this.handleAnalysis(message.imageData, webviewView);
                    break;
                case "apply-fix":
                    vscode.commands.executeCommand("ux-vision.applyFix", message.code);
                    break;
            }
        });
    }
    async handleAnalysis(base64Image, webviewView) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            webviewView.webview.postMessage({
                command: "analysis-result",
                text: "Error: Open a code file first.",
            });
            return;
        }
        const sourceCode = editor.document.getText();
        try {
            // Select a vision-capable AI model
            const [model] = await vscode.lm.selectChatModels({ family: "gpt-4o" });
            if (!model) {
                throw new Error("No compatible AI model found.");
            }
            const systemPrompt = `You are a Senior UX QA. Compare the screenshot with the source code. 
            Identify discrepancies in layout, colors, or fonts.
            Return ONLY a JSON array of objects with: 
            "issue", "severity" (High/Medium/Low), "currentCode", and "suggestedFix".`;
            const userMessage = vscode.LanguageModelChatMessage.User([
                new vscode.LanguageModelTextPart(systemPrompt),
                // We use 'as any' only if your @types are lagging behind your VS Code version
                new vscode.LanguageModelImagePart(Buffer.from(base64Image.split(",")[1], "base64"), "image/png"),
                new vscode.LanguageModelTextPart(`CODE:\n${editor.document.getText()}`),
            ]);
            const response = await model.sendRequest([userMessage]);
            let resultText = "";
            for await (const fragment of response.text) {
                resultText += fragment;
            }
            // Send structured JSON back to React
            webviewView.webview.postMessage({
                command: "analysis-result",
                text: resultText,
            });
        }
        catch (err) {
            vscode.window.showErrorMessage("Analysis failed: " + err.message);
            webviewView.webview.postMessage({
                command: "analysis-result",
                text: "[]",
            });
        }
    }
    _getHtmlForWebview(webview) {
        // Path to the bundled Vite/React output
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview", "dist", "assets", "main.js"));
        // Native VS Code Styles
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview", "dist", "assets", "webview.js", "main.css"));
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>UX Vision</title>
            </head>
            <body>
                <div id="root"></div>
                <script type="module" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
//# sourceMappingURL=extension.js.map