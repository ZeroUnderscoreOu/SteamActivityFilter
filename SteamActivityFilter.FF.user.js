// ==UserScript==
// @name        SteamActivityFilter
// @version     1.00
// @description Firefox UserJS wrap for SteamActivityFilter script
// @author      http://steamcommunity.com/id/ZeroUnderscoreOu/
// @namespace   https://github.com/ZeroUnderscoreOu/
// @downloadURL https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/UserJS-version/SteamActivityFilter.user.js
// @updateURL   https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/UserJS-version/SteamActivityFilter.user.js
// @include     http://steamcommunity.com/*/home/
// @run-at      document-end
// @grant       GM_getResourceText
// @icon        https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilterLogo.png
// @resource    SteamActivityFilter https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilter.js
// ==/UserScript==

(function() {
	var TempElem = document.createElement("Script");
	TempElem.type = "Text/JavaScript";
	TempElem.textContent = GM_getResourceText("SteamActivityFilter");
	document.head.appendChild(TempElem);
})();
