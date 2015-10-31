/*
SteamActivityFilter userscript 1.2.2
Written by ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
http://steamcommunity.com/groups/0_oWassup/discussions/3/
https://github.com/ZeroUnderscoreOu/SteamActivityFilter
*/

// ==UserScript==
// @name        SteamActivityFilter
// @author      ZeroUnderscoreOu
// @version     1.2.2
// @icon        https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilter128.png
// @description Filter for friends' activity in Steam. Allows to load activity for selected days and display needed part of it.
// @downloadURL https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Greasemonkey/SteamActivityFilter.user.js
// @updateURL   https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Greasemonkey/SteamActivityFilter.user.js
// @namespace   https://github.com/ZeroUnderscoreOu/
// @include     *://steamcommunity.com/*/home*
// @run-at      document-end
// @grant       GM_getResourceText
// @resource    SteamActivityFilter https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/SteamActivityFilter.js
// ==/UserScript==

(function(){
	var TempElem = document.createElement("Script");
	TempElem.type = "Text/JavaScript";
	TempElem.textContent = GM_getResourceText("SteamActivityFilter");
	document.head.appendChild(TempElem);
})();