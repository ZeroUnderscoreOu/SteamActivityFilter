/*
Steam Activity Filter userscript 1.4.1
Written by ZeroUnderscoreOu
http://steamcommunity.com/id/ZeroUnderscoreOu/
http://steamcommunity.com/groups/0_oWassup/discussions/3/
https://github.com/ZeroUnderscoreOu/SteamActivityFilter
*/

//ToDo
// (возможно) перенести Counter++ в условие с префиксной записью
// (возможно) разбить блок новостей от Гейба по пользователям
// (возможно) добавить проверку порядка дней по таймстампам, добавить даты
// (возможно) переписать что-нибудь на for of и querySelectorAll
// (возможно) получать именно SteamId пользователей на случай непонятных ников; хотя они же все и так в адресах, должны быть подходящими
// теоретически отчистку формы можно делать через reset
// должна ли активность стекаться?
// ( rgJSON.error ? rgJSON.error : rgJSON.success )
// "Seamonkey": "2.37 - 2.41"
// заменить clone() на cloneNode()
// я бы предпочёл устанавливать className вместо Style="Display:None;", как советует MDN, но это требует больше действий и проверок

"use strict";
(function(){ // scoping
var ActivityContainer = document.getElementById("blotter_content"); // activity block
var ActivityList = {}; // activity list, sorted by author; without explicit assign script crashes on "in" operaton on empty list
var ActivityDay = new Date(); // current day
//var BaseURL = g_BlotterNextLoadURL.split("ajaxgetusernews")[0]; // depends on fully loaded activity
//var BaseURL = document.location.protocol + "steamcommunity.com/my/"; // redirects, causes problems with post requests
var BaseURL = document.location.href.split("home")[0]; // profile link; why I didn't use window.location.href from the start?
var CalendarDates = []; // array for calendar navigation dates
var ActivityLinks = []; // array of links to activity days
var ActivityResponder = { // responder object to track Ajax requests, call them in order and execute after they're complete
	onComplete: function(Data) {
		//ActivityParse(document.getElementById("blotter_day_"+Data.url.split("start=")[1]).getElementsByClassName("blotter_block"));
		ActivityLoader();
	}
};
function ActivityInitialize() {
	var TmpElem = document.createElement("Div"); // variable for temporary elements; div for filter form and additional elements
	ActivityDay.setHours(0,0,0,0); // activity uses beginning of the day in links
	//TmpElem.id = "ActivityMainDiv";
	TmpElem.innerHTML = // HTML, partly copied from Steam's event setting interface
		'<Style>' // overriding Steam's style
			+ '#blotter_throbber {Display:Inline-Block; Position:Fixed; Left:0px; Top:0px; Width:100%; Height:100%; Margin-Top: 0px; Background-Color: RGBA(0,0,0,0.5); Z-Index:500;}'
			+ '.throbber {Position:Relative; Top:250px;}'
		+ '</Style>'
		+ '<Style Scoped="True">' // scoped overriding & form style
			+ '@import "//steamcommunity-a.akamaihd.net/public/css/skin_1/calendar.css?v=.944VhImsKDKs";'
			+ '#ActivityFilter {Line-Height:0px;}'
			+ '#cal1 {Position:Absolute; Z-Index:10;}'
			+ '.calendarBox .days a:Hover {Width:18px; Height:16px; Background-Color:#D05F29; Color:#1F1F1F; Border:Solid #D05F29 1px; Cursor:Pointer;}' // the rollOver style from calendar.css, changed to hover
			+ '.ActivityButtonThin {Width:45px;}'
			+ '.ActivityButtonWide {Width:90px;}'
			+ '.ActivityCenter {Text-Align:Center;}'
			+ '.ActivityStart {Width:90px;}'
			+ '.ActivityLength {Width:25px;}'
			+ '.ActivitySpacer {Display:Inline-Block; Margin:5px}'
			+ '.ActivityNames {Display:Inline-Block; Width:33%; Margin:0px; Padding:0px; Border:None; OverFlow:Hidden; Text-Align:Left; Vertical-Align:Top;}'
			+ '.ActivityLabel {Display:Block; White-Space:Pre;}'
		+ '</Style>'
		+ '<Form Id="ActivityFilter" Class="ActivityCenter">' // activity filter form
			+ '<Div Id="ActivityPlayer1" Class="ActivityNames ActivityPlayer"></Div>'
			+ '<Div Id="ActivityPlayer2" Class="ActivityNames ActivityPlayer"></Div>'
			+ '<Div Id="ActivityPlayer3" Class="ActivityNames ActivityPlayer"></Div>'
			+ '<HR Id="ActivityHRPlayer" Style="Display:None;">'
			+ '<Div Id="ActivityGroup1" Class="ActivityNames ActivityGroup"></Div>'
			+ '<Div Id="ActivityGroup2" Class="ActivityNames ActivityGroup"></Div>'
			+ '<Div Id="ActivityGroup3" Class="ActivityNames ActivityGroup"></Div>'
			+ '<HR Id="ActivityHRGroup" Style="Display:None;">'
			+ '<Div Id="ActivityGame1" Class="ActivityNames ActivityGame"></Div>'
			+ '<Div Id="ActivityGame2" Class="ActivityNames ActivityGame"></Div>'
			+ '<Div Id="ActivityGame3" Class="ActivityNames ActivityGame"></Div>'
			+ '<Br Id="ActivityBr" Class="ActivitySpacer" Style="Display:None;">'
			+ '<Div Style="Float:Left;">' // left part; styled through attribute because it's the only element needing this style
				+ '<Input Id="ActivityStart" Type="Text" Value="Day" Class="ActivityCenter ActivityStart">'
				+ '<B> + </B>'
				+ '<Input Id="ActivityLength" Type="Text" Value="0" Class="ActivityCenter ActivityLength">'
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Type="Submit" Value="Load" Class="btn_green_white_innerfade btn_small_wide ActivityButtonWide">'
			+ '</Div>'
			+ '<Div Style="Display:Inline-Block;">' // center part; styled for proper display
				+ '<Input Id="ActivityAll" Type="Button" Value="All" Class="btn_grey_black btn_small_thin ActivityButtonThin">'
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Id="ActivityNone" Type="Button" Value="None" Class="btn_grey_black btn_small_thin ActivityButtonThin">'
			+ '</Div>'
			+ '<Div Style="Float:Right;">' // right part
				+ '<Input Id="ActivityClear" Type="Button" Value="Clear" Class="btn_grey_black btn_small_wide ActivityButtonWide">'
				+ '<Div Class="ActivitySpacer"></Div>'
				+ '<Input Id="ActivityShow" Type="Button" Value="Show" Class="btn_green_white_innerfade btn_small_wide ActivityButtonWide">'
			+ '</Div>'
		+ '</Form>'
		+ '<Div Id="cal1" Style="Display:None;">' // calendar template; have set style inline for compatibility with Effect.Appear()
			+ '<Div Id="calendarBox_cal1" Class="calendarBox">'
				+ '<Div Id="monthRow_cal1" Class="monthRow">'
					+ '<Div Id="monthNav_cal1" Class="monthNav">' // originally content of this div is replaced by XML response, but I'm not using it
						+ '<A><Img Width="17" Height="17" Border="0" Src="//steamcommunity-a.akamaihd.net/public/images/skin_1/monthBackOn.gif"></A>'
						+ '&nbsp;'
						+ '<A><Img Width="17" Height="17" Border="0" Src="//steamcommunity-a.akamaihd.net/public/images/skin_1/monthForwardOn.gif"></A>'
					+ '</Div>'
					+ '<H1 Id="monthTitle_cal1" Class="monthTitle"></H1>'
				+ '</Div>'
				+ '<Div Id="weekHead_cal1" Class="weekHead">'
					+ '<Div Class="day">S</Div>'
					+ '<Div Class="day">M</Div>'
					+ '<Div Class="day">T</Div>'
					+ '<Div Class="day">W</Div>'
					+ '<Div Class="day">T</Div>'
					+ '<Div Class="day">F</Div>'
					+ '<Div Class="day">S</Div>'
				+ '</Div>'
				+ '<Div Id="days_cal1" Class="days"></Div>'
			+ '</Div>'
		+ '</Div>'
		+ '<Br>';
	ActivityContainer.insertBefore(TmpElem,ActivityContainer.firstChild); // using innerHTML instead doesn't seem to work
	document.getElementById("ActivityFilter").addEventListener( // preventDefault() instead of return false
		"submit",
		function(Event){ActivityDayLoad(ActivityDay.getTime()/1000);Event.preventDefault();},
		false
	);
	document.getElementById("ActivityStart").addEventListener(
		"focus",
		function(){new Effect.Appear("cal1",{duration:0.5});},
		false
	);
	document.getElementById("ActivityAll").addEventListener(
		"click",
		function(){ActivityCheckboxes(true);},
		false
	);
	document.getElementById("ActivityNone").addEventListener(
		"click",
		function(){ActivityCheckboxes(false);},
		false
	);
	document.getElementById("ActivityClear").addEventListener(
		"click",
		function(){ActivityList={};ActivityFilterClear();ActivityContentClear();},
		false
	);
	document.getElementById("ActivityShow").addEventListener(
		"click",
		ActivityContentShow,
		false
	);
	document.getElementById("monthNav_cal1").getElementsByTagName("A")[0].addEventListener( // previous month
		"click",
		function(){ActivityCalendarLoad("cal1",CalendarDates[1],CalendarDates[2])},
		false
	);
	document.getElementById("monthNav_cal1").getElementsByTagName("A")[1].addEventListener( // next month
		"click",
		function(){ActivityCalendarLoad("cal1",CalendarDates[3],CalendarDates[4])},
		false
	);
	document.getElementById("ActivityStart").value = ActivityDay.toLocaleDateString(); // filling the day
	ActivityCalendarLoad("cal1",parseInt(ActivityDay.getMonth())+1,ActivityDay.getFullYear()); // initializing calendar
};
function ActivityCalendarLoad(CalendarId,NewMonth,NewYear,GroupCalendar) {
	var CalendarURL;
	var PostData = {
		"calendarID": CalendarId
	};
	if (GroupCalendar) { // using alternative calendar URL
		CalendarURL = "/groups/0_oWassup/"; // relative URL of an awesome group
	} else {
		CalendarURL = BaseURL;
	};
	//CalendarURL = GroupCalendar ? "/groups/0_oWassup/" : BaseURL;
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
				ActivityCalendarLoad(CalendarId,NewMonth,NewYear,true); // trying alternative
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
	var CalendarId = Response.getElementsByTagName("calendarID")[0].firstChild.nodeValue;
	var HTMLDays = document.getElementById("days_"+CalendarId);
	var XMLDays = Response.getElementsByTagName("day");
	var DayCounter = 0;
	var NavLinks = Response.getElementsByTagName("monthNav")[0].firstChild.nodeValue; // parsing XML responce as a string instead of pasting as HTML 'cause Mozilla's standards
	CalendarDates = NavLinks.match(/ (\d{1,2}), (\d{4}) [^]* (\d{1,2}), (\d{4}) /); // taking date parameters from function calls; insidious dot doesn't work with multiple lines
	document.getElementById("monthTitle_"+CalendarId).textContent = Response.getElementsByTagName("monthTitle")[0].firstChild.nodeValue; // plain text, innerHTML not needed here
	HTMLDays.textContent = "";
	for (var A=0;A<XMLDays.length;A++) {
		if (DayCounter==7) {
			DayCounter = 0;
			var Breaker = document.createElement("Br");
			Breaker.clear = "Left";
			HTMLDays.appendChild(Breaker);
		};
		var NewDay = document.createElement("A");
		NewDay.textContent = XMLDays[A].firstChild.nodeValue;
		NewDay.id = XMLDays[A].getAttribute("linkID");
		NewDay.className = XMLDays[A].getAttribute("cssClass").replace("noRollover",""); // removing hover style blocking
		NewDay.addEventListener( // using own function, binding the clicked day Id
			"click",
			function(){ActivityDaySet.bind(this)();},
			false
		);
		HTMLDays.appendChild(NewDay);
		DayCounter++;
	};
};
function ActivityDaySet() {
	var CalendarId = this.id.split("_"); // day Id, containing calendar Id & date; passed through bind()
	var ThisDay = CalendarId[1].split("/"); // getting date
	CalendarId = CalendarId[0]; // getting calendar Id
	ThisDay = new Date("20"+ThisDay[2],ThisDay[0]-1,ThisDay[1]); // turning into date object
	ActivityDay.setTime(ThisDay.getTime()); // recording day
	document.getElementById("ActivityStart").value = ThisDay.toLocaleDateString();
	new Effect.Fade(CalendarId,{duration:0.5}); // hiding after day select
};
function ActivityFilterClear() {
	var TmpElem = ActivityContainer.getElementsByClassName("ActivityNames");
	for (var A=0;A<TmpElem.length;A++) {
		TmpElem[A].textContent = ""; // faster then removing elements separately
	};
	document.getElementById("ActivityBr").style.display = "None";
	document.getElementById("ActivityHRPlayer").style.display = "None";
	document.getElementById("ActivityHRGroup").style.display = "None";
};
function ActivityContentClear() {
	var TmpElem = ActivityContainer.getElementsByClassName("blotter_day"); // ActivityContainer contains other elements besides events
	while (TmpElem.length>0) {
		/*
		new Effect.Fade(TmpElem[0],{duration:0.5}); // bit excessive, but swag
		var IntervalId = setTimeout(function() { // too bad it conflicts with showing swag because of asynchrony
			ActivityContainer.removeChild(this);
			clearInterval(IntervalId);
		}.bind(TmpElem[0]),1000);
		*/
		TmpElem[0].parentElement.removeChild(TmpElem[0]); // ActivityContainer contains all found elements but is not always their direct parent
	};
};
function ActivityCheckboxes(TargetState) {
	var Checkboxes = document.getElementById("ActivityFilter").getElementsByClassName("ActivityCheckbox");
	for (var A=0;A<Checkboxes.length;A++) { // setting all filter checkboxes to the passed state if they're not already
		if (Checkboxes[A].checked!=TargetState) {
			Checkboxes[A].checked = TargetState;
		};
	};
};
function ActivityDayLoad(LoadingDay) {
	var Period = parseInt(document.getElementById("ActivityLength").value); // ammount of additional days to load
	if (isNaN(Period)) { // if wrong ammount of days
		new Effect.Highlight("ActivityLength"); // flashy!
		document.getElementById("ActivityLength").value = 0;
	} else {
		new Effect.Appear("blotter_throbber",{duration:0.5}); // loading indicator
		if (Period<0) { // accepting negative values
			Period = Math.abs(Period);
			LoadingDay -= Period * 86400; // decreasing begin date by period length
		};
		for (Period;Period>=0;Period--) {
			var CrtDay = LoadingDay + 86400 * Period; // currently loading day, in seconds
			console.log(new Date(CrtDay*1000).toString(),BaseURL+"ajaxgetusernews/?start="+CrtDay.toString());
			/*
			new Ajax.Request(BaseURL+"ajaxgetusernews/?start="+CrtDay.toString(),{ // adding day length in seconds
				insertion: Insertion.Bottom,
				method: "get",
				onSuccess: function(Data) {
					var Response = Data.responseJSON;
					var RequestDay = Data.request.url.split("start=")[1]; // have to get day again because of asynchrony
					var MessageDay = new Date(RequestDay*1000).toLocaleDateString() + "\r\n"; // for error messages
					if (Response&&Response.success==true&&Response.blotter_html) {
						if (Response.timestart==RequestDay) { // checking that Steam returned requested day and not a different one
							g_BlotterNextLoadURL = null; // preventing loading on scrolling
							ActivityPrepare(Response.blotter_html); // parsing each day separately
						} else {
							alert(MessageDay+"Different day returned ("+new Date(Response.timestart*1000).toLocaleDateString()+").");
						};
					} else if (Data.responseText) {
						//ActivityContainer.insert({bottom:Data.responseText});
						alert(MessageDay+Data.responseText);
					} else {
						alert(MessageDay+Data.statusText+"\r\nCouldn't load activity.");
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
			*/
			ActivityLinks.push(BaseURL+"ajaxgetusernews/?start="+CrtDay.toString());
			//StartLoadingBlotter(BaseURL+"ajaxgetusernews/?start="+CrtDay.toString());
		};
		Ajax.Responders.register(ActivityResponder);
		ActivityLoader();
	};
};
function ActivityLoader() {
	if (ActivityLinks.length>0) { // if there are days to load
		StartLoadingBlotter(ActivityLinks.shift()); // passing the loading to Steam's own function
	} else {
		Ajax.Responders.unregister(ActivityResponder);
		window.g_BlotterNextLoadURL = null; // preventing loading on scroll; with Greasemonkey's scope support
		Blotter_AddHighlightSliders(); // enabling screenshot galleries
		ActivityParse(ActivityContainer.getElementsByClassName("blotter_block"));
	};
};
/*
function ActivityPrepare(ContentHTML) {
	var EventContainer = document.createElement("Div"); // container element for activity
	var EventElements;
	var EventScripts;
	EventContainer.innerHTML = ContentHTML; // enabling element functions
	//EventContainer.update(ContentHTML); update() doesn't fit, because it removes scripts from HTML
	EventElements = [].slice.call(EventContainer.getElementsByClassName("bb_link")); // transforming HTMLCollection to array
	EventElements = EventElements.filter(function(Match){return /dynamiclink_\d+/.test(Match.id)}); // filtering only replaced links by corresponding Ids
	EventScripts = EventContainer.getElementsByTagName("Script");
	EventScripts = EventScripts[EventScripts.length-1]; // last script, appended at the end of activity; contains dynamic link replacing functions; bit risky to access it by order
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
	ActivityParse(EventContainer.getElementsByClassName("blotter_block")); // all events
};
*/
function ActivityParse(EventContainer) {
	var EventAuthor;
	var EventType;
	var EventLink;
	var TmpElem;
	//var EventElements;
	//var EventScripts;
	//while (EventContainer.length>0)
	//EventContainer[0]
	[].forEach.call(EventContainer,function(Match){ // originally did it with new for...of, but Chrome will support it for objects only since 51
		if (Match.getElementsByClassName("blotter_author_block").length>0) { // event header
			TmpElem = Match.getElementsByClassName("blotter_author_block")[0].getElementsByTagName("A");
			for (var A=0;A<TmpElem.length;A++) { // cycling through found links
				if ((TmpElem[A].href.indexOf("/id/")!=-1||TmpElem[A].href.indexOf("/profiles/")!=-1)&&/\S/.test(TmpElem[A].textContent)) { // checking for link text
					EventAuthor = TmpElem[A].textContent;
					EventType = "Player";
					EventLink = TmpElem[A].href;
					break;
				};
			};
		} else if (Match.getElementsByClassName("blotter_group_announcement_header").length>0) {
			TmpElem = Match.getElementsByClassName("blotter_group_announcement_header")[0].getElementsByTagName("A");
			for (var A=0;A<TmpElem.length;A++) {
				if (TmpElem[A].href.indexOf("/groups/")!=-1&&/\S/.test(TmpElem[A].textContent)) {
					EventAuthor = TmpElem[A].textContent;
					EventType = "Group";
					EventLink = TmpElem[A].href;
					break;
				};
			};
		} else if (Match.getElementsByClassName("blotter_group_announcement_header_ogg").length>0) {
			TmpElem = Match.getElementsByClassName("blotter_group_announcement_header_ogg")[0].getElementsByTagName("A");
			for (var A=0;A<TmpElem.length;A++) {
				if (TmpElem[A].href.indexOf("/games/")!=-1&&/\S/.test(TmpElem[A].textContent)) {
					EventAuthor = TmpElem[A].textContent;
					EventType = "Game";
					EventLink = TmpElem[A].href;
					break;
				};
			};
		} else if (Match.getElementsByClassName("blotter_daily_rollup").length>0) { // achievements & stuff
			EventAuthor = "Gabe Newell Daily"; // daily news from Gabe
			EventType = "Player";//"Daily";
			EventLink = "http://steamcommunity.com/id/gabelogannewell";
			//EventAuthor = 22202;
		} else { // checking for unsorted, still not sure if script works with all events
			console.log("Unsorted activity\r\n",Match.outerHTML);
		};
		TmpElem = EventLink.split("/"); // getting Id from link
		TmpElem = TmpElem[TmpElem.length-1];
		if (TmpElem.length==0) { // just to check that none of the links end with a slash; do I really need this?
			alert("Couldn't get Id\r\n"+EventLink);
		};
		if (!(TmpElem in ActivityList)) { // initializing if first event for this Id
			ActivityList[TmpElem] = {
				"Name": EventAuthor,
				"Type": EventType,
				"Content": []
			};
			//ActivityList[TmpElem]["Content"].className = "blotter_day"; // for easier access to shown divs
			//ActivityList[TmpElem]["Content"].style.display = "None"; // hiding to use an effect later
		};
		/*
		EventElements = Match.getElementsByTagName("Script");
		EventScripts = document.createElement("Script");
		while (EventElements.length>0) { // removing scripts  from activity element and readding to make them work
			EventScripts.textContent += "\r\n" + EventElements[0].textContent;
			EventElements[0].parentElement.removeChild(EventElements[0]); // preventing duplicates; Match is not always direct parent
			//EventElements[0].outerHTML = ""; // another variant of removing the script
		};
		Match.appendChild(EventScripts); // readding
		*/
		Match.style.display = "None";
		ActivityList[TmpElem]["Content"].push(Match);
	});
	ActivitySplit();
};
function ActivitySplit() {
	var ActivitySorted = { // array for split & sorted activity
		"Player": [],
		"Group": [],
		"Game": [],
	};
	var Types = 0; // counter for ammount of activity types
	ActivityFilterClear(); // preventing duplicates
	for (var Key in ActivityList) { // mapping activity to separate arrays
		switch (ActivityList[Key]["Type"]) {
			case "Player": // checking just in case (in case, get it?), but can as well skip this since "Daily" type is commented out
			case "Group":
			case "Game":
				ActivitySorted[ActivityList[Key]["Type"]].push({
					"Id": Key,
					"Name": ActivityList[Key]["Name"].toLocaleUpperCase() // for futher sorting as JS is case-sensitive, with a bit of L10n
				});
		};
	};
	for (var Key in ActivitySorted) { // iterating through all activity types, sorting & outputting right away
		ActivitySorted[Key].sort(ActivitySort);
		ActivityFilterShow(ActivitySorted[Key],Key);
		if (ActivitySorted[Key].length>0) { // if activity type is present
			Types++;
		};
	};
	switch (Types) { // showing separators depending on the number of nonempty arrays
		case 3: // putting checks in reverse to take advantage of non-break execution; pretty funny trick
			document.getElementById("ActivityHRGroup").style.display = "";
		case 2:
			document.getElementById("ActivityHRPlayer").style.display = "";
		case 1:
			document.getElementById("ActivityBr").style.display = "";
	};
};
function ActivitySort(Element1,Element2) {
	return +(Element1["Name"] > Element2["Name"]) || +(Element1["Name"] === Element2["Name"]) - 1; // 1 if greater or 0 if equal and -1 if not; trick from MDN
};
function ActivityFilterShow(Activity,Type) {
	var DivNumber = 1; // for switching between divs
	var WrapPoint = Math.round(Activity.length/ActivityContainer.getElementsByClassName("Activity"+Type).length); // point at which to switch to next div
	var Counter = 0;
	var TmpElem;
	Activity.forEach(function(Match){ // creating elements for filter form
		TmpElem = document.createElement("Label"); // label with author's name
		TmpElem.className = "ActivityLabel"; // for CSS
		TmpElem.textContent = ActivityList[Match["Id"]]["Name"];
		TmpElem = TmpElem.insertBefore(document.createElement("Input"),TmpElem.firstChild); // checkbox with Id; inserting before label's text
		TmpElem.type = "Checkbox";
		TmpElem.value = Match["Id"];
		TmpElem.className = "ActivityCheckbox"; // for easier access to checkboxes
		document.getElementById("Activity"+Type+DivNumber.toString()).appendChild(TmpElem.parentElement);
		Counter++;
		if ((Counter==WrapPoint*DivNumber)&&(DivNumber<ActivityContainer.getElementsByClassName("Activity"+Type).length)) { // in case of unequal parts throwing the rest of elements to the last div
			DivNumber++; // switching to next div
		};
	});
};
function ActivityContentShow() {
	var Checkboxes = document.getElementById("ActivityFilter").getElementsByClassName("ActivityCheckbox"); // all filter checkboxes
	var TmpElem;
	for (var A=0;A<Checkboxes.length;A++) {
		if (Checkboxes[A].checked) { // checking for checked checkboxes
			/*
			TmpElem = ActivityList[Checkboxes[A].value]["Content"].clone(true); // true for deep cloning; turns out cloning isn't actually necessary
			if (TmpElem.getElementsByClassName("highlight_strip_scroll").length>0) { // checking for screenshot galleries' preview panel
				var IntervalId = setTimeout(function() {
					Blotter_AddHighlightSliders(); // setting scrollbars for it after the effect (panel should be visible)
					clearInterval(IntervalId);
				},1000);
			};
			ActivityContainer.appendChild(TmpElem);
			new Effect.Appear(TmpElem,{duration:0.5}); // showing off
			*/
			ActivityList[Checkboxes[A].value]["Content"].forEach(function(Match){
				new Effect.Appear(Match,{duration:0.5});
			});
		} else {
			ActivityList[Checkboxes[A].value]["Content"].forEach(function(Match){
				if (Match.visible) {
					Match.style.display = "None";
				};
			});
		};
	};
};
ActivityInitialize();
})();