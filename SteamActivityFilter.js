/*
SteamActivityFilter script

ActivityDayLoad() - reworked version of StartLoadingBlotter(); g_BlotterNextLoadURL removed to prevent further loading; Blotter_RemoveDuplicates() removed to prevent hiding duplicates, which may hide an event when sorted by user; uses only requested day as a parameter, with base URL being in the function.
g_BlotterNextLoadURL is cleaned as a global variable also to prevent further loading.
In ActivityParse links are cycled through, because their position in page source isn't constant depending on the event; some events contain additional links, which should be skipped; regexp is used to check for link text - avatar links contain new lines & tabs instead of being empty; \w doesn't work with russian - apparently russian doesn't have letters.
ActivityList contains sorted activity, stored by author's ID; has additional fields for author's name & activity type (.Name & .Type respectively).
ActivityCalendarLoad() - reworked version of calChangeMonth(), calling ActivityCalendarFill() instead of calChangeReceive() and with calChangeMonthExtraFunc removed as superfluous.
ActivityCalendarFill() - reworked version of calChangeReceive(), changing links of month navigation & day elements; new Element() used instead of document.createElement(); probably will change or add an option for week start.
BaseURL is used for links for profile related resources; it's gotten from g_BlotterNextLoadURL, because http://steamcommunity.com/my/ & http://steamcommunity.com/profiles/ doesn't work with the calendar - probably because of the redirect, each month loading attempt loads current month.
Some of the URLs are hardcoded in functions, which is probably not the most compatible way.
Unlike group calendar, personal calendar has a hardcoded ID in XML response, and though ID is required in ActivityCalendarLoad(), it's not used.
All cycles which removeChild() from cycled or appendChild() to another object go from end to beginning to avoid accessing deleted elements (in some functions appendChild() doesn't actually remove, but as I didn't check exact conditions for removing, I follow this rule).
Partly due to asynchronous work of data loading, functions are chained for them to work when data is really loaded.
Order & actions of functions:
	ActivityFilterLoad() - independent, called at script begin
		basic preparation, setting variables & adding elements to the page
	ActivityClear() - independent, used by ActivityShow()
		clearing of displayed activity
	ActivityShow() - independent, called by form button
		displaying filtered activity
	ActivityDayLoad() - independent, called by form button
		loading activity for set day
	ActivityParse() - called by ActivityDayLoad()
		sorting activity by author & getting info
	ActivityFilterShow() - called by ActivityParse()
		generating filter form elements
	ActivityCalendarLoad() - independent, used by form calendar and on calendar initialisation at ActivityFilterLoad() (assigned to calendar elements at ActivityCalendarFill())
		loading calendar content
	ActivityCalendarFill() - called by ActivityCalendarLoad() (by XML request in it)
		writing loaded content to form calendar
	ActivityDaySet() - independent, called by form calendar (assigned to calendar elements at ActivityCalendarFill())
		setting day to load activity for
Theoretically, the script may lead to memory overload, as all activity info is cloned from sorted list (ActivityList) to displayed list (page itself). Sorted list is kept constantly during the work, while displayed list is cleared on any new filtering. But I don't know how browser works with cloned elements and if they're actually removed on removeChild().

04.2015
ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
*/

// ToDo
// сделать рефактор на onComplete для запросов
// (возможно) вынести начальную функцию в основное тело
// (возможно) сменить инициализацию переменных через object на использование null
// (возможно) сделать обязательную инициализацию всех переменных в Делфи-подобном стиле
// включить обратно автозагрузку до использования фильтра
// переименовать локальные переменные с *Cur в Loc*

