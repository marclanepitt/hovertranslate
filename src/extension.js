const vscode = require('vscode');
const axios = require('axios');

let disposables = [];

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('hover translate is active');
	setupHoverProvider();

	vscode.commands.registerCommand('hovertranslate.enableHover', () => {
			vscode.workspace.getConfiguration('hovertranslate').update('enableExtension', true, true);
			vscode.window.showInformationMessage('Hover translate enabled!');
	});

	vscode.commands.registerCommand('hovertranslate.disableHover', () => {
			vscode.workspace.getConfiguration('hovertranslate').update('enableExtension', false, true);
			vscode.window.showInformationMessage('Hover translate disabled!');
	});

	vscode.workspace.onDidChangeConfiguration((_) => {
		disposeAll();
		setupHoverProvider();
	});

}
exports.activate = activate;

function deactivate() {
	disposeAll();
}

module.exports = {
	activate,
	deactivate
}

function setupHoverProvider() {
	let translateTo = vscode.workspace.getConfiguration('hovertranslate').get('translateTo', true);
	let translateFrom = vscode.workspace.getConfiguration('hovertranslate').get('translateFrom', true);
	let key = vscode.workspace.getConfiguration('hovertranslate').get('yandexApiKey', true);
	let hideSameLangHover = vscode.workspace.getConfiguration('hovertranslate').get('hideSameLangHover', true);
	let translateDirection = translateFrom == 'auto' ? translateTo : `${translateFrom} - ${translateTo}`;
	if(vscode.workspace.getConfiguration('hovertranslate').get('enableExtension', true)) {
		let disposable = vscode.languages.registerHoverProvider( { pattern: '**' }, {
			async provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position);
				const word = document.getText(range);

				if(key) {
					let language = hideSameLangHover ? await getLanguage(key, word) : null;
					if(language === null || language !== translateTo) {
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
								value: 'Translate Error: Unknown'
							});
						});
					}
				} else {
					vscode.window.showInformationMessage('Add yandex API key in settings to enable hover translate');
				}
			}
		});
		disposables.push(disposable);
	}
}

function disposeAll() {
	if (disposables) {
	disposables.forEach(item => item.dispose());
	}
	disposables = [];
}

function getLanguage(key, word) {
	return axios.get(`https://translate.yandex.net/api/v1.5/tr.json/detect?key=${key}&text=${encodeURIComponent(word)}`)
	.then(function (response) {
		return response.data.lang;
	})
}