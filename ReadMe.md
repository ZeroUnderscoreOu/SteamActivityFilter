# SteamActivityFilter script

Written by **ZeroUnderscoreOu**

04.2015

#### Steam:

http://steamcommunity.com/id/ZeroUnderscoreOu/

#### Group:

http://steamcommunity.com/groups/0_oWassup/

#### Forum:

http://steamcommunity.com/groups/0_oWassup/discussions/1/611704730325656275/



#### Usage:

- Click on the date field to select the date to load activity for.

- Enter the ammount of days to load activity for (0 - only current day; accepts negative values).

- Click on the "Load" button to load activity.

- Click on the checkboxes to select which activity to show.

- Click on the "Filter" button to show selected activity.

- Click on the "Clear" button to clear showed activity.

Loaded activity stacks.



#### Possible problems:

May lead to memory overload.

May skip some activity (which I haven't encountered).

Does quite a few excessive operations, mainly caused dynamically loaded scripts.







#### Technical info:

*ActivityList* contains sorted activity, stored by author's ID; has additional fields for author's name & activity type (.Name & .Type respectively).

*BaseURL* is used for links for profile related resources; it's gotten from g_BlotterNextLoadURL, because http://steamcommunity.com/my/ & http://steamcommunity.com/profiles/ doesn't work with the calendar - probably because of the redirect, each month loading attempt loads current month. I don't know why I prefered to get URL this way instead of window.location.href. Probably more cool.

*ActivityCalendarLoad()* - reworked version of calChangeMonth(), calling ActivityCalendarFill() instead of calChangeReceive() and with calChangeMonthExtraFunc removed as superfluous.

*ActivityCalendarFill()* - reworked version of calChangeReceive(), changing links of month navigation & day elements; new Element() used instead of document.createElement(); probably will change or add an option for week start.

*ActivityDayLoad()* - reworked version of StartLoadingBlotter(); g_BlotterNextLoadURL is cleared to prevent further loading; Blotter_RemoveDuplicates() removed to prevent hiding duplicates, which may hide an event when sorted by user; uses only requested day as a parameter, with base URL being in the function.

In *ActivityParse* links are cycled through, because their position in page source isn't constant depending on the event; some events contain additional links, which should be skipped; regexp is used to check for link text - avatar links contain new lines & tabs instead of being empty; \w doesn't work with russian - apparently russian doesn't have letters.

In *ActivityParse()* the ending script is parsed, which is appended after all activity to replace dynamic (store, community & YouTube) links with actual dynamic content. Then the replacements, which it should've made, are performed. IMO making all replacements right away, instead of separately for each link on load, is more efficient. Replacement content is also unescaped because for some reason it isn't on regular addition. Then all content is sorted by author ID, and ActivityList is filled.

*ActivityContentShow()* uses a "hack" to make scripts from activity work. If added as is, they don't trigger, so instead they're removed from activity to separate element and then readded. Main problem I had was with scripts which are responsible for comment input & emoticon selection. They weren't executed with any combination of addition. I suspect that might be related to them being escaped. I also suspect that I overlooked some easier way.

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

	- clearing of filter form

- *ActivityContentClear()* - independent, called by ActivityContentShow() & form button

	- clearing of displayed activity

- *ActivityDayLoad()* - independent, called by form button

	- loading activity for set day

- *ActivityParse()* - called by ActivityDayLoad()

	- sorting activity by author & getting info

- *ActivityFilterShow()* - called by ActivityParse()

	- generating filter form elements

- *ActivityContentShow()* - independent, called by form button

	- displaying filtered activity

Theoretically, the script may lead to memory overload, as all activity info is cloned from sorted list (ActivityList) to displayed list (page itself). Sorted list is kept constantly during the work (until cleared by user), while displayed list is cleared on any new filtering. But I don't know how browser works with cloned elements and if they're actually removed on removeChild().