var ActivityContent = $("blotter_content"); // activity block
var ActivityList = new Object();
var ActivityDay = new Date(); // current day
ActivityDay.setHours(0,0,0,0); // activity uses beginning of the day in links
var BaseURL = g_BlotterNextLoadURL.split("ajaxgetusernews")[0]; // profile link
var g_BlotterNextLoadURL = null; // preventing loading on scrolling
//ActivityFilterLoad(); // loading
var TempElem = new Element("Div"); // div for filter form and additional elements
TempElem.id = "DivFilter";
TempElem.innerHTML = // plain HTML, partly copied from Steam's event setting interface
	'<Style>'
		+ '@import "http://steamcommunity-a.akamaihd.net/public/css/skin_1/calendar.css?v=.944VhImsKDKs";'
		+ '#cal1 {Position: Absolute; Z-Index: 1;}'
		+ '.ActivitySet {Display:Inline-Block; Width:32%; Margin:0; Padding:2px; Border:none;}'
		+ '.ActivityLabel {Display:Block; Max-Width:200px; Max-Height:1.5em; OverFlow:Hidden;}'
		+ '.FilterButton {Float: Right;}'
		+ '.FilterDay {Width: 100px; Margin-Right: 10px; Text-Align: Center;}'
	+ '</Style>'
	+ '<Form ID="ActivityFilter" OnSubmit="return false;">' // activity filter form
		+ '<FieldSet ID="ActivitySet1" Class="ActivitySet"></FieldSet>'
		+ '<FieldSet ID="ActivitySet2" Class="ActivitySet"></FieldSet>'
		+ '<FieldSet ID="ActivitySet3" Class="ActivitySet"></FieldSet>'
		+ '<Input ID="ActivityInput" Type="Text" Value="Day" Class="FilterDay" OnFocus="$(\'cal1\').show();">'
		+ '<Input Type="Button" Value="Load" OnClick="ActivityDayLoad(ActivityDay.getTime()/1000)" Class="btn_darkblue_white_innerfade btn_small_wide">'
		+ '<Input Type="Button" Value="Filter" OnClick="ActivityShow();" Class="btn_darkblue_white_innerfade btn_small_wide FilterButton">'
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
$("ActivityInput").value = ActivityDay.toLocaleDateString(); // filling the day
ActivityCalendarLoad("cal1",parseInt(ActivityDay.getMonth())+1,ActivityDay.getFullYear()); // calendar initialisation
function ActivityClear() {
	for (var A=ActivityContent.children.length-1;A>=0;A--) {
		var B = ActivityContent.children[A].id;
		if (B=="blotter_statuspost_form"||B=="DivFilter") { // keeping post form & filter
			continue;
		} else {
			ActivityContent.removeChild(ActivityContent.children[A]);
		};
	};
};
function ActivityDayLoad(DateCur) {
	new Ajax.Request(BaseURL+"ajaxgetusernews/?start="+DateCur,{
		insertion: Insertion.Bottom,
		method: "Get",
		onSuccess: function(Transport) {
			RecordAJAXPageView(Transport.request.url);
			var Response = Transport.responseJSON;
			if (Response&&Response.success==true&&Response.blotter_html) {
				ActivityParse(Response.blotter_html);
			} else if (!Response) {
				ActivityContent.insert({bottom:Transport.responseText});
			};
		}
	});
};
function ActivityParse(ContentHTML) {
	var EventAuthor = new Object();
	var EventType = String();
	var EventLink = String();
	var EventContainer = new Element("Div");
	//var TempElem = new Object();
	EventContainer.innerHTML = ContentHTML; // enabling tag functions
	var EventList = EventContainer.getElementsByClassName("blotter_block"); // all events
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
		} else if (EventList[A].getElementsByClassName("blotter_daily_rollup").length>0) { // achievements & stuff
			EventAuthor = "Gabe Newell Daily"; // daily news from Gabe
			EventType = "Daily";
			EventLink = "http://steamcommunity.com/id/gabelogannewell";
			//EventAuthor = 22202;
		} else { // checking for unsorted, still haven't checked if script works with some events
			console.log("Other div "+A.toString()+" "+EventList[A]);
		};
		TempElem = EventLink.split("/"); // getting ID from link
		TempElem = TempElem[TempElem.length-1];
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
	//var TempElem = new Object();
	var SetNumber = Number(); // used for switching between FieldSets
	for (SetNumber=1;SetNumber<=ActivityContent.getElementsByClassName("ActivitySet").length;SetNumber++) {
		TempElem = $("ActivitySet"+SetNumber.toString());
		while (TempElem.children.length>0) { // clearing filter form before filling
			TempElem.removeChild(TempElem.lastElementChild);
		};
	};
	SetNumber = 1;
	for (var NameCur in ActivityList) { // creating elements for filter form
		TempElem = new Element("Label"); // label with name
		TempElem.className = "ActivityLabel"; // for CSS
		TempElem.textContent = ActivityList[NameCur].Name;
		TempElem = TempElem.insertBefore(new Element("Input"),TempElem.firstChild); // checkbox with ID
		TempElem.type = "Checkbox";
		TempElem.value = NameCur;
		$("ActivitySet"+SetNumber.toString()).appendChild(TempElem.parentElement);
		SetNumber++; // switching to next set
		if (SetNumber>ActivityContent.getElementsByClassName("ActivitySet").length) {SetNumber=1}; // wrapping around
	};
};
function ActivityShow() {
	ActivityClear();
	for (var A in $("ActivityFilter").elements) {
		if ($("ActivityFilter").elements[A].checked) { // checking for checked checkboxes
			ActivityContent.appendChild(ActivityList[$("ActivityFilter").elements[A].value].clone(true)); // true for deep cloning
		}
	}
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
			updateInProgress = false;
			var Results = Response.getElementsByTagName("results")[0].firstChild.nodeValue;
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
				C++;
			};
			setupCalRollovers();
		};
	};
};
function ActivityDaySet(DayCur,CalendarCur) {
	var TempID = DayCur.replace(CalendarCur+"_","").split("/"); // getting day from ID
	var TempDate = new Date("20".concat(TempID[2]),TempID[0]-1,TempID[1]);
	ActivityDay.setTime(TempDate.getTime()); // recording day
	$("ActivityInput").value = TempDate.toLocaleDateString();
	$(CalendarCur).hide(); // hiding after day select
};
