# Steam Activity Filter userscript

Written by **ZeroUnderscoreOu**

#### Contacts:
[Profile](http://steamcommunity.com/id/ZeroUnderscoreOu/) /
[Group](http://steamcommunity.com/groups/0_oWassup/) /
[Forum](http://steamcommunity.com/groups/0_oWassup/discussions/3/) /
[GitHub](https://github.com/ZeroUnderscoreOu/SteamActivityFilter)



#### Description:

Filter for friends' activity in Steam. Allows to load activity for selected days and display needed part of it.



#### Downloading:

Open needed folder on GitHub:

[Greasemonkey](https://github.com/ZeroUnderscoreOu/SteamActivityFilter/raw/master/Greasemonkey) /
[Firefox](https://github.com/ZeroUnderscoreOu/SteamActivityFilter/raw/master/Firefox) /
[Chrome](https://github.com/ZeroUnderscoreOu/SteamActivityFilter/raw/master/Chrome) /
[Opera](https://github.com/ZeroUnderscoreOu/SteamActivityFilter/raw/master/Opera)

open *.user.js / *.xpi / *.crx / *.nex file depending on version, and press "Raw" button at the upper right.



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

- May lead to memory overload, particularly due to cloning.

- May skip some activity (which I haven't encountered).

- Does few excessive operations, particularly due to dynamically loaded scripts.

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

- *ActivityFilterClear()* - called by ActivityFilterShow() & form button

	- clearing of form

- *ActivityContentClear()* - called by ActivityContentShow() & form button

	- clearing of displayed activity

- *ActivityCheckboxes()* - called by form button

	- setting all form checkboxes to selected state

- *ActivityDayLoad()* - called by form button

	- loading activity for set day

- *ActivityParse()* - called by ActivityDayLoad()

	- preparing & sorting activity & getting info

- *ActivityFilterShow()* - called by ActivityParse()

	- generating form elements

- *ActivityContentShow()* - called by form button

	- displaying filtered activity

*ActivityList* contains activity, sorted by author's ID; activity is stored in a nested field instead of root so not to write additional data into HTML elements. Fields are "Content" for activity itself, "Name" for author's name & "Type" for activity type.

*BaseURL* is used for links for profile related resources; originally it was got from g_BlotterNextLoadURL, because http://steamcommunity.com/my/ & http://steamcommunity.com/profiles/ doesn't work with the calendar - probably because of the redirect, if requested with post method, current month is always returned (parameters aren't passed after redirect), so it either should be get method or non-redirecting URL. These URLs are more cool, but I switched to window.location.href.

At some point I used *ActivityCheck()*, which was checking if any activity is currently loading, because during it g_BlotterNextLoadURL was set to null and throwed in ActivityInitialize(). But as I switched to a constant URL it's no longer needed.

*ActivityInitialize()* - inserts filter form, needed scripts & stylesheets into the page, initializes calendar. Restyles blotter_throbber for it to be visible independent from user scrolling (and to be more cool). As it's more logical to show it at the top of the page where the form is, instead of the bottom, such display doesn't shift all the other content and should be less resource intensive. Loadng indicator makes it more clear when activity is loading.

*ActivityCalendarLoad()* - reworked version of calChangeMonth(), calling ActivityCalendarFill() instead of calChangeReceive() and with calChangeMonthExtraFunc removed as superfluous. It's rewritten to use Ajax.Request() instead of createQuery2(), with some checks moved from ActivityCalendarFill() to it. Has added optional parameter, which determines which calendar URL to use (personal or group) and how to treat loading error (trying alternative URL or displaying the error). User's calendar is unavailable if user hasn't join any groups, and group calendar, on the contrary, is available even to the non-members. Thus, clandar URL of some particularly awesome group is used as an alternative. Uses an effect for ActivityDate to indicate that alternative URL was used - added to check how many users (if there would be any users) would have this error. Calendars have a hardcoded ID in XML response, and though ID is required, it's not used (earlier group calendar seemed to use it, but now it doesn't).

*ActivityCalendarFill()* - reworked version of calChangeReceive(). Originally was called through XML request in ActivityCalendarLoad() and had access to request's inner variables; now called directly and is passed response data through parameter. Month navigation links are changed; HRef isn't assigned to day elements; function call is assigned through anonymous OnClick handler with bound this instead of JavaScript protocol; new Element() is used instead of document.createElement(). Probably will change or add an option for week start.

*ActivityDayLoad()* - reworked version of StartLoadingBlotter(). g_BlotterNextLoadURL is cleared to prevent further loading; Blotter_RemoveDuplicates() removed to prevent hiding duplicates, which may hide an event when sorted by user; RecordAJAXPageView removed because Google spying. Uses only requested day as a parameter, with base URL being in the function. Activity is loaded in a loop with a separate iteration for each day. If there's no activity, sometimes Steam returns day different from selected (usually previous). Because of this, I added a check for time between Data.request.url and Data.responseJSON.timestart. The former is also used to check when loop gets to the last URL. Originally I used the latter, but switched because of returned day mismatch. Theoretically, I could use Data.responseJSON.next_request instead of changing the request URL, but it would requre for each previous request to load before making next.

In *ActivityParse()*:

1. The activity ending script is parsed, which is originally appended after all activity to replace dynamic links (store, community & YouTube) with actual content. Script contains function calls with markup, which is searched for and used for replacement "by hand" in the activity content. Then the search match is removed from the script - script should be removed anyway, and shortening it should speed up search. IMO making all replacements right away, instead of separately for each link on load, is more efficient. Replacement content is also unescaped, because for some reason JS special characters aren't interpreted. I suspect it's caused by the parsing and they become treated as separate characters instead of escape sequences.

2. All events are parsed & sorted by author ID. During that, author profile links are cycled through, because their position in page isn't constant depending on the event. Some events contain additional links, which should be skipped. RegExp is used to check for link text - avatar links contain new lines & tabs instead of being empty. \w doesn't work with russian (and any other non-latin language) - apparently, russian doesn't have letters. Created div, containg activity for a particular author, is assigned "blotter_day" class for easier access, particularly in ActivityContentClear(). That class is already used for activity div for a single day, and IMO reusing it is more convenient than creating a separate one.

3. All scripts from current event are readded and then ActivityList is filled. This "hack" to make scripts work originally was in ActivityContentShow(), but it's more efficient to perform this readding one time on event parsing rather then on each display. If scripts are added as is, they don't trigger, so instead they're moved from event to separate element and then readded. Main problems I had were with scripts which enable screenshot galleries, but also with those responsible for comment field & emoticon selection. They weren't executed after any other way of addition. Though I suspect that I overlooked something.

*ActivityContentShow()* clones showed activity and calls scrollbar setting function. Turns out cloning isn't required, but it's better to use it. Appending doesn't remove an element from ActivityList as I thought, but if element isn't cloned, effects glitch for some reason, and after repeated display that element gets style "Display: None". I suspect it might be related to actions of scripts and that some data from them is kept in the memory after element is removed. If there're screenshot events, additional function is called. It's called with a timeout, after event is already displayed, because it doesn't work with hidden elements. That function sets scrollbars where they're needed and originally is called after activity load, but since activity isn't displayed right away and is split, call is added for each time it might be needed. This may lead to repeated calls & is bit excessive, but the function itself doesn't perform actions which aren't needed, and I couldn't rewrite it to work with not displayed HTML.

Some of the URLs are hardcoded in functions, which is probably not the most compatible way.

All cycles which removeChild() from cycled or appendChild() to another object go from end to beginning to avoid accessing deleted elements (in some functions appendChild() doesn't actually remove, but as I didn't check exact conditions for removing, I follow this rule).

Partly due to asynchronous work of data loading, functions are chained for them to work when data is really loaded.

If there's no activity for a particular day, that day returns an error instead of empty content and it and consequtive days aren't loaded.

Scripts don't trigger for duplicated events, so only first event would have for example working comment field. I suspect it's caused by related scripts triggering only for first found element.

In the original verions of script, all displayed activity was cloned, but it turned out that adding it to the page doesn't remove it from ActivityList as I thought. Still, this data might get doubled because of being both on the page & in ActivityList, I'm not sure about that. Also, data in ActivityList is kept constantly during the work (until cleared by user), while displayed data is cleared on any new filtering. Depending on the ammount of activity & number of days, that may be pretty heavy.