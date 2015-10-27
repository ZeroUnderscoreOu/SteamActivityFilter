/*
SteamActivityFilter userscript 1.2.0
Written by ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
http://steamcommunity.com/groups/0_oWassup/discussions/3/
https://github.com/ZeroUnderscoreOu/SteamActivityFilter
*/

// ==UserScript==
// @name        SteamActivityFilter
// @version     1.2.0
// @description Filter for friends' activity in Steam. Allows to load activity for selected days and display needed part of it.
// @author      http://steamcommunity.com/id/ZeroUnderscoreOu/
// @namespace   https://github.com/ZeroUnderscoreOu/
// @downloadURL https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Greasemonkey/SteamActivityFilter.user.js
// @updateURL   https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Greasemonkey/SteamActivityFilter.user.js
// @include     *://steamcommunity.com/*/home*
// @run-at      document-end
// @grant       GM_getResourceText
// @icon        https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilter128.png
// @resource    SteamActivityFilter https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilter.js
// ==/UserScript==

(function(){
	var TempElem = document.createElement("Script");
	TempElem.type = "Text/JavaScript";
	TempElem.textContent = GM_getResourceText("SteamActivityFilter");
	document.head.appendChild(TempElem);
})();