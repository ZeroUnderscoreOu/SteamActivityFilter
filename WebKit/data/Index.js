var ScriptRequest = new XMLHttpRequest();
ScriptRequest.open("Get",chrome.extension.getURL("data/SteamActivityFilter.js"));
ScriptRequest.onload = function() {
	var ScriptElement = document.createElement("Script");
	ScriptElement.type = "Text/JavaScript";
	ScriptElement.textContent = ScriptRequest.response;
	document.head.appendChild(ScriptElement);
};
ScriptRequest.send();