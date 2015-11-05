var ScriptRequest = new XMLHttpRequest();
ScriptRequest.open("Get",chrome.extension.getURL("SteamActivityFilter.js"));
ScriptRequest.onload = function() {
	var ScriptElement = document.createElement("Script");
	ScriptElement.textContent = ScriptRequest.response;
	document.body.appendChild(ScriptElement);
};
ScriptRequest.send();