# SteamActivityFilter script

Written by **ZeroUnderscoreOu**

04.2015

#### Steam:

http://steamcommunity.com/id/ZeroUnderscoreOu/

#### Group:

http://steamcommunity.com/groups/0_oWassup/

#### Forum:

http://steamcommunity.com/groups/0_oWassup/discussions/3/



#### Usage:

- Click on the date field to select the date to load activity for.

- Enter the ammount of days to load activity for (0 - only current day; accepts negative values).

- Click on the "Load" button to load activity.

- Click on the checkboxes to select which activity to show.

- Click on the "All" button to select all the checkboxes or on the "None" button to select none.

- Click on the "Filter" button to show selected activity.

- Click on the "Clear" button to clear showed activity.

Loaded activity stacks.



#### Possible problems:

May lead to memory overload.

May skip some activity (which I haven't encountered).

Does a few excessive operations, mainly caused by dynamically loaded scripts.







#### Technical info:

*ActivityList* contains activity, sorted by author's ID; fields are .Content for activity itself, .Name for author's name & .Type for activity type.

*BaseURL* is used for links for profile related resources; it's gotten from g_BlotterNextLoadURL, because http://steamcommunity.com/my/ & http://steamcommunity.com/profiles/ doesn't work with the calendar - probably because of the redirect, each month loading attempt loads current month. I don't know why I prefered to get URL this way instead of window.location.href. Probably more cool.

*ActivityCalendarLoad()* - reworked version of calChangeMonth(), calling ActivityCalendarFill() instead of calChangeReceive() and with calChangeMonthExtraFunc removed as superfluous.

*ActivityCalendarFill()* - reworked version of calChangeReceive(), changing links of month navigation & day elements; new Element() used instead of document.createElement(); probably will change or add an option for week start.

*ActivityDayLoad()* - reworked version of StartLoadingBlotter(); g_BlotterNextLoadURL is cleared to prevent further loading; Blotter_RemoveDuplicates() removed to prevent hiding duplicates, which may hide an event when sorted by user; uses only requested day as a parameter, with base URL being in the function.

In *ActivityParse()*
1. All screenshot events get additional function call added. That function sets scrollbars where they're needed and originally is called after activity load, but since activity isn't displayed right away and is split, call is added for each event where it might be needed. This may lead to repeated calls & is bit excessive, but the function itself doesn't perform actions which aren't needed, it's better to call it this way then on each event addition, and I couldn't rewrite it to work with not displayed HTML.
2. The activity ending script is parsed, which is originally appended after all activity to replace dynamic (store, community & YouTube) links with actual dynamic content. The replacements, which it should've made, are performed. IMO making all replacements right away, instead of separately for each link on load, is more efficient. Replacement content is also unescaped, because for some reason it isn't on regular addition.
3. All events are parsed & sorted by author ID, and ActivityList is filled. During that, author profile links are cycled through, because their position in page isn't constant depending on the event. Some events contain additional links, which should be skipped. RegExp is used to check for link text - avatar links contain new lines & tabs instead of being empty. \w doesn't work with russian (and any other non-latin language) - apparently, russian doesn't have letters.

*ActivityContentShow()* uses a "hack" to make scripts from activity work. If added as is, they don't trigger, so instead they're removed from activity to separate element and then readded. Main problems I had was with scripts which enable screenshot galleries, but also with responsible for comment input & emoticon selection. They weren't executed after any other way of addition. Though I suspect that I overlooked something.

Some of the URLs are hardcoded in functions, which is probably not the most compatible way.

Unlike group calendar, personal calendar has a hardcoded ID in XML response, and though ID is required in ActivityCalendarLoad(), it's not used.

All cycles which removeChild() from cycled or appendChild() to another object go from end to beginning to avoid accessing deleted elements (in some functions appendChild() doesn't actually remove, but as I didn't check exact conditions for removing, I follow this rule).

Partly due to asynchronous work of data loading, functions are chained for them to work when data is really loaded.

Order & actions of functions:

- *ActivityInitialize()* - independent, called at script begin

	- basic preparation, setting variables & adding elements to the page

- *ActivityCalendarLoad()* - independent, called by form calendar and on calendar initialization at ActivityInitialize() (assigned to calendar elements at ActivityCalendarFill())

	- loading calendar content

- *ActivityCalendarFill()* - called by ActivityCalendarLoad() (by XML request in it)

	- writing loaded content to form calendar

- *ActivityDaySet()* - independent, called by form calendar (assigned to calendar elements at ActivityCalendarFill())

	- setting day to load activity for

- *ActivityFilterClear()* - independent, called by ActivityFilterShow() & form button

	- clearing of form

- *ActivityContentClear()* - independent, called by ActivityContentShow() & form button

	- clearing of displayed activity

- *ActivityCheckboxes()* - independent, called by form button

	- setting all form checkboxes to selected state

- *ActivityDayLoad()* - independent, called by form button

	- loading activity for set day

- *ActivityParse()* - called by ActivityDayLoad()

	- preparing & sorting activity & getting info

- *ActivityFilterShow()* - called by ActivityParse()

	- generating form elements

- *ActivityContentShow()* - independent, called by form button

	- displaying filtered activity

In the original verions of script, all displayed activity was cloned, but it turned out that adding it to the page doesn't remove it from ActivityList as I thought. Still, this data might get doubled because of being both on the page & in ActivityList, I'm not sure about that. Also, data in ActivityList is kept constantly during the work (until cleared by user), while displayed data is cleared on any new filtering. Depending on the ammount of activity & number of days, that may be pretty heavy.
