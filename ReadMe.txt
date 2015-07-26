SteamActivityFilter script
Written by ZeroUnderscoreOu
04.2015
	Steam profile:
http://steamcommunity.com/id/ZeroUnderscoreOu/
	Group:
http://steamcommunity.com/groups/0_oWassup/
	Forum:
http://steamcommunity.com/groups/0_oWassup/discussions/1/611704730325656275/

	Technical info.
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
