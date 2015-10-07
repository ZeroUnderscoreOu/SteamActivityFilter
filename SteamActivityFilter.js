/*
SteamActivityFilter script 1.1.0
04.2015 written by ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
http://steamcommunity.com/groups/0_oWassup/discussions/3/
*/

//"use strict";

var ActivityContent = $("blotter_content"); // activity block
var ActivityList = {}; // activity list, sorted by author; without explicit assign script crashes on "in" operaton on empty list
var ActivityDay = new Date(); // current day
var BaseURL = g_BlotterNextLoadURL.split("ajaxgetusernews")[0]; // profile link; why I didn't use window.location.href from the start?
function ActivityInitialize() {
	var TempElem = new Element("Div"); // variable for temporary elements; div for filter form and additional elements
	ActivityDay.setHours(0,0,0,0); // activity uses beginning of the day in links
	TempElem.id = "ActivityDiv";
	TempElem.innerHTML = // plain HTML, partly copied from Steam's event setting interface
		'<Style>'
			+ '@import "http://steamcommunity-a.akamaihd.net/public/css/skin_1/calendar.css?v=.944VhImsKDKs";'
			+ '#cal1 {Position: Absolute; Z-Index: 10;}'
			+ '.ActivitySet {Display:Inline-Block; Width:32%; Margin:0; Padding:2px; Border:none;}'
			+ '.ActivityLabel {Display:Block; Max-Width:200px; Max-Height:1.5em; OverFlow:Hidden;}'
			+ '.ActivityRight {Margin-Left: 10px; Float: Right;}'
			+ '.ActivityDate {Width: 100px; Margin-Right: 10px; Text-Align: Center;}'
			+ '.ActivityLength {Width: 25px; Margin-Right: 10px; Text-Align: Center;}'
		+ '</Style>'
		+ '<Form ID="ActivityFilter" OnSubmit="return false;">' // activity filter form
			+ '<FieldSet ID="ActivitySet1" Class="ActivitySet"></FieldSet>'
			+ '<FieldSet ID="ActivitySet2" Class="ActivitySet"></FieldSet>'
			+ '<FieldSet ID="ActivitySet3" Class="ActivitySet"></FieldSet>'
			+ '<Input ID="ActivityDate" Type="Text" Value="Date" Class="ActivityDate" OnFocus="$(\'cal1\').show();">'
			+ '<Input ID="ActivityLength" Type="Text" Value="0" Class="ActivityLength">'
			+ '<Input Type="Button" Value="Load" OnClick="ActivityDayLoad(ActivityDay.getTime()/1000)" Class="btn_darkblue_white_innerfade btn_small_wide">'
			+ '<Input Type="Button" Value="Clear" OnClick="ActivityList={};ActivityFilterClear();ActivityContentClear();" Class="btn_darkblue_white_innerfade btn_small_wide ActivityRight">'
			+ '<Input Type="Button" Value="Filter" OnClick="ActivityContentShow();" Class="btn_darkblue_white_innerfade btn_small_wide ActivityRight">'
		+ '</Form>'
		+ '<Div ID="cal1">' // calendar template
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
		+ '</Div>';
	TempElem = TempElem.appendChild(new Element("Script")); // missing scripts for calendar
	TempElem.src = "http://steamcommunity-a.akamaihd.net/public/javascript/calendar.js?v=.SRHlwwlZP-Ie";
	TempElem.type = "Text/JavaScript";
	TempElem = TempElem.parentElement.appendChild(new Element("Script"));
	TempElem.src = "http://steamcommunity-a.akamaihd.net/public/javascript/group_admin_functions.js?v=18ccuSc9Dzhv&l=english";
	TempElem.type = "Text/JavaScript";
	TempElem = TempElem.parentElement;
	ActivityContent.insertBefore(TempElem,ActivityContent.firstChild); // using innerHTML instead doesn't seem to work
	$("cal1").hide(); // hiding calendar
	$("ActivityDate").value = ActivityDay.toLocaleDateString(); // filling the day
	ActivityCalendarLoad("cal1",parseInt(ActivityDay.getMonth())+1,ActivityDay.getFullYear()); // initializing calendar
};
function ActivityCalendarLoad(CalendarID,NewMonth,NewYear) {
	var PostData = {
		"calendarID": CalendarID
	};
	if (NewMonth!=undefined&&NewYear!=undefined) {
		PostData["month"] = NewMonth;
		PostData["year"] = NewYear;
	};
	createQuery2(BaseURL+"events?action=calendarFeed",ActivityCalendarFill,PostData);
};
function ActivityCalendarFill() {
	if (req.readyState==4) {
		if (req.status==200) {
			var Response = req.responseXML.documentElement;
			var Results = Response.getElementsByTagName("results")[0].firstChild.nodeValue;
			updateInProgress = false;
			if (Results!="OK") {
				alert(Results);
				return;
			};
			var CalendarID = Response.getElementsByTagName("calendarID")[0].firstChild.nodeValue;
			document.getElementById("monthNav_"+CalendarID).innerHTML = Response.getElementsByTagName("monthNav")[0].firstChild.nodeValue.replace(/calChangeMonth/g,"ActivityCalendarLoad"); // changing to local function
			document.getElementById("monthTitle_"+CalendarID).innerHTML = Response.getElementsByTagName("monthTitle")[0].firstChild.nodeValue;
			var DayDiv = document.getElementById("days_"+CalendarID);
			while (DayDiv.childNodes.length>0) {
				DayDiv.removeChild(DayDiv.childNodes[0]);
			};
			var NewDays = Response.getElementsByTagName("day");
			var C = 0;
			for(var X=0;X<NewDays.length;X++) {
				if (C==7) {
					C = 0;
					var Breaker = new Element("Br");
					Breaker.clear = "Left";
					DayDiv.appendChild(Breaker);
				};
				var Day = new Element("A");
				Day.id = NewDays[X].getAttribute("linkID");
				Day.className = NewDays[X].getAttribute("cssClass").replace("noRollover",""); // removing hover style blocking
				//Day.href = NewDays[X].getAttribute("link");
				Day.href = 'javascript:ActivityDaySet("' + Day.id + '","' + CalendarID + '");'; // using own function
				var DayNum = document.createTextNode(NewDays[X].firstChild.nodeValue);
				Day.appendChild(DayNum);
				DayDiv.appendChild(Day);
				C++; // Delphi is better
			};
			setupCalRollovers();
		};
	};
};
function ActivityDaySet(LocDay,LocCalendar) {
	var TempID = LocDay.replace(LocCalendar+"_","").split("/"); // getting day from ID
	var TempDate = new Date("20".concat(TempID[2]),TempID[0]-1,TempID[1]);
	ActivityDay.setTime(TempDate.getTime()); // recording day
	$("ActivityDate").value = TempDate.toLocaleDateString();
	$(LocCalendar).hide(); // hiding after day select
};
function ActivityFilterClear() {
	var TempElem;
	for (var A=1;A<=ActivityContent.getElementsByClassName("ActivitySet").length;A++) {
		TempElem = $("ActivitySet"+A.toString());
		while (TempElem.children.length>0) { // clearing filter form before filling
			TempElem.removeChild(TempElem.lastElementChild);
		};
	};
};
function ActivityContentClear() {
	for (var A=ActivityContent.childNodes.length-1;A>=0;A--) {
		var B = ActivityContent.childNodes[A].id;
		if (B=="blotter_statuspost_form"||B=="ActivityDiv") { // keeping post form & filter
			continue;
		} else {
			ActivityContent.removeChild(ActivityContent.childNodes[A]);
		};
	};
};
function ActivityDayLoad(LocDate) {
	var ActivityLength = parseInt($("ActivityLength").value);
	if (isNaN(ActivityLength)) { // if wrong ammount of days
		//new Effect.Morph("ActivityLength",{style:"Border-Color:#FF9900",duration:0.5});
		//$("ActivityLength").style.borderColor = "";
		new Effect.Highlight("ActivityLength"); // flashy!
		$("ActivityLength").value = 0;
	} else {
		if (ActivityLength<0) {
			ActivityLength = Math.abs(ActivityLength);
			LocDate -= ActivityLength * 86400; // decreasing begin date by day difference
		};
		for (ActivityLength;ActivityLength>=0;ActivityLength--) {
			console.log(new Date((LocDate+86400*ActivityLength)*1000).toString(),BaseURL+"ajaxgetusernews/?start="+(LocDate+86400*ActivityLength).toString());
			//BaseURL+"ajaxgetusernews/?start="+(LocDate+86400*ActivityLength*(ActivityLength>0?+1:-1)).toString() // condition is the same as ActivityLength/ActivityLength*-1
			new Ajax.Request(BaseURL+"ajaxgetusernews/?start="+(LocDate+86400*ActivityLength).toString(),{ // adding ammount of seconds in a day
				insertion: Insertion.Bottom,
				method: "Get",
				onSuccess: function(Data) {
					RecordAJAXPageView(Data.request.url);
					var Response = Data.responseJSON;
					if (Response&&Response.success==true&&Response.blotter_html) {
						g_BlotterNextLoadURL = null; // preventing loading on scrolling
						ActivityParse(Response.blotter_html); // parsing each day separately
					} else if (!Response) {
						ActivityContent.insert({bottom:Data.responseText});
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
	var EventList;
	var EventLinks; // don't confuse with EventLink - former contains dynamic links & latter - link to event author
	var EventScripts;
	var TempElem;
	EventContainer.innerHTML = ContentHTML; // enabling element functions
	EventList = EventContainer.getElementsByClassName("blotter_block"); // all events
	EventLinks = Array.prototype.slice.call(EventContainer.getElementsByClassName("bb_link")); // transforming HTMLCollection to array
	EventLinks = EventLinks.filter(function(FilterMatch){return /dynamiclink_\d+/.test(FilterMatch.id)}); // filtering only replaced links by corresponding IDs
	EventScripts = EventContainer.getElementsByTagName("Script");
	EventScripts = EventScripts[EventScripts.length-1]; // last script, appended at the end of activity; contains dynamic link replacing functions; bit risky to access it by order
	console.log("EventScripts.textContent \r\n",EventScripts.textContent);
	EventScripts.textContent = EventScripts.textContent.replace( // searching for dynamic contents replacing functions and performing replacemnts
		/ReplaceDynamicLink\(\s*[^\\](')dynamiclink_(\d+)\1,\s*[^\\](\")(.*?)\3\s*\);/gi, // unescaped single/double quotes and contents of them
		function(SearchMatch,B1,B2,B3,B4,SearchOffset,SearchString){ // only B2 & B4 (bracket 2 & bracket 4) are needed - serial number & element contents
			//console.log("SearchMatch \r\n",SearchMatch);
			B4 = B4.replace(/\\(['\"\/])/g,"$1"); // simple unescape regexp
			B4 = B4.replace(/\\u(\d+)/g,function(SearchMatch,B1,SearchOffset,SearchString){return "&#"+parseInt(B1,16)+";";}); // bit more complicated regexp, for unicode symbol codes
			EventLinks[B2].outerHTML = B4.replace(/\\r/g,"&#13;").replace(/\\n/g,"&#10;").replace(/\\t/g,"&#09;"); // for some reason JS special characters aren't interpreted
			return ""; // erasing found function
		}
	);
/* same as above replacement, but separately for each match instead of global
	EventLinks.forEach(function(EachMatch){
		EventScripts.textContent = EventScripts.textContent.replace(
			new RegExp("ReplaceDynamicLink\\(\\s*[^\\\\](['\"])"+EachMatch.id+"\\1,\\s*[^\\\\](['\"])(.*?)\\2\\s*\\);","i"), // too much escaping
			function(SearchMatch,B1,B2,B3,SearchOffset,SearchString){
				B3 = B3.replace(/\\(['\"\/])/g,"$1");
				EachMatch.outerHTML = B3.replace(/\\r/g,"&#13;").replace(/\\n/g,"&#10;").replace(/\\t/g,"&#09;");
				return "";
			}
		);
	});
*/
	for (var A=EventList.length-1;A>=0;A--) { // appendChild() doesn't remove elements here, but still
		if (EventList[A].getElementsByClassName("blotter_author_block").length>0) { // event header
			TempElem = EventList[A].getElementsByClassName("blotter_author_block")[0].getElementsByTagName("A");
			for (var B=0;B<TempElem.length;B++) { // cycling through found links
				if((TempElem[B].href.indexOf("/id/")!=-1||TempElem[B].href.indexOf("/profiles/")!=-1)&&/\S/.test(TempElem[B].textContent)) { // checking for link text
					EventAuthor = TempElem[B].textContent;
					EventType = "Player";
					EventLink = TempElem[B].href;
					break;
				};
			};
		} else if (EventList[A].getElementsByClassName("blotter_group_announcement_header").length>0) {
			TempElem = EventList[A].getElementsByClassName("blotter_group_announcement_header")[0].getElementsByTagName("A");
			for (var B=0;B<TempElem.length;B++) {
				if(TempElem[B].href.indexOf("/groups/")!=-1&&/\S/.test(TempElem[B].textContent)) {
					EventAuthor = TempElem[B].textContent;
					EventType = "Group";
					EventLink = TempElem[B].href;
					break;
				};
			};
		} else if (EventList[A].getElementsByClassName("blotter_group_announcement_header_ogg").length>0) {
			TempElem = EventList[A].getElementsByClassName("blotter_group_announcement_header_ogg")[0].getElementsByTagName("A");
			for (var B=0;B<TempElem.length;B++) {
				if(TempElem[B].href.indexOf("/games/")!=-1&&/\S/.test(TempElem[B].textContent)) {
					EventAuthor = TempElem[B].textContent;
					EventType = "Game";
					EventLink = TempElem[B].href;
					break;
				};
			};
		} else if (EventList[A].getElementsByClassName("blotter_daily_rollup").length>0) { // achievements & stuff
			EventAuthor = "Gabe Newell Daily"; // daily news from Gabe
			EventType = "Daily";
			EventLink = "http://steamcommunity.com/id/gabelogannewell";
			//EventAuthor = 22202;
		} else { // checking for unsorted, still haven't checked if script works with some events
			console.log("Other div "+A.toString());
			console.log(EventList[A].outerHTML);
		};
		TempElem = EventLink.split("/"); // getting ID from link
		TempElem = TempElem[TempElem.length-1];
		if (TempElem.length<3) {alert("Link is too short ("+EventLink+").");}; // just to check that none of the links end with a slash
		if (!(TempElem in ActivityList)) {
			ActivityList[TempElem] = new Element("Div");
			ActivityList[TempElem].Name = EventAuthor;
			ActivityList[TempElem].Type = EventType;
		};
		ActivityList[TempElem].appendChild(EventList[A]);
	};
	ActivityFilterShow();
};
function ActivityFilterShow() {
	var SetNumber = 1; // used for switching between FieldSets
	var TempElem;
	ActivityFilterClear(); // preventing duplicates
	for (var LocName in ActivityList) { // creating elements for filter form
		TempElem = new Element("Label"); // label with name
		TempElem.className = "ActivityLabel"; // for CSS
		TempElem.textContent = ActivityList[LocName].Name;
		TempElem = TempElem.insertBefore(new Element("Input"),TempElem.firstChild); // checkbox with ID
		TempElem.type = "Checkbox";
		TempElem.value = LocName;
		$("ActivitySet"+SetNumber.toString()).appendChild(TempElem.parentElement);
		SetNumber++; // switching to next set
		if (SetNumber>ActivityContent.getElementsByClassName("ActivitySet").length) {SetNumber=1}; // wrapping around
	};
};
function ActivityContentShow() {
	var FormElem = $("ActivityFilter").getElementsByTagName("Input"); // all form inputs; bit lazy
	var TempElem;
	ActivityContentClear();
	for (var A in FormElem) {
		if (FormElem[A].checked) { // checking for checked checkboxes
			TempElem = ActivityList[FormElem[A].value].clone(true); // true for deep cloning
			var ScriptList = TempElem.getElementsByTagName("Script");
			var ActivityScript = new Element("Script");
			for (var B=ScriptList.length-1;B>=0;B--) { // hack to make scripts work - removing them from activity element and readding
				ActivityScript.textContent += "\n" + ScriptList[B].textContent;
				ScriptList[B].outerHTML = ""; // preventing duplicates; none of standart removing functions work because ScriptList doesn't have parent because it's not in document
			};
			ActivityContent.appendChild(TempElem);
			ActivityContent.appendChild(ActivityScript);
		};
	};
};
ActivityInitialize();
