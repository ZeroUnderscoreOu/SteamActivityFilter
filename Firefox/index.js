var Self = require("sdk/self");
var PageMod = require("sdk/page-mod").PageMod;
var TempFunc = 'var TempElem = document.createElement("Script");' // inserting into page context
	+ 'TempElem.type = "Text/JavaScript";'
	+ 'TempElem.textContent = decodeURI("' + encodeURI(Self.data.load("./SteamActivityFilter.js")) + '");' // escaping & then unescaping
	+ 'document.head.appendChild(TempElem);';
PageMod({
	include: /.*steamcommunity.com\/.*\/home.*/,
	contentScript: TempFunc
});