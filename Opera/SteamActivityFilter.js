/*
SteamActivityFilter userscript 1.2.3
Written by ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
http://steamcommunity.com/groups/0_oWassup/discussions/3/
https://github.com/ZeroUnderscoreOu/SteamActivityFilter
*/

"use strict";

//ToDo
// (возможно) переписать new Element() на document.createElement() и $() на document.getElementById()
// (возможно) перенести SetNumber++ в условие с префиксной записью
// (возможно) добавить сортировку по алфавиту
// "Seamonkey": "2.37 - 2.41"

var ActivityContainer = $("blotter_content"); // activity block
var ActivityList = {}; // activity list, sorted by author; without explicit assign script crashes on "in" operaton on empty list
var ActivityDay = new Date(); // current day
//var BaseURL = g_BlotterNextLoadURL.split("ajaxgetusernews")[0]; // depends on fully loaded activity
//var BaseURL = "http://steamcommunity.com/my/"; // redirects, causes problems with some requests
var BaseURL = document.location.href.split("home")[0]; // profile link; why I didn't use window.location.href from the start?
/*
function ActivityCheck() {
	if ($("blotter_throbber").visible()) { // if activity is loading
		var IntervalID = setTimeout(function() { // I don't fully understand why, but it works only with anonymized function
			ActivityCheck();
			clearInterval(IntervalID);
		},500);
	} else {
		ActivityInitialize();
	};
};
*/
function ActivityInitialize() {
	var TempElem = new Element("Div"); // variable for temporary elements; div for filter form and additional elements
	ActivityDay.setHours(0,0,0,0); // activity uses beginning of the day in links
	//TempElem.id = "ActivityMainDiv";
	TempElem.innerHTML = // plain HTML, partly copied from Steam's event setting interface
		'<Style>'
			+ '@import "http://steamcommunity-a.akamaihd.net/public/css/skin_1/calendar.css?v=.944VhImsKDKs";'
			+ '#cal1 {Position:Absolute; Z-Index:10;}'
			+ '.ActivityDiv {Display:Inline-Block; Width:33%; Margin:0px; Padding:0px; Border:None; OverFlow:Hidden; Text-Align:Left;}'
			+ '.ActivityLabel {Display:Block; White-Space:Pre;}'
			+ '.ActivityCenter {Text-Align:Center;}'
			+ '.ActivityStart {Width:100px;}'
			+ '.ActivityLength {Width:25px;}'
			+ '.ActivitySpacer {Display:Inline-Block; Min-Width:10px;}'
			+ '#blotter_throbber {Display:Inline-Block; Position:Fixed; Left:0px; Top:0px; Width:100%; Height:100%; Margin-Top: 0px; Background-Color: RGBA(0,0,0,0.5); Z-Index:500;}' // overriding Steam's style; I don't know why I had to set Z-Index so high
			+ '.throbber {Position:Relative; Top:250px;}' // also overriding
		+ '</Style>'
		+ '<Form ID="ActivityFilter" OnSubmit="ActivityDayLoad(ActivityDay.getTime()/1000);return false;" Class="ActivityCenter">' // activity filter form
			+ '<Div ID="ActivityDiv1" Class="ActivityDiv"></Div>'
			+ '<Div ID="ActivityDiv2" Class="ActivityDiv"></Div>'
			+ '<Div ID="ActivityDiv3" Class="ActivityDiv"></Div>'
			+ '<Br>'
			+ '<Div Style="Float:Left;">' // left part; styled through attribute because it's the only element needing this style
				+ '<Input ID="ActivityStart" Type="Text" Value="Day" Class="ActivityCenter ActivityStart" OnFocus="new Effect.Appear(\'cal1\',{duration:0.5});">'
				+ '<B> + </B>'
				+ '<Input ID="ActivityLength" Type="Text" Value="0" Class="ActivityCenter ActivityLength">'
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Type="Submit" Value="Load" Class="btn_green_white_innerfade btn_small_wide">'
			+ '</Div>'
			+ '<Div Style="Display:Inline-Block;">' // center part; styled for proper display
				+ '<Input Type="Button" Value="   All   " OnClick="ActivityCheckboxes(true);" Class="btn_grey_black btn_small_thin">' // spaces to make width similar to "None" button
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Type="Button" Value="None" OnClick="ActivityCheckboxes(false);" Class="btn_grey_black btn_small_thin">'
			+ '</Div>'
			+ '<Div Style="Float:Right;">' // right part
				+ '<Input Type="Button" Value="Clear" OnClick="ActivityList={};ActivityFilterClear();ActivityContentClear();" Class="btn_grey_black btn_small_wide">'
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Type="Button" Value="Filter" OnClick="ActivityContentShow();" Class="btn_green_white_innerfade btn_small_wide">'
			+ '</Div>'
		+ '</Form>'
		+ '<Div ID="cal1" Style="Display:None;">' // calendar template
			+ '<Div ID="calendarBox_cal1" Class="calendarBox">'
				+ '<Div ID="monthRow_cal1" Class="monthRow">'
					+ '<Div ID="monthNav_cal1" Class="monthNav"></Div>'
					+ '<H1 ID="monthTitle_cal1" Class="monthTitle"></H1>'
				+ '</Div>'
				+ '<Div ID="weekHead_cal1" Class="weekHead">'
					+ '<Div Class="day">S</Div>'
					+ '<Div Class="day">M</Div>'
					+ '<Div Class="day">T</Div>'
					+ '<Div Class="day">W</Div>'
					+ '<Div Class="day">T</Div>'
					+ '<Div Class="day">F</Div>'
					+ '<Div Class="day">S</Div>'
				+ '</Div>'
				+ '<Div ID="days_cal1" Class="days"></Div>'
			+ '</Div>'
		+ '</Div>'
		+ '<Br>';
	TempElem = TempElem.appendChild(new Element("Script")); // missing scripts for calendar
	TempElem.src = "http://steamcommunity-a.akamaihd.net/public/javascript/calendar.js?v=.SRHlwwlZP-Ie";
	TempElem.type = "Text/JavaScript";
	TempElem = TempElem.parentElement.appendChild(new Element("Script"));
	TempElem.src = "http://steamcommunity-a.akamaihd.net/public/javascript/group_admin_functions.js?v=18ccuSc9Dzhv&l=english";
	TempElem.type = "Text/JavaScript";
	TempElem = TempElem.parentElement;
	ActivityContainer.insertBefore(TempElem,ActivityContainer.firstChild); // using innerHTML instead doesn't seem to work
	$("ActivityStart").value = ActivityDay.toLocaleDateString(); // filling the day
	ActivityCalendarLoad("cal1",parseInt(ActivityDay.getMonth())+1,ActivityDay.getFullYear()); // initializing calendar
};
function ActivityCalendarLoad(CalendarID,NewMonth,NewYear,GroupCalendar) {
	var CalendarURL;
	var PostData = {
		"calendarID": CalendarID
	};
	if (GroupCalendar) { // using alternative calendar URL
		CalendarURL = "http://steamcommunity.com/groups/0_oWassup/"; // URL of an awesome group
	} else {
		CalendarURL = BaseURL;
	};
	if (NewMonth!=undefined&&NewYear!=undefined) {
		PostData["month"] = NewMonth;
		PostData["year"] = NewYear;
	};
	//createQuery2(CalendarURL+"events?action=calendarFeed",ActivityCalendarFill,PostData);
	new Ajax.Request(CalendarURL+"events?action=calendarFeed",{ // adding day length in seconds
		method: "post",
		parameters: PostData,
		onSuccess: function(Data) {
			var Response = Data.responseXML.documentElement;
			var Results = Response.getElementsByTagName("results")[0].firstChild.nodeValue;
			if (Results=="OK") { // more checks probably should be here, including for Response
				ActivityCalendarFill(Response);
			} else {
				alert("Error\r\n"+Results);
			};
		},
		onFailure: function(Data) {
			if (!GroupCalendar) { // checking if already using alternative variant
				new Effect.Highlight("ActivityStart"); // indicating an error loading calendar
				ActivityCalendarLoad(CalendarID,NewMonth,NewYear,true); // trying alternative
			} else {
				if (Data.responseText) {
					alert(Data.statusText+"\r\n"+Data.responseText);
				} else {
					alert(Data.statusText+"\r\nCouldn't load calendar.");
				};
			};
		}
	});
};
function ActivityCalendarFill(Response) {
/*
	if (req.readyState==4) {
		if (req.status==200) {
			var Response = req.responseXML.documentElement;
			var Results = Response.getElementsByTagName("results")[0].firstChild.nodeValue;
			updateInProgress = false;
			if (Results!="OK") {
				alert(Results);
				return;
			};
		};
	};
*/
	var CalendarID = Response.getElementsByTagName("calendarID")[0].firstChild.nodeValue;
	var HTMLDays = document.getElementById("days_"+CalendarID);
	var XMLDays = Response.getElementsByTagName("day");
	var DayCounter = 0;
	document.getElementById("monthNav_"+CalendarID).innerHTML = Response.getElementsByTagName("monthNav")[0].firstChild.nodeValue.replace(/calChangeMonth/g,"ActivityCalendarLoad"); // changing to local function
	document.getElementById("monthTitle_"+CalendarID).innerHTML = Response.getElementsByTagName("monthTitle")[0].firstChild.nodeValue;
	while (HTMLDays.childNodes.length>0) {
		HTMLDays.removeChild(HTMLDays.childNodes[0]);
	};
	for (var A=0;A<XMLDays.length;A++) {
		if (DayCounter==7) {
			DayCounter = 0;
			var Breaker = new Element("Br");
			Breaker.clear = "Left";
			HTMLDays.appendChild(Breaker);
		};
		var NewDay = new Element("A");
		NewDay.textContent = XMLDays[A].firstChild.nodeValue;
		NewDay.id = XMLDays[A].getAttribute("linkID");
		NewDay.className = XMLDays[A].getAttribute("cssClass").replace("noRollover",""); // removing hover style blocking
		NewDay.onclick = ActivityDaySet.bind(NewDay.id); // using own function, binding the clicked day ID
		HTMLDays.appendChild(NewDay);
		DayCounter++;
	};
	setupCalRollovers();
};
function ActivityDaySet() {
	var CalendarID = this.split("_"); // day ID, containing calendar ID & date
	var ThisDay = CalendarID[1].split("/"); // getting date
	CalendarID = CalendarID[0]; // getting calendar ID
	ThisDay = new Date("20"+ThisDay[2],ThisDay[0]-1,ThisDay[1]); // turning into date object
	ActivityDay.setTime(ThisDay.getTime()); // recording day
	$("ActivityStart").value = ThisDay.toLocaleDateString();
	new Effect.Fade(CalendarID,{duration:0.5}); // hiding after day select
};
function ActivityFilterClear() {
	var TempElem = ActivityContainer.getElementsByClassName("ActivityDiv");
	for (var A=0;A<TempElem.length;A++) { // clearing filter form before filling
		TempElem[A].innerHTML = ""; // faster then removing elements separately
	};
};
function ActivityContentClear() {
	var TempElem = ActivityContainer.getElementsByClassName("blotter_day");
	while (TempElem.length>0) {
		/*
		new Effect.Fade(TempElem[0],{duration:0.5}); // bit excessive, but swag
		var IntervalID = setTimeout(function() { // too bad it conflicts with showing swag because of asynchrony
			ActivityContainer.removeChild(this);
			clearInterval(IntervalID);
		}.bind(TempElem[0]),1000);
		*/
		TempElem[0].parentElement.removeChild(TempElem[0]); // ActivityContainer contains all found elements but is not always their direct parent
	};
};
function ActivityCheckboxes(TargetState) {
	var Checkboxes = $("ActivityFilter").getElementsByClassName("ActivityCheckbox");
	for (var A=0;A<Checkboxes.length;A++) { // setting all filter checkboxes to the passed state if they're not already
		if (Checkboxes[A].checked!=TargetState) {
			Checkboxes[A].checked = TargetState;
		};
	};
};
function ActivityDayLoad(LoadingDay) {
	var Period = parseInt($("ActivityLength").value);
	if (isNaN(Period)) { // if wrong ammount of days
		new Effect.Highlight("ActivityLength"); // flashy!
		$("ActivityLength").value = 0;
	} else {
		new Effect.Appear("blotter_throbber",{duration:0.5}); // loading indicator
		if (Period<0) {
			Period = Math.abs(Period);
			LoadingDay -= Period * 86400; // decreasing begin date by difference in days
		};
		for (Period;Period>=0;Period--) {
			var CurDay = LoadingDay + 86400 * Period; // currently loading day, in seconds
			console.log(new Date(CurDay*1000).toString(),BaseURL+"ajaxgetusernews/?start="+CurDay.toString());
			//BaseURL+"ajaxgetusernews/?start="+(CurDay*(Period>0?+1:-1)).toString() // condition is the same as Period/Period*-1
			new Ajax.Request(BaseURL+"ajaxgetusernews/?start="+CurDay.toString(),{ // adding day length in seconds
				insertion: Insertion.Bottom,
				method: "get",
				onSuccess: function(Data) {
					var Response = Data.responseJSON;
					var RequestDay = Data.request.url.split("start=")[1]; // have to get day again because of asynchrony
					var MessageDay = new Date(RequestDay*1000).toLocaleDateString() + "\r\n"; // for error messages
					if (Response.timestart==RequestDay) { // checking that Steam returned requested day and not a different one
						if (Response&&Response.success==true&&Response.blotter_html) {
							g_BlotterNextLoadURL = null; // preventing loading on scrolling
							ActivityParse(Response.blotter_html); // parsing each day separately
						} else if (Data.responseText) {
							//ActivityContainer.insert({bottom:Data.responseText});
							alert(MessageDay+Data.responseText);
						} else {
							alert(MessageDay+Data.statusText+"\r\nCouldn't load activity.");
						};
					} else {
						alert(MessageDay+"Different day returned ("+new Date(Response.timestart*1000).toLocaleDateString()+").");
					};
				},
				onFailure: function(Data) {
					var Response = Data.responseJSON;
					var RequestDay = Data.request.url.split("start=")[1];
					var MessageDay = new Date(RequestDay*1000).toLocaleDateString() + "\r\n";
					if (Response&&Response.message) {
						//ActivityContainer.insert({bottom:Response.message});
						alert(MessageDay+Response.message);
					} else if (Data.responseText) {
						//ActivityContainer.insert({bottom:Data.responseText});
						alert(MessageDay+Data.responseText);
					} else {
						alert(MessageDay+Data.statusText+"\r\nCouldn't load activity.");
					};
				},
				onComplete: function(Data) {
					if (Data.request.url.split("start=")[1]==LoadingDay) { // loading finished; Data.responseJSON.timestart may be from different day
						new Effect.Fade("blotter_throbber",{duration:0.5});
					};
				}
			});
		};
	};
};
function ActivityParse(ContentHTML) {
	var EventAuthor;
	var EventType;
	var EventLink;
	var EventContainer = new Element("Div"); // container element for activity
	var EventElements;
	var EventScripts;
	var TempElem;
	EventContainer.innerHTML = ContentHTML; // enabling element functions
	//EventContainer.update(ContentHTML); update() doesn't fit, because it removes scripts from HTML
	EventElements = [].slice.call(EventContainer.getElementsByClassName("bb_link")); // transforming HTMLCollection to array
	EventElements = EventElements.filter(function(Match){return /dynamiclink_\d+/.test(Match.id)}); // filtering only replaced links by corresponding IDs
	EventScripts = EventContainer.getElementsByTagName("Script");
	EventScripts = EventScripts[EventScripts.length-1]; // last script, appended at the end of activity; contains dynamic link replacing functions; bit risky to access it by order
	EventContainer = EventContainer.getElementsByClassName("blotter_block"); // all events
	if (EventScripts&&/ReplaceDynamicLink/.test(EventScripts.textContent)) { // ending script is not always present
		EventScripts.textContent = EventScripts.textContent.replace( // searching for dynamic contents replacing functions and performing replacemnts
			/ReplaceDynamicLink\(\s*[^\\](')dynamiclink_(\d+)\1,\s*[^\\](\")(.*?)\3\s*\);/gi, // unescaped single/double quotes and contents of them
			function(Match,B1,B2,B3,B4,Offset,Variable){ // only B2 & B4 (bracket 2 & bracket 4) are needed - serial number & element contents
				B4 = B4.replace(/\\u(\d+)/g,function(Match,B1,Offset,Variable){return "&#"+parseInt(B1,16)+";";}); // bit complicated regexp, for unicode symbol codes
				B4 = B4.replace(/\\r/g,"&#13;").replace(/\\n/g,"&#10;").replace(/\\t/g,"&#09;"); // carriage return, new line & tab
				EventElements[B2].outerHTML = B4.replace(/\\(.)/g,"$1"); // simple unescape
				return ""; // erasing found function
			}
		);
	};
	/* same as above replacement, but separately for each match instead of global
	EventElements.forEach(function(Match){
		EventScripts.textContent = EventScripts.textContent.replace(
			new RegExp("ReplaceDynamicLink\\(\\s*[^\\\\](['\"])"+Match.id+"\\1,\\s*[^\\\\](['\"])(.*?)\\2\\s*\\);","i"), // too much escaping
			function(Match,B1,B2,B3,Offset,Variable){
				B3 = B3.replace(/\\(['\"\/])/g,"$1");
				Match.outerHTML = B3.replace(/\\r/g,"&#13;").replace(/\\n/g,"&#10;").replace(/\\t/g,"&#09;");
				return "";
			}
		);
	});
	*/
	while (EventContainer.length>0) { // appendChild() doesn't remove elements here, but still
		if (EventContainer[0].getElementsByClassName("blotter_author_block").length>0) { // event header
			TempElem = EventContainer[0].getElementsByClassName("blotter_author_block")[0].getElementsByTagName("A");
			for (var A=0;A<TempElem.length;A++) { // cycling through found links
				if ((TempElem[A].href.indexOf("/id/")!=-1||TempElem[A].href.indexOf("/profiles/")!=-1)&&/\S/.test(TempElem[A].textContent)) { // checking for link text
					EventAuthor = TempElem[A].textContent;
					EventType = "Player";
					EventLink = TempElem[A].href;
					break;
				};
			};
		} else if (EventContainer[0].getElementsByClassName("blotter_group_announcement_header").length>0) {
			TempElem = EventContainer[0].getElementsByClassName("blotter_group_announcement_header")[0].getElementsByTagName("A");
			for (var A=0;A<TempElem.length;A++) {
				if (TempElem[A].href.indexOf("/groups/")!=-1&&/\S/.test(TempElem[A].textContent)) {
					EventAuthor = TempElem[A].textContent;
					EventType = "Group";
					EventLink = TempElem[A].href;
					break;
				};
			};
		} else if (EventContainer[0].getElementsByClassName("blotter_group_announcement_header_ogg").length>0) {
			TempElem = EventContainer[0].getElementsByClassName("blotter_group_announcement_header_ogg")[0].getElementsByTagName("A");
			for (var A=0;A<TempElem.length;A++) {
				if (TempElem[A].href.indexOf("/games/")!=-1&&/\S/.test(TempElem[A].textContent)) {
					EventAuthor = TempElem[A].textContent;
					EventType = "Game";
					EventLink = TempElem[A].href;
					break;
				};
			};
		} else if (EventContainer[0].getElementsByClassName("blotter_daily_rollup").length>0) { // achievements & stuff
			EventAuthor = "Gabe Newell Daily"; // daily news from Gabe
			EventType = "Daily";
			EventLink = "http://steamcommunity.com/id/gabelogannewell";
			//EventAuthor = 22202;
		} else { // checking for unsorted, still not sure if script works with all events
			console.log("Unsorted activity\r\n",EventContainer[0].outerHTML);
		};
		TempElem = EventLink.split("/"); // getting ID from link
		TempElem = TempElem[TempElem.length-1];
		if (TempElem.length<3) { // just to check that none of the links end with a slash
			alert("Link is too short ("+EventLink+").");
		};
		if (!(TempElem in ActivityList)) {
			ActivityList[TempElem] = {
				"Name": EventAuthor,
				"Type": EventType,
				"Content": new Element("Div")
			};
			ActivityList[TempElem]["Content"].className = "blotter_day"; // for easier access to shown divs
			ActivityList[TempElem]["Content"].hide(); // hiding to use an effect later
		};
		EventElements = EventContainer[0].getElementsByTagName("Script");
		EventScripts = new Element("Script");
		while (EventElements.length>0) { // hack to make scripts work - removing them from activity element and readding
			EventScripts.textContent += "\r\n" + EventElements[0].textContent;
			EventElements[0].parentElement.removeChild(EventElements[0]); // preventing duplicates; EventContainer[0] is not always direct parent
			//EventElements[0].outerHTML = ""; // another variant of removing the script
		};
		EventContainer[0].appendChild(EventScripts); // readding
		ActivityList[TempElem]["Content"].appendChild(EventContainer[0]);
	};
	ActivityFilterShow();
};
function ActivityFilterShow() {
	var SetNumber = 1; // used for switching between divs
	var TempElem;
	ActivityFilterClear(); // preventing duplicates
	for (var LocName in ActivityList) { // creating elements for filter form
		TempElem = new Element("Label"); // label with author's name
		TempElem.className = "ActivityLabel"; // for CSS
		TempElem.textContent = ActivityList[LocName]["Name"];
		TempElem = TempElem.insertBefore(new Element("Input"),TempElem.firstChild); // checkbox with ID
		TempElem.type = "Checkbox";
		TempElem.value = LocName;
		TempElem.className = "ActivityCheckbox"; // for easier access to checkboxes
		$("ActivityDiv"+SetNumber.toString()).appendChild(TempElem.parentElement);
		SetNumber++; // switching to next set
		if (SetNumber>ActivityContainer.getElementsByClassName("ActivityDiv").length) {
			SetNumber=1; // wrapping around
		};
	};
};
function ActivityContentShow() {
	var Checkboxes = $("ActivityFilter").getElementsByClassName("ActivityCheckbox"); // all filter checkboxes
	var TempElem;
	ActivityContentClear();
	for (var A=0;A<Checkboxes.length;A++) {
		if (Checkboxes[A].checked) { // checking for checked checkboxes
			TempElem = ActivityList[Checkboxes[A].value]["Content"].clone(true); // true for deep cloning; turns out cloning isn't actually necessary
			if (TempElem.getElementsByClassName("highlight_strip_scroll").length>0) { // checking for screenshot galleries' preview panel
				var IntervalID = setTimeout(function() {
					Blotter_AddHighlightSliders(); // setting scrollbars for it after the effect (panel should be visible)
					clearInterval(IntervalID);
				},1000);
			};
			ActivityContainer.appendChild(TempElem);
			new Effect.Appear(TempElem,{duration:0.5}); // showing off
		};
	};
};
ActivityInitialize();