![Steam Activity Filter logo](https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Logo128.png)
# Steam Activity Filter userscript

Written by **ZeroUnderscoreOu**

#### Contacts:
[Profile](http://steamcommunity.com/id/ZeroUnderscoreOu/) /
[Group](http://steamcommunity.com/groups/0_oWassup/) /
[Forum](http://steamcommunity.com/groups/0_oWassup/discussions/3/) /
[GitHub](https://github.com/ZeroUnderscoreOu/SteamActivityFilter)



#### Description:

Filter for friends' activity in Steam. Allows to load activity for selected days and display needed part of it.



#### Installation:

[Firefox](https://addons.mozilla.org/ru/firefox/addon/steam-activity-filter/) /
[Chrome](https://chrome.google.com/webstore/detail/steam-activity-filter/hcldbiknhbfgchhdohoebedmmolifhmf) /
[Opera](https://addons.opera.com/extensions/details/steam-activity-filter/) /
[Greasemonkey](https://raw.githubusercontent.com/ZeroUnderscoreOu/SteamActivityFilter/master/Greasemonkey/SteamActivityFilter.user.js)



#### Usage:

- Click on the date field to select the day to load activity for. If shown, calendar isn't hidden until date is selected. If the field flashes after selection, it means that you are not in any groups and don't have personal event calendar. If you think this is wrong, please post on the forum.

- Enter the ammount of additional days to load (0 - only selected day, 1 - selected day and the next; accepts negative values to load prior days).

- Click on the "Load" button to load activity.

- Click on the checkboxes to select which activity to show.

- Click on the "All" button to select all the checkboxes or on the "None" button to select none.

- Click on the "Filter" button to show selected activity.

- Click on the "Clear" button to clear activity.

Loaded activity stacks until cleared, so several days can be consequently loaded and veiwed together.



#### Possible problems:

- May lead to memory leak & overload.

- May skip some activity (which I haven't encountered).

- Does few excessive operations, particularly due to dynamically loaded scripts.

- In case of little activity previous day may load automatically (as next day is loaded when previous is scrolled to the end)

- Events are duplicated if same day is loaded several times (as loaded activity stacks).

- Steam's calendar, and, thus, script itself isn't intended to work with any century other then current 21st (year is stored in two digit format).



#### Debugging:

Link to every loaded day with date indication and unparsed events are output in browser's console.



#### Technical info:

Order & actions of functions:

- *ActivityInitialize()* - called at script begin

	- basic preparing, setting variables & adding elements to the page

- *ActivityCalendarLoad()* - called by form calendar and on calendar initialization at ActivityInitialize() (assigned to calendar elements at ActivityCalendarFill())

	- loading calendar content

- *ActivityCalendarFill()* - called by ActivityCalendarLoad()

	- writing loaded content to form calendar

- *ActivityDaySet()* - called by form calendar (assigned to calendar elements at ActivityCalendarFill())

	- setting day to load activity for

- *ActivityFilterClear()* - called by ActivitySplit() & form button

	- clearing of form

- *ActivityContentClear()* - called by form button

	- clearing of displayed activity

- *ActivityCheckboxes()* - called by form button

	- setting all form checkboxes to selected state

- *ActivityDayLoad()* - called by form button

	- preparing links for activity day(s)

- *ActivityLoader()* - called by ActivityDayLoad() and ActivityResponder

	- calling loading of activity day; calling parsing when all loaded

- *ActivityParse()* - called by ActivityLoader()

	- preparing & sorting activity & getting info

- *ActivitySplit()* - called by ActivityParse()

	- further preparing & sorting activity

- *ActivitySort()* - called by ActivitySplit()

	- sorts split activity by alphabet

- *ActivityFilterShow()* - called by ActivitySplit()

	- generating form elements

- *ActivityContentShow()* - called by form button

	- displaying filtered activity

*ActivityList* contains activity, sorted by author's Id; activity is stored in a nested field instead of root so not to write additional data into HTML elements. Fields are "Content" for activity itself, "Name" for author's name & "Type" for activity type.

*BaseURL* is used for links for profile related resources; originally it was got from g_BlotterNextLoadURL, because http://steamcommunity.com/my/ & http://steamcommunity.com/profiles/ doesn't work with the calendar - probably because of the redirect, if requested with post method, current month is always returned (parameters aren't passed after redirect), so it either should be get method or non-redirecting URL. These URLs are more cool, but I switched to window.location.href.

At some point I used *ActivityCheck()*, which was checking if any activity is currently loading, because during it g_BlotterNextLoadURL was set to null and throwed in ActivityInitialize(). But as I switched to a constant URL it's no longer needed.

*ActivityInitialize()* - inserts filter form & needed stylesheets into the page, initializes calendar. Restyles blotter_throbber for it to be visible independent from user scrolling (and to be more cool). As it's more logical to show it at the top of the page where the form is, instead of the bottom, such display doesn't shift all the other content and should be less resource intensive. Loadng indicator makes it more clear when activity is loading.

*ActivityCalendarLoad()* - reworked version of calChangeMonth(), calling ActivityCalendarFill() instead of calChangeReceive() and with calChangeMonthExtraFunc removed as superfluous. It's rewritten to use Ajax.Request() instead of createQuery2(), with some checks moved from ActivityCalendarFill() to it. Has additional parameter, which determines which calendar URL to use (personal or group) and how to treat loading error (trying alternative URL or displaying the error). User's calendar is unavailable if user hasn't join any groups, and group calendar, on the contrary, is available even to the non-members. Thus, clandar URL of some particularly awesome group is used as an alternative. Uses an effect for ActivityStart to indicate that alternative URL was used - added to check how many users (if there would be any users) would have this error. Calendars have a hardcoded Id in XML response, and though Id is required, it's not used (earlier group calendar seemed to use it).

*ActivityCalendarFill()* - reworked version of calChangeReceive(). Originally was called through XML request in ActivityCalendarLoad() and had access to request's inner variables; now called directly and is passed response data through a parameter. Month navigation handlers are changed; HRef isn't assigned to day elements; onclick handler with JavaScript protocol replaced by event handler. Maybe will change or add an option for week start.

*ActivityDayLoad()* - generates links for each activity day to load and writes them to ActivityLinks; registers a responder to Ajax loads (which assumed to be activity days). Uses only starting day as a parameter, with base URL being in the function.

*ActivityLoader()* - calls Steam's loading function for activity days, one at a time; when done, unregisters responder, clears g_BlotterNextLoadURL to prevent further loading, calls a function to enable screenshot galleries and calls activity parser.

In *ActivityParse()* all events are parsed & sorted by author Id. During that, author profile links are cycled through, because their position in page isn't constant depending on the event. Some events contain additional links, which should be skipped. RegExp is used to check for link text - avatar links contain new lines & tabs instead of being empty. \w doesn't work with russian (and any other non-latin language). Activity element is hidden right away and added to an array of events for that Id.

*ActivitySplit()* splits ActivityList into smaller arrays by type, calls ActivitySort() to sort them by alphabet & ActivityFilterShow() right after that to show activity filter. Shows separator elements depending on present activity.

*ActivityFilterShow()* fills the divs in filter form top to bottom instead of original left to right for convenience. Uses activity array & type as parameters; automatically uses divs according to type.
*ActivityFilterShow()* fills the divs in filter form top to bottom instead of original left to right for convenience. Uses activity array & type as parameters; automatically uses divs according to type.

*ActivityContentShow()* shows elements for selected Ids, with a swag effect, and hides not selected.

Activity calendar is restyled with CSS' hover in place of setupCalRollovers(). I don't know why the heck they took such a difficult way to set this up, probably was yet when pseudo classes didn't exist.

Some of the URLs are hardcoded in functions, which is probably not the most compatible way.

All cycles which removeChild() from cycled or appendChild() to another object go from end to beginning to avoid accessing deleted elements (in some functions appendChild() doesn't actually remove, but as I didn't check exact conditions for removing, I follow this rule).

Partly due to asynchronous work of data loading, functions are chained for them to work when data is really loaded.

If there's no activity for a particular day, that day returns an error instead of empty content and it and consequtive days aren't loaded.

Scripts don't trigger for duplicated events, so only first event would have for example working comment field. I suspect it's caused by related scripts triggering only for first found element.

In the original verions of script, all displayed activity was cloned, but it turned out that adding it to the page doesn't remove it from ActivityList as I thought. Still, this data might get doubled because of being both on the page & in ActivityList, I'm not sure about that. Also, data in ActivityList is kept constantly during the work (until cleared by user), while displayed data is cleared on any new filtering. Depending on the ammount of activity & number of days, that may be pretty heavy.