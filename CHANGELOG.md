# 1.3
### In Progress

  - Revert "check each tooltip for existence, fixes issue 349".
    This reverts commit d55f9bb714e85f9d421cbef0675602c9a16ce813.
    Fixes broken Tooltip. See discussion at
    https://github.com/jquerytools/jquerytools/pull/1076#issuecomment-60933002
    [vincentfretin, thet]

  - Fix dateinput (change event was not triggered anymore).
    [thomasdesvenain]

  - Fix API usage of outerWidth and outerHeight.
    [thet]

  - In the date picker, fire the change event on the input so it doesn't bubble
    up and cause an error in jquery 1.8.
    [davisagli]


# 1.2.7
### In Progress

  - Fix dateinput selectors bug[#541](https://github.com/jquerytools/jquerytools/issues/541)
  - Fix history bug in scrollable navigator[#542](https://github.com/jquerytools/jquerytools/issues/542)
  - Fix apple effect on firefox 3.6 [#310](https://github.com/jquerytools/jquerytools/issues/310)
  - Initial effect on tabs is now configurable [#531](https://github.com/jquerytools/jquerytools/issues/531)

# 1.2.6
### Sept 15, 2011

  - Fixed animation queue issue when switching tabs in both autoscroll and slideshow plugins [#447](https://github.com/jquerytools/jquerytools/issues/447)
  - Native browser validation is now disabled in validator to avoid compatibility issues [#334](https://github.com/jquerytools/jquerytools/issues/334)
  - Dateinput now has `beforeChange` event and triggers `change` appropriately [#292](https://github.com/jquerytools/jquerytools/issues/292)
  - Tooltip fade bugfix for IE [#363](https://github.com/jquerytools/jquerytools/issues/363)
  - Rangeinput vertical position calculations are fixed [#463](https://github.com/jquerytools/jquerytools/issues/463)
  - Horizontal accordion works again with smoother animation [#327](https://github.com/jquerytools/jquerytools/issues/327)
  - Tabs with history plugin work once again [#261](https://github.com/jquerytools/jquerytools/issues/261)
  - Added size parameter back to scrollable [#58](https://github.com/jquerytools/jquerytools/issues/58)
  - Dateinput forward/back buttons no longer calculate the wrong date *in some cases* [#476](https://github.com/jquerytools/jquerytools/pull/476)
