// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const axios = require('axios');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('hover translate is active');
	let translateTo = vscode.workspace.getConfiguration('hovertranslate').get('translateTo', true);
	let translateFrom = vscode.workspace.getConfiguration('hovertranslate').get('translateFrom', true);
	let key = vscode.workspace.getConfiguration('hovertranslate').get('yandexApiKey', true);
	let translateDirection = translateFrom == 'auto' ? translateTo : `${translateFrom} - ${translateTo}`;
	let disposable = vscode.languages.registerHoverProvider( { pattern: '*' }, {
		provideHover(document, position, token) {
			if(vscode.workspace.getConfiguration('hovertranslate').get('enableExtension', true)) {
				const range = document.getWordRangeAtPosition(position);
				const word = document.getText(range);

				if(key) {
					return axios.get(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=${key}&text=${encodeURIComponent(word)}&lang=${translateDirection}`)
					.then(function (response) {
						let translatedWord = response.data.text[0];
						return new vscode.Hover({
							value: translatedWord
						});
					})
					.catch(function (error) {
						console.log(error);
						return new vscode.Hover({
							value: 'Error translating text'
						});
					});
				} else {
					vscode.window.showInformationMessage('Add yandex API key in settings to enable hover translate');
				}
			}
		}
	});
	context.subscriptions.push(disposable);

	vscode.commands.registerCommand('hovertranslate.enableHover', () => {
			vscode.workspace.getConfiguration('hovertranslate').update('enableExtension', true, true);
			vscode.window.showInformationMessage('Hover translate enabled!');
	});

	vscode.commands.registerCommand('hovertranslate.disableHover', () => {
			vscode.workspace.getConfiguration('hovertranslate').update('enableExtension', false, true);
			vscode.window.showInformationMessage('Hover translate disabled!');
	});
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

module.exports = {
	activate,
	deactivate
}
