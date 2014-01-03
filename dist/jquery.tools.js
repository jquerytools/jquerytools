/**
 * @license
 * jQuery Tools @VERSION Dateinput - <input type="date" /> for humans
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/form/dateinput/
 *
 * Since: Mar 2010
 * Date: @DATE
 */
(function($, undefined) {

    /* TODO:
         preserve today highlighted
    */

    $.tools = $.tools || {version: '@VERSION'};

    var instances = [],
        formatters = {},
         tool,

         // h=72, j=74, k=75, l=76, down=40, left=37, up=38, right=39
         KEYS = [75, 76, 38, 39, 74, 72, 40, 37],
         LABELS = {};

    tool = $.tools.dateinput = {

        conf: {
            format: 'mm/dd/yy',
            formatter: 'default',
            selectors: false,
            yearRange: [-5, 5],
            lang: 'en',
            offset: [0, 0],
            speed: 0,
            firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
            min: undefined,
            max: undefined,
            trigger: 0,
            toggle: 0,
            editable: 0,

            css: {

                prefix: 'cal',
                input: 'date',

                // ids
                root: 0,
                head: 0,
                title: 0,
                prev: 0,
                next: 0,
                month: 0,
                year: 0,
                days: 0,

                body: 0,
                weeks: 0,
                today: 0,
                current: 0,

                // classnames
                week: 0,
                off: 0,
                sunday: 0,
                focus: 0,
                disabled: 0,
                trigger: 0
            }
        },

        addFormatter: function(name, fn) {
            formatters[name] = fn;
        },

        localize: function(language, labels) {
            $.each(labels, function(key, val) {
                labels[key] = val.split(",");
            });
            LABELS[language] = labels;
        }

    };

    tool.localize("en", {
        months:          'January,February,March,April,May,June,July,August,September,October,November,December',
        shortMonths: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
        days:          'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        shortDays:      'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
    });


//{{{ private functions


    // @return amount of days in certain month
    function dayAm(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function zeropad(val, len) {
        val = '' + val;
        len = len || 2;
        while (val.length < len) { val = "0" + val; }
        return val;
    }

    // thanks: http://stevenlevithan.com/assets/misc/date.format.js
    var tmpTag = $("<a/>");

    function format(formatter, date, text, lang) {
      var d = date.getDate(),
            D = date.getDay(),
            m = date.getMonth(),
            y = date.getFullYear(),

            flags = {
                d:    d,
                dd:   zeropad(d),
                ddd:  LABELS[lang].shortDays[D],
                dddd: LABELS[lang].days[D],
                m:    m + 1,
                mm:   zeropad(m + 1),
                mmm:  LABELS[lang].shortMonths[m],
                mmmm: LABELS[lang].months[m],
                yy:   String(y).slice(2),
                yyyy: y
            };

        var ret = formatters[formatter](text, date, flags, lang);

        // a small trick to handle special characters
        return tmpTag.html(ret).html();

    }

    tool.addFormatter('default', function(text, date, flags, lang) {
        return text.replace(/d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g, function ($0) {
            return $0 in flags ? flags[$0] : $0;
        });
    });

    tool.addFormatter('prefixed', function(text, date, flags, lang) {
        return text.replace(/%(d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*')/g, function ($0, $1) {
            return $1 in flags ? flags[$1] : $0;
        });
    });

    function integer(val) {
        return parseInt(val, 10);
    }

    function isSameDay(d1, d2)  {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() == d2.getMonth() &&
            d1.getDate() == d2.getDate();
    }

    function parseDate(val) {

        if (val === undefined) { return; }
        if (val.constructor == Date) { return val; }

        if (typeof val == 'string') {

            // rfc3339?
            var els = val.split("-");
            if (els.length == 3) {
                return new Date(integer(els[0]), integer(els[1]) -1, integer(els[2]));
            }

            // invalid offset
            if ( !(/^-?\d+$/).test(val) ) { return; }

            // convert to integer
            val = integer(val);
        }

        var date = new Date();
        date.setDate(date.getDate() + val);
        return date;
    }

//}}}


    function Dateinput(input, conf)  {

        // variables
        var self = this,
             now = new Date(),
             yearNow = now.getFullYear(),
             css = conf.css,
             labels = LABELS[conf.lang],
             root = $("#" + css.root),
             title = root.find("#" + css.title),
             trigger,
             pm, nm,
             currYear, currMonth, currDay,
             monthSelector, yearSelector,
             value = input.attr("data-value") || conf.value || input.val(),
             min = input.attr("min") || conf.min,
             max = input.attr("max") || conf.max,
             opened,
             original;

        // zero min is not undefined
        if (min === 0) { min = "0"; }

        // use sane values for value, min & max
        value = parseDate(value) || now;

        min   = parseDate(min || new Date(yearNow + conf.yearRange[0], 1, 1));
        max   = parseDate(max || new Date( yearNow + conf.yearRange[1]+ 1, 1, -1));


        // check that language exists
        if (!labels) { throw "Dateinput: invalid language: " + conf.lang; }

        // Replace built-in date input: NOTE: input.attr("type", "text") throws exception by the browser
        if (input.attr("type") == 'date') {
            original = input.clone(),
          def = original.wrap("<div/>").parent().html(),
          clone = $(def.replace(/type/i, "type=text data-orig-type"));

            if (conf.value) clone.val(conf.value);   // jquery 1.6.2 val(undefined) will clear val()

            input.replaceWith(clone);
            input = clone;
        }

        input.addClass(css.input);

        var fire = input.add(self);

        // construct layout
        if (!root.length) {

            // root
            root = $('<div><div><a/><div/><a/></div><div><div/><div/></div></div>')
                .hide().css({position: 'absolute'}).attr("id", css.root);

            // elements
            root.children()
                .eq(0).attr("id", css.head).end()
                .eq(1).attr("id", css.body).children()
                    .eq(0).attr("id", css.days).end()
                    .eq(1).attr("id", css.weeks).end().end().end()
                .find("a").eq(0).attr("id", css.prev).end().eq(1).attr("id", css.next);

            // title
            title = root.find("#" + css.head).find("div").attr("id", css.title);

            // year & month selectors
            if (conf.selectors) {
                monthSelector = $("<select/>").attr("id", css.month);
                yearSelector = $("<select/>").attr("id", css.year);
                title.html(monthSelector.add(yearSelector));
            }

            // day titles
            var days = root.find("#" + css.days);

            // days of the week
            for (var d = 0; d < 7; d++) {
                days.append($("<span/>").text(labels.shortDays[(d + conf.firstDay) % 7]));
            }

            $("body").append(root);
        }


        // trigger icon
        if (conf.trigger) {
            trigger = $("<a/>").attr("href", "#").addClass(css.trigger).click(function(e)  {
                conf.toggle ? self.toggle() : self.show();
                return e.preventDefault();
            }).insertAfter(input);
        }


        // layout elements
        var weeks = root.find("#" + css.weeks);
        yearSelector = root.find("#" + css.year);
        monthSelector = root.find("#" + css.month);


//{{{ pick

        function select(date, conf, e) {
            // If it is readonly, then we'll just close the calendar
            if (input.attr('readonly')) {
                self.hide(e);
                return;
            }

            // current value
            value      = date;
            currYear  = date.getFullYear();
            currMonth = date.getMonth();
            currDay     = date.getDate();

            e || (e = $.Event("api"));

            // focus the input after selection (doesn't work in IE)
            if (e.type == "click" && !/msie/.test(navigator.userAgent.toLowerCase())) {
                input.focus();
            }

            // beforeChange
            e.type = "beforeChange";

            fire.trigger(e, [date]);
            if (e.isDefaultPrevented()) { return; }

            // formatting
            input.val(format(conf.formatter, date, conf.format, conf.lang));

      // change
            e.type = "change";
            fire.trigger(e);

            // store value into input
            input.data("date", date);

            self.hide(e);
        }
//}}}


//{{{ onShow

        function onShow(ev) {

            ev.type = "onShow";
            fire.trigger(ev);

            $(document).on("keydown.d", function(e) {

                if (e.ctrlKey) { return true; }
                var key = e.keyCode;

                // backspace or delete clears the value
                if (key == 8 || key == 46) {
                    input.val("");
                    return self.hide(e);
                }

                // esc or tab key exits
                if (key == 27 || key == 9) { return self.hide(e); }

                if ($(KEYS).index(key) >= 0) {

                    if (!opened) {
                        self.show(e);
                        return e.preventDefault();
                    }

                    var days = $("#" + css.weeks + " a"),
                         el = $("." + css.focus),
                         index = days.index(el);

                    el.removeClass(css.focus);

                    if (key == 74 || key == 40) { index += 7; }
                    else if (key == 75 || key == 38) { index -= 7; }
                    else if (key == 76 || key == 39) { index += 1; }
                    else if (key == 72 || key == 37) { index -= 1; }


                    if (index > 41) {
                         self.addMonth();
                         el = $("#" + css.weeks + " a:eq(" + (index-42) + ")");
                    } else if (index < 0) {
                         self.addMonth(-1);
                         el = $("#" + css.weeks + " a:eq(" + (index+42) + ")");
                    } else {
                         el = days.eq(index);
                    }

                    el.addClass(css.focus);
                    return e.preventDefault();

                }

                // pageUp / pageDown
                if (key == 34) { return self.addMonth(); }
                if (key == 33) { return self.addMonth(-1); }

                // home
                if (key == 36) { return self.today(); }

                // enter
                if (key == 13) {
                    if (!$(e.target).is("select")) {
                        $("." + css.focus).click();
                    }
                }

                return $([16, 17, 18, 9]).index(key) >= 0;
            });


            // click outside dateinput
            $(document).on("click.d", function(e) {
                var el = e.target;

                if (!(el.id == css.root || $(el).parents("#" + css.root).length) && el != input[0] && (!trigger || el != trigger[0])) {
                    self.hide(e);
                }

            });
        }
//}}}


        $.extend(self, {


            /**
            *   @public
            *   Show the calendar
            */
            show: function(e) {

                if (input.attr("disabled") || opened) { return; }

                // onBeforeShow
                e = e || $.Event();
                e.type = "onBeforeShow";
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return; }

                $.each(instances, function() {
                    this.hide();
                });

                opened = true;

        // month selector
        monthSelector.off("change").change(function() {
          self.setValue(integer(yearSelector.val()), integer($(this).val()));
        });

        // year selector
        yearSelector.off("change").change(function() {
          self.setValue(integer($(this).val()), integer(monthSelector.val()));
        });

                // prev / next month
                pm = root.find("#" + css.prev).off("click").click(function(e) {
                    if (!pm.hasClass(css.disabled)) {
                      self.addMonth(-1);
                    }
                    return false;
                });

                nm = root.find("#" + css.next).off("click").click(function(e) {
                    if (!nm.hasClass(css.disabled)) {
                        self.addMonth();
                    }
                    return false;
                });

                // set date
                self.setValue(value);

                // show calendar
                var pos = input.offset();

                // iPad position fix
                if (/iPad/i.test(navigator.userAgent)) {
                    pos.top -= $(window).scrollTop();
                }

                root.css({
                    top: pos.top + input.outerHeight(true) + conf.offset[0],
                    left: pos.left + conf.offset[1]
                });

                if (conf.speed) {
                    root.show(conf.speed, function() {
                        onShow(e);
                    });
                } else {
                    root.show();
                    onShow(e);
                }

                return self;
            },

      /**
      *   @public
      *
      *   Set the value of the dateinput
      */
            setValue: function(year, month, day)  {

                var date = integer(month) >= -1 ? new Date(integer(year), integer(month), integer(day === undefined || isNaN(day) ? 1 : day)) :
                    year || value;

                if (date < min) { date = min; }
                else if (date > max) { date = max; }

                // date given as ISO string
                if (typeof year == 'string') { date = parseDate(year); }

                year = date.getFullYear();
                month = date.getMonth();
                day = date.getDate();


                // roll year & month
                if (month == -1) {
                    month = 11;
                    year--;
                } else if (month == 12) {
                    month = 0;
                    year++;
                }

                if (!opened) {
                    select(date, conf);
                    return self;
                }

                currMonth = month;
                currYear = year;
                currDay = day;

                // variables
                var tmp = new Date(year, month, 1 - conf.firstDay), begin = tmp.getDay(),
                     days = dayAm(year, month),
                     prevDays = dayAm(year, month - 1),
                     week;

                // selectors
                if (conf.selectors) {

                    // month selector
                    monthSelector.empty();
                    $.each(labels.months, function(i, m) {
                        if (min < new Date(year, i + 1, 1) && max > new Date(year, i, 0)) {
                            monthSelector.append($("<option/>").html(m).attr("value", i));
                        }
                    });

                    // year selector
                    yearSelector.empty();
                    var yearNow = now.getFullYear();

                    for (var i = yearNow + conf.yearRange[0];  i < yearNow + conf.yearRange[1]; i++) {
                        if (min < new Date(i + 1, 0, 1) && max > new Date(i, 0, 0)) {
                            yearSelector.append($("<option/>").text(i));
                        }
                    }

                    monthSelector.val(month);
                    yearSelector.val(year);

                // title
                } else {
                    title.html(labels.months[month] + " " + year);
                }

                // populate weeks
                weeks.empty();
                pm.add(nm).removeClass(css.disabled);

                // !begin === "sunday"
                for (var j = !begin ? -7 : 0, a, num; j < (!begin ? 35 : 42); j++) {

                    a = $("<a/>");

                    if (j % 7 === 0) {
                        week = $("<div/>").addClass(css.week);
                        weeks.append(week);
                    }

                    if (j < begin)  {
                        a.addClass(css.off);
                        num = prevDays - begin + j + 1;
                        date = new Date(year, month-1, num);

                    } else if (j >= begin + days)  {
                        a.addClass(css.off);
                        num = j - days - begin + 1;
                        date = new Date(year, month+1, num);

                    } else  {
                        num = j - begin + 1;
                        date = new Date(year, month, num);

                        // current date
                        if (isSameDay(value, date)) {
                            a.attr("id", css.current).addClass(css.focus);

                        // today
                        } else if (isSameDay(now, date)) {
                            a.attr("id", css.today);
                        }
                    }

                    // disabled
                    if (min && date < min) {
                        a.add(pm).addClass(css.disabled);
                    }

                    if (max && date > max) {
                        a.add(nm).addClass(css.disabled);
                    }

                    a.attr("href", "#" + num).text(num).data("date", date);

                    week.append(a);
                }

                // date picking
                weeks.find("a").click(function(e) {
                    var el = $(this);
                    if (!el.hasClass(css.disabled)) {
                        $("#" + css.current).removeAttr("id");
                        el.attr("id", css.current);
                        select(el.data("date"), conf, e);
                    }
                    return false;
                });

                // sunday
                if (css.sunday) {
                    weeks.find("." + css.week).each(function() {
                        var beg = conf.firstDay ? 7 - conf.firstDay : 0;
                        $(this).children().slice(beg, beg + 1).addClass(css.sunday);
                    });
                }

                return self;
            },
    //}}}

            setMin: function(val, fit) {
                min = parseDate(val);
                if (fit && value < min) { self.setValue(min); }
                return self;
            },

            setMax: function(val, fit) {
                max = parseDate(val);
                if (fit && value > max) { self.setValue(max); }
                return self;
            },

            today: function() {
                return self.setValue(now);
            },

            addDay: function(amount) {
                return this.setValue(currYear, currMonth, currDay + (amount || 1));
            },

            addMonth: function(amount) {
              var targetMonth        = currMonth + (amount || 1),
            daysInTargetMonth  = dayAm(currYear, targetMonth),
            targetDay          = currDay <= daysInTargetMonth ? currDay : daysInTargetMonth;

        return this.setValue(currYear, targetMonth, targetDay);
            },

            addYear: function(amount) {
                return this.setValue(currYear + (amount || 1), currMonth, currDay);
            },

            destroy: function() {
                input.add(document).off("click.d keydown.d");
                root.add(trigger).remove();
                input.removeData("dateinput").removeClass(css.input);
                if (original)  { input.replaceWith(original); }
            },

            hide: function(e) {

                if (opened) {

                    // onHide
                    e = $.Event();
                    e.type = "onHide";
                    fire.trigger(e);

                    // cancelled ?
                    if (e.isDefaultPrevented()) { return; }

                    $(document).off("click.d keydown.d");

                    // do the hide
                    root.hide();
                    opened = false;
                }

                return self;
            },

            toggle: function(){
              return self.isOpen() ? self.hide() : self.show();
            },

            getConf: function() {
                return conf;
            },

            getInput: function() {
                return input;
            },

            getCalendar: function() {
                return root;
            },

            getValue: function(dateFormat) {
                return dateFormat ? format(conf.formatter, value, dateFormat, conf.lang) : value;
            },

            isOpen: function() {
                return opened;
            }

        });

        // callbacks
        $.each(['onBeforeShow','onShow','change','onHide'], function(i, name) {

            // configuration
            if ($.isFunction(conf[name]))  {
                $(self).on(name, conf[name]);
            }

            // API methods
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });

        if (!conf.editable) {

            // show dateinput & assign keyboard shortcuts
            input.on("focus.d click.d", self.show).keydown(function(e) {

                var key = e.keyCode;

                // open dateinput with navigation keyw
                if (!opened &&  $(KEYS).index(key) >= 0) {
                    self.show(e);
                    return e.preventDefault();

            // clear value on backspace or delete
            } else if (key == 8 || key == 46) {
                input.val("");
                }

                // allow tab
                return e.shiftKey || e.ctrlKey || e.altKey || key == 9 ? true : e.preventDefault();

            });
        }

        // initial value
        if (parseDate(input.val())) {
            select(value, conf);
        }

    }

    $.expr[':'].date = function(el) {
        var type = el.getAttribute("type");
        return type && type == 'date' || !!$(el).data("dateinput");
    };


    $.fn.dateinput = function(conf) {

        // already instantiated
        if (this.data("dateinput")) { return this; }

        // configuration
        conf = $.extend(true, {}, tool.conf, conf);

        // CSS prefix
        $.each(conf.css, function(key, val) {
            if (!val && key != 'prefix') {
                conf.css[key] = (conf.css.prefix || '') + (val || key);
            }
        });

        var els;

        this.each(function() {
            var el = new Dateinput($(this), conf);
            instances.push(el);
            var input = el.getInput().data("dateinput", el);
            els = els ? els.add(input) : input;
        });

        return els ? els : this;
    };


}) (jQuery);



/**
 * @license
 * jQuery Tools @VERSION / Overlay Apple effect.
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/overlay/apple.html
 *
 * Since: July 2009
 * Date: @DATE
 */
(function($) {

    // version number
    var t = $.tools.overlay,
         w = $(window);

    // extend global configuragion with effect specific defaults
    $.extend(t.conf, {
        start: {
            top: null,
            left: null
        },

        fadeInSpeed: 'fast',
        zIndex: 9999
    });

    // utility function
    function getPosition(el) {
        var p = el.offset();
        return {
            top: p.top + el.height() / 2,
            left: p.left + el.width() / 2
        };
    }

//{{{ load

    var loadEffect = function(pos, onLoad) {

        var overlay = this.getOverlay(),
             conf = this.getConf(),
             trigger = this.getTrigger(),
             self = this,
             oWidth = overlay.outerWidth(true),
             img = overlay.data("img"),
             position = conf.fixed ? 'fixed' : 'absolute';


        // growing image is required.
        if (!img) {
            var bg = overlay.css("backgroundImage");

            if (!bg) {
                throw "background-image CSS property not set for overlay";
            }

            // url("bg.jpg") --> bg.jpg
            bg = bg.slice(bg.indexOf("(") + 1, bg.indexOf(")")).replace(/\"/g, "");
            overlay.css("backgroundImage", "none");

            img = $('<img src="' + bg + '"/>');
            img.css({border:0, display:'none'}).width(oWidth);
            $('body').append(img);
            overlay.data("img", img);
        }

        // initial top & left
        var itop = conf.start.top || Math.round(w.height() / 2),
             ileft = conf.start.left || Math.round(w.width() / 2);

        if (trigger) {
            var p = getPosition(trigger);
            itop = p.top;
            ileft = p.left;
        }

        // put overlay into final position
        if (conf.fixed) {
            itop -= w.scrollTop();
            ileft -= w.scrollLeft();
        } else {
            pos.top += w.scrollTop();
            pos.left += w.scrollLeft();
        }

        // initialize background image and make it visible
        img.css({
            position: 'absolute',
            top: itop,
            left: ileft,
            width: 0,
            zIndex: conf.zIndex
        }).show();

        pos.position = position;
        overlay.css(pos);

        // begin growing
        img.animate({
            top: pos.top,
            left: pos.left,
            width: oWidth}, conf.speed, function() {

            // set close button and content over the image
            overlay.css("zIndex", conf.zIndex + 1).fadeIn(conf.fadeInSpeed, function()  {

                if (self.isOpened() && !$(this).index(overlay)) {
                    onLoad.call();
                } else {
                    overlay.hide();
                }
            });

        }).css("position", position);

    };
//}}}


    var closeEffect = function(onClose) {

        // variables
        var overlay = this.getOverlay().hide(),
             conf = this.getConf(),
             trigger = this.getTrigger(),
             img = overlay.data("img"),

             css = {
                 top: conf.start.top,
                 left: conf.start.left,
                 width: 0
             };

        // trigger position
        if (trigger) { $.extend(css, getPosition(trigger)); }


        // change from fixed to absolute position
        if (conf.fixed) {
            img.css({position: 'absolute'})
                .animate({ top: "+=" + w.scrollTop(), left: "+=" + w.scrollLeft()}, 0);
        }

        // shrink image
        img.animate(css, conf.closeSpeed, onClose);
    };


    // add overlay effect
    t.addEffect("apple", loadEffect, closeEffect);

})(jQuery);


/**
 * @license
 * jQuery Tools @VERSION Overlay - Overlay base. Extend it.
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/overlay/
 *
 * Since: March 2008
 * Date: @DATE
 */
(function($) {

    // static constructs
    $.tools = $.tools || {version: '@VERSION'};

    $.tools.overlay = {

        addEffect: function(name, loadFn, closeFn) {
            effects[name] = [loadFn, closeFn];
        },

        conf: {
            close: null,
            closeOnClick: true,
            closeOnEsc: true,
            closeSpeed: 'fast',
            effect: 'default',

            // since 1.2. fixed positioning not supported by IE6
            fixed: !/msie/.test(navigator.userAgent.toLowerCase()) || navigator.appVersion > 6,

            left: 'center',
            load: false, // 1.2
            mask: null,
            oneInstance: true,
            speed: 'normal',
            target: null, // target element to be overlayed. by default taken from [rel]
            top: '10%'
        }
    };


    var instances = [], effects = {};

    // the default effect. nice and easy!
    $.tools.overlay.addEffect('default',

        /*
            onLoad/onClose functions must be called otherwise none of the
            user supplied callback methods won't be called
        */
        function(pos, onLoad) {

            var conf = this.getConf(),
                 w = $(window);

            if (!conf.fixed)  {
                pos.top += w.scrollTop();
                pos.left += w.scrollLeft();
            }

            pos.position = conf.fixed ? 'fixed' : 'absolute';
            this.getOverlay().css(pos).fadeIn(conf.speed, onLoad);

        }, function(onClose) {
            this.getOverlay().fadeOut(this.getConf().closeSpeed, onClose);
        }
    );


    function Overlay(trigger, conf) {

        // private variables
        var self = this,
             fire = trigger.add(self),
             w = $(window),
             closers,
             overlay,
             opened,
             maskConf = $.tools.expose && (conf.mask || conf.expose),
             uid = Math.random().toString().slice(10);


        // mask configuration
        if (maskConf) {
            if (typeof maskConf == 'string') { maskConf = {color: maskConf}; }
            maskConf.closeOnClick = maskConf.closeOnEsc = false;
        }

        // get overlay and trigger
        var jq = conf.target || trigger.attr("rel");
        overlay = jq ? $(jq) : null || trigger;

        // overlay not found. cannot continue
        if (!overlay.length) { throw "Could not find Overlay: " + jq; }

        // trigger's click event
        if (trigger && trigger.index(overlay) == -1) {
            trigger.click(function(e) {
                self.load(e);
                return e.preventDefault();
            });
        }

        // API methods
        $.extend(self, {

            load: function(e) {

                // can be opened only once
                if (self.isOpened()) { return self; }

                // find the effect
                 var eff = effects[conf.effect];
                 if (!eff) { throw "Overlay: cannot find effect : \"" + conf.effect + "\""; }

                // close other instances?
                if (conf.oneInstance) {
                    $.each(instances, function() {
                        this.close(e);
                    });
                }

                // onBeforeLoad
                e = e || $.Event();
                e.type = "onBeforeLoad";
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return self; }

                // opened
                opened = true;

                // possible mask effect
                if (maskConf) { $(overlay).expose(maskConf); }

                // position & dimensions
                var top = conf.top,
                     left = conf.left,
                     oWidth = overlay.outerWidth(true),
                     oHeight = overlay.outerHeight(true);

                if (typeof top == 'string')  {
                    top = top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) :
                        parseInt(top, 10) / 100 * w.height();
                }

                if (left == 'center') { left = Math.max((w.width() - oWidth) / 2, 0); }


                 // load effect
                eff[0].call(self, {top: top, left: left}, function() {
                    if (opened) {
                        e.type = "onLoad";
                        fire.trigger(e);
                    }
                });

                // mask.click closes overlay
                if (maskConf && conf.closeOnClick) {
                    $.mask.getMask().one("click", self.close);
                }

                // when window is clicked outside overlay, we close
                if (conf.closeOnClick) {
                    $(document).on("click." + uid, function(e) {
                        if (!$(e.target).parents(overlay).length) {
                            self.close(e);
                        }
                    });
                }

                // keyboard::escape
                if (conf.closeOnEsc) {

                    // one callback is enough if multiple instances are loaded simultaneously
                    $(document).on("keydown." + uid, function(e) {
                        if (e.keyCode == 27) {
                            self.close(e);
                        }
                    });
                }


                return self;
            },

            close: function(e) {

                if (!self.isOpened()) { return self; }

                e = e || $.Event();
                e.type = "onBeforeClose";
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return; }

                opened = false;

                // close effect
                effects[conf.effect][1].call(self, function() {
                    e.type = "onClose";
                    fire.trigger(e);
                });

                // unbind the keyboard / clicking actions
                $(document).off("click." + uid + " keydown." + uid);

                if (maskConf) {
                    $.mask.close();
                }

                return self;
            },

            getOverlay: function() {
                return overlay;
            },

            getTrigger: function() {
                return trigger;
            },

            getClosers: function() {
                return closers;
            },

            isOpened: function()  {
                return opened;
            },

            // manipulate start, finish and speeds
            getConf: function() {
                return conf;
            }

        });

        // callbacks
        $.each("onBeforeLoad,onStart,onLoad,onBeforeClose,onClose".split(","), function(i, name) {

            // configuration
            if ($.isFunction(conf[name])) {
                $(self).on(name, conf[name]);
            }

            // API
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });

        // close button
        closers = overlay.find(conf.close || ".close");

        if (!closers.length && !conf.close) {
            closers = $('<a class="close"></a>');
            overlay.prepend(closers);
        }

        closers.click(function(e) {
            self.close(e);
        });

        // autoload
        if (conf.load) { self.load(); }

    }

    // jQuery plugin initialization
    $.fn.overlay = function(conf) {

        // already constructed --> return API
        var el = this.data("overlay");
        if (el) { return el; }

        if ($.isFunction(conf)) {
            conf = {onBeforeLoad: conf};
        }

        conf = $.extend(true, {}, $.tools.overlay.conf, conf);

        this.each(function() {
            el = new Overlay($(this), conf);
            instances.push(el);
            $(this).data("overlay", el);
        });

        return conf.api ? el: this;
    };

})(jQuery);


/**
 * @license
 * jQuery Tools @VERSION Rangeinput - HTML5 <input type="range" /> for humans
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/rangeinput/
 *
 * Since: Mar 2010
 * Date: @DATE
 */

 var oldFnData = jQuery.fn.data;

jQuery.fn.data = function( name ) {
  var ret, evt,
    elem = this[0];

  // Handles 1.7 which has this behavior and 1.8 which doesn't
  if ( elem && name === "events" && arguments.length === 1 ) {
    ret = jQuery.data( elem, name );
    evt = jQuery._data( elem, name );
  }
  return oldFnData.apply( this, arguments );
};

(function($) {

    $.tools = $.tools || {version: '@VERSION'};

    var tool;

    tool = $.tools.rangeinput = {

        conf: {
            min: 0,
            max: 100,        // as defined in the standard
            step: 'any',     // granularity of the value. a non-zero float or int (or "any")
            steps: 0,
            value: 0,
            precision: undefined,
            vertical: 0,
            keyboard: true,
            progress: false,
            speed: 100,

            // set to null if not needed
            css: {
                input:        'range',
                slider:         'slider',
                progress:     'progress',
                handle:         'handle'
            }

        }
    };

//{{{ fn.drag

    /*
        FULL featured drag and drop. 0.7 kb minified, 0.3 gzipped. done.
        Who told d'n'd is rocket science? Usage:

        $(".myelement").drag({y: false}).on("drag", function(event, x, y) {
            // do your custom thing
        });

        Configuration:
            x: true,         // enable horizontal drag
            y: true,         // enable vertical drag
            drag: true         // true = perform drag, false = only fire events

        Events: dragStart, drag, dragEnd.
    */
    var doc, draggable;

    $.fn.drag = function(conf) {

        // disable IE specialities
        document.ondragstart = function () { return false; };

        conf = $.extend({x: true, y: true, drag: true}, conf);

        doc = doc || $(document).on("mousedown mouseup", function(e) {

            var el = $(e.target);

            // start
            if (e.type == "mousedown" && el.data("drag")) {

                var offset = el.position(),
                     x0 = e.pageX - offset.left,
                     y0 = e.pageY - offset.top,
                     start = true;

                doc.on("mousemove.drag", function(e) {
                    var x = e.pageX -x0,
                         y = e.pageY -y0,
                         props = {};

                    if (conf.x) { props.left = x; }
                    if (conf.y) { props.top = y; }

                    if (start) {
                        el.trigger("dragStart");
                        start = false;
                    }
                    if (conf.drag) { el.css(props); }
                    el.trigger("drag", [y, x]);
                    draggable = el;
                });

                e.preventDefault();

            } else {

                try {
                    if (draggable) {
                        draggable.trigger("dragEnd");
                    }
                } finally {
                    doc.off("mousemove.drag");
                    draggable = null;
                }
            }

        });

        return this.data("drag", true);
    };

//}}}



    function round(value, precision) {
        var n = Math.pow(10, precision);
        return Math.round(value * n) / n;
    }

    // get hidden element's width or height even though it's hidden
    function dim(el, key) {
        var v = parseInt(el.css(key), 10);
        if (v) { return v; }
        var s = el[0].currentStyle;
        return s && s.width && parseInt(s.width, 10);
    }

    function hasEvent(el) {
        var e = el.data("events");
        return e && e.onSlide;
    }

    function RangeInput(input, conf) {

        // private variables
        var self = this,
             css = conf.css,
             root = $("<div><div/><a href='#'/></div>").data("rangeinput", self),
             vertical,
             value,            // current value
             origo,            // handle's start point
             len,                // length of the range
             pos;                // current position of the handle

        // create range
        input.before(root);

        var handle = root.addClass(css.slider).find("a").addClass(css.handle),
             progress = root.find("div").addClass(css.progress);

        // get (HTML5) attributes into configuration
        $.each("min,max,step,value".split(","), function(i, key) {
            var val = input.attr(key);
            if (parseFloat(val)) {
                conf[key] = parseFloat(val, 10);
            }
        });

        var range = conf.max - conf.min,
             step = conf.step == 'any' ? 0 : conf.step,
             precision = conf.precision;

        if (precision === undefined) {
            precision = step.toString().split(".");
            precision = precision.length === 2 ? precision[1].length : 0;
        }

        // Replace built-in range input (type attribute cannot be changed)
        if (input.attr("type") == 'range') {
            var def = input.clone().wrap("<div/>").parent().html(),
                 clone = $(def.replace(/type/i, "type=text data-orig-type"));

            clone.val(conf.value);
            input.replaceWith(clone);
            input = clone;
        }

        input.addClass(css.input);

        var fire = $(self).add(input), fireOnSlide = true;


        /**
             The flesh and bone of this tool. All sliding is routed trough this.

            @param evt types include: click, keydown, blur and api (setValue call)
            @param isSetValue when called trough setValue() call (keydown, blur, api)

            vertical configuration gives additional complexity.
         */
        function slide(evt, x, val, isSetValue) {

            // calculate value based on slide position
            if (val === undefined) {
                val = x / len * range;

            // x is calculated based on val. we need to strip off min during calculation
            } else if (isSetValue) {
                val -= conf.min;
            }

            // increment in steps
            if (step) {
                val = Math.round(val / step) * step;
            }

            // count x based on value or tweak x if stepping is done
            if (x === undefined || step) {
                x = val * len / range;
            }

            // crazy value?
            if (isNaN(val)) { return self; }

            // stay within range
            x = Math.max(0, Math.min(x, len));
            val = x / len * range;

            if (isSetValue || !vertical) {
                val += conf.min;
            }

            // in vertical ranges value rises upwards
            if (vertical) {
                if (isSetValue) {
                    x = len -x;
                } else {
                    val = conf.max - val;
                }
            }

            // precision
            val = round(val, precision);

            // onSlide
            var isClick = evt.type == "click";
            if (fireOnSlide && value !== undefined && !isClick) {
                evt.type = "onSlide";
                fire.trigger(evt, [val, x]);
                if (evt.isDefaultPrevented()) { return self; }
            }

            // speed & callback
            var speed = isClick ? conf.speed : 0,
                 callback = isClick ? function()  {
                    evt.type = "change";
                    fire.trigger(evt, [val]);
                 } : null;

            if (vertical) {
                handle.animate({top: x}, speed, callback);
                if (conf.progress) {
                    progress.animate({height: len - x + handle.height() / 2}, speed);
                }

            } else {
                handle.animate({left: x}, speed, callback);
                if (conf.progress) {
                    progress.animate({width: x + handle.width() / 2}, speed);
                }
            }

            // store current value
            value = val;
            pos = x;

            // se input field's value
            input.val(val);

            return self;
        }


        $.extend(self, {

            getValue: function() {
                return value;
            },

            setValue: function(val, e) {
                init();
                return slide(e || $.Event("api"), undefined, val, true);
            },

            getConf: function() {
                return conf;
            },

            getProgress: function() {
                return progress;
            },

            getHandle: function() {
                return handle;
            },

            getInput: function() {
                return input;
            },

            step: function(am, e) {
                e = e || $.Event();
                var step = conf.step == 'any' ? 1 : conf.step;
                self.setValue(value + step * (am || 1), e);
            },

            // HTML5 compatible name
            stepUp: function(am) {
                return self.step(am || 1);
            },

            // HTML5 compatible name
            stepDown: function(am) {
                return self.step(-am || -1);
            }

        });

        // callbacks
        $.each("onSlide,change".split(","), function(i, name) {

            // from configuration
            if ($.isFunction(conf[name]))  {
                $(self).on(name, conf[name]);
            }

            // API methods
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });


        // dragging
        handle.drag({drag: false}).on("dragStart", function() {

            /* do some pre- calculations for seek() function. improves performance */
            init();

            // avoid redundant event triggering (= heavy stuff)
            fireOnSlide = hasEvent($(self)) || hasEvent(input);


        }).on("drag", function(e, y, x) {

            if (input.is(":disabled")) { return false; }
            slide(e, vertical ? y : x);

        }).on("dragEnd", function(e) {
            if (!e.isDefaultPrevented()) {
                e.type = "change";
                fire.trigger(e, [value]);
            }

        }).click(function(e) {
            return e.preventDefault();
        });

        // clicking
        root.click(function(e) {
            if (input.is(":disabled") || e.target == handle[0]) {
                return e.preventDefault();
            }
            init();
            var fix = vertical ? handle.height() / 2 : handle.width() / 2;
            slide(e, vertical ? len-origo-fix + e.pageY  : e.pageX -origo -fix);
        });

        if (conf.keyboard) {

            input.keydown(function(e) {

                if (input.attr("readonly")) { return; }

                var key = e.keyCode,
                     up = $([75, 76, 38, 33, 39]).index(key) != -1,
                     down = $([74, 72, 40, 34, 37]).index(key) != -1;

                if ((up || down) && !(e.shiftKey || e.altKey || e.ctrlKey)) {

                    // UP:     k=75, l=76, up=38, pageup=33, right=39
                    if (up) {
                        self.step(key == 33 ? 10 : 1, e);

                    // DOWN:    j=74, h=72, down=40, pagedown=34, left=37
                    } else if (down) {
                        self.step(key == 34 ? -10 : -1, e);
                    }
                    return e.preventDefault();
                }
            });
        }


        input.blur(function(e) {
            var val = $(this).val();
            if (val !== value) {
                self.setValue(val, e);
            }
        });


        // HTML5 DOM methods
        $.extend(input[0], { stepUp: self.stepUp, stepDown: self.stepDown});


        // calculate all dimension related stuff
        function init() {
             vertical = conf.vertical || dim(root, "height") > dim(root, "width");

            if (vertical) {
                len = dim(root, "height") - dim(handle, "height");
                origo = root.offset().top + len;

            } else {
                len = dim(root, "width") - dim(handle, "width");
                origo = root.offset().left;
            }
        }

        function begin() {
            init();
            self.setValue(conf.value !== undefined ? conf.value : conf.min);
        }
        begin();

        // some browsers cannot get dimensions upon initialization
        if (!len) {
            $(window).load(begin);
        }
    }

    $.expr[':'].range = function(el) {
        var type = el.getAttribute("type");
        return type && type == 'range' || !!$(el).filter("input").data("rangeinput");
    };


    // jQuery plugin implementation
    $.fn.rangeinput = function(conf) {

        // already installed
        if (this.data("rangeinput")) { return this; }

        // extend configuration with globals
        conf = $.extend(true, {}, tool.conf, conf);

        var els;

        this.each(function() {
            var el = new RangeInput($(this), $.extend(true, {}, conf));
            var input = el.getInput().data("rangeinput", el);
            els = els ? els.add(input) : input;
        });

        return els ? els : this;
    };


}) (jQuery);


/**
 * @license
 * jQuery Tools @VERSION / Scrollable Autoscroll
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/scrollable/autoscroll.html
 *
 * Since: September 2009
 * Date: @DATE
 */
(function($) {

    var t = $.tools.scrollable;

    t.autoscroll = {

        conf: {
            autoplay: true,
            interval: 3000,
            autopause: true
        }
    };

    // jQuery plugin implementation
    $.fn.autoscroll = function(conf) {

        if (typeof conf == 'number') {
            conf = {interval: conf};
        }

        var opts = $.extend({}, t.autoscroll.conf, conf), ret;

        this.each(function() {

            var api = $(this).data("scrollable"),
                root = api.getRoot(),
                // interval stuff
                timer, stopped = false;

        /**
      *
      *   Function to run autoscroll through event binding rather than setInterval
      *   Fixes this bug: http://flowplayer.org/tools/forum/25/72029
      */
      function scroll(){
          // Fixes https://github.com/jquerytools/jquerytools/issues/591
        if (timer) clearTimeout(timer); // reset timeout, especially for onSeek event
        timer = setTimeout(function(){
          api.next();
        }, opts.interval);
      }

            if (api) { ret = api; }

            api.play = function() {

                // do not start additional timer if already exists
                if (timer) { return; }

                stopped = false;
                root.on('onSeek', scroll);
                scroll();
            };

            api.pause = function() {
                timer = clearTimeout(timer);  // clear any queued items immediately
                root.off('onSeek', scroll);
            };

            // resume playing if not stopped
            api.resume = function() {
                stopped || api.play();
            };

            // when stopped - mouseover won't restart
            api.stop = function() {
              stopped = true;
                api.pause();
            };

            /* when mouse enters, autoscroll stops */
            if (opts.autopause) {
                root.add(api.getNaviButtons()).hover(api.pause, api.resume);
            }

            if (opts.autoplay) {
                api.play();
            }

        });

        return opts.api ? ret : this;

    };

})(jQuery);

/**
 * @license
 * jQuery Tools @VERSION Scrollable - New wave UI design
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/scrollable.html
 *
 * Since: March 2008
 * Date: @DATE
 */
(function($) {

    // static constructs
    $.tools = $.tools || {version: '@VERSION'};

    $.tools.scrollable = {

        conf: {
            activeClass: 'active',
            circular: false,
            clonedClass: 'cloned',
            disabledClass: 'disabled',
            easing: 'swing',
            initialIndex: 0,
            item: '> *',
            items: '.items',
            keyboard: true,
            mousewheel: false,
            next: '.next',
            prev: '.prev',
            size: 1,
            speed: 400,
            vertical: false,
            touch: true,
            wheelSpeed: 0
        }
    };

    // get hidden element's width or height even though it's hidden
    function dim(el, key) {
        var v = parseInt(el.css(key), 10);
        if (v) { return v; }
        var s = el[0].currentStyle;
        return s && s.width && parseInt(s.width, 10);
    }

    function find(root, query) {
        var el = $(query);
        return el.length < 2 ? el : root.parent().find(query);
    }

    var current;

    // constructor
    function Scrollable(root, conf) {

        // current instance
        var self = this,
             fire = root.add(self),
             itemWrap = root.children(),
             index = 0,
             vertical = conf.vertical;

        if (!current) { current = self; }
        if (itemWrap.length > 1) { itemWrap = $(conf.items, root); }


        // in this version circular not supported when size > 1
        if (conf.size > 1) { conf.circular = false; }

        // methods
        $.extend(self, {

            getConf: function() {
                return conf;
            },

            getIndex: function() {
                return index;
            },

            getSize: function() {
                return self.getItems().size();
            },

            getNaviButtons: function() {
                return prev.add(next);
            },

            getRoot: function() {
                return root;
            },

            getItemWrap: function() {
                return itemWrap;
            },

            getItems: function() {
                return itemWrap.find(conf.item).not("." + conf.clonedClass);
            },

            move: function(offset, time) {
                return self.seekTo(index + offset, time);
            },

            next: function(time) {
                return self.move(conf.size, time);
            },

            prev: function(time) {
                return self.move(-conf.size, time);
            },

            begin: function(time) {
                return self.seekTo(0, time);
            },

            end: function(time) {
                return self.seekTo(self.getSize() -1, time);
            },

            focus: function() {
                current = self;
                return self;
            },

            addItem: function(item) {
                item = $(item);

                if (!conf.circular)  {
                    itemWrap.append(item);
                    next.removeClass("disabled");

                } else {
                    itemWrap.children().last().before(item);
                    itemWrap.children().first().replaceWith(item.clone().addClass(conf.clonedClass));
                }

                fire.trigger("onAddItem", [item]);
                return self;
            },


            /* all seeking functions depend on this */
            seekTo: function(i, time, fn) {

                // ensure numeric index
                if (!i.jquery) { i *= 1; }

                // avoid seeking from end clone to the beginning
                if (conf.circular && i === 0 && index == -1 && time !== 0) { return self; }

                // check that index is sane
                if (!conf.circular && i < 0 || i > self.getSize() || i < -1) { return self; }

                var item = i;

                if (i.jquery) {
                    i = self.getItems().index(i);

                } else {
                    item = self.getItems().eq(i);
                }

                // onBeforeSeek
                var e = $.Event("onBeforeSeek");
                if (!fn) {
                    fire.trigger(e, [i, time]);
                    if (e.isDefaultPrevented() || !item.length) { return self; }
                }

                var props = vertical ? {top: -item.position().top} : {left: -item.position().left};

                index = i;
                current = self;
                if (time === undefined) { time = conf.speed; }

                itemWrap.animate(props, time, conf.easing, fn || function() {
                    fire.trigger("onSeek", [i]);
                });

                return self;
            }

        });

        // callbacks
        $.each(['onBeforeSeek', 'onSeek', 'onAddItem'], function(i, name) {

            // configuration
            if ($.isFunction(conf[name])) {
                $(self).on(name, conf[name]);
            }

            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });

        // circular loop
        if (conf.circular) {

            var cloned1 = self.getItems().slice(-1).clone().prependTo(itemWrap),
                 cloned2 = self.getItems().eq(1).clone().appendTo(itemWrap);

            cloned1.add(cloned2).addClass(conf.clonedClass);

            self.onBeforeSeek(function(e, i, time) {

                if (e.isDefaultPrevented()) { return; }

                /*
                    1. animate to the clone without event triggering
                    2. seek to correct position with 0 speed
                */
                if (i == -1) {
                    self.seekTo(cloned1, time, function()  {
                        self.end(0);
                    });
                    return e.preventDefault();

                } else if (i == self.getSize()) {
                    self.seekTo(cloned2, time, function()  {
                        self.begin(0);
                    });
                }

            });

            // seek over the cloned item

            // if the scrollable is hidden the calculations for seekTo position
            // will be incorrect (eg, if the scrollable is inside an overlay).
            // ensure the elements are shown, calculate the correct position,
            // then re-hide the elements. This must be done synchronously to
            // prevent the hidden elements being shown to the user.

            // See: https://github.com/jquerytools/jquerytools/issues#issue/87

            var hidden_parents = root.parents().add(root).filter(function () {
                if ($(this).css('display') === 'none') {
                    return true;
                }
            });
            if (hidden_parents.length) {
                hidden_parents.show();
                self.seekTo(0, 0, function() {});
                hidden_parents.hide();
            }
            else {
                self.seekTo(0, 0, function() {});
            }

        }

        // next/prev buttons
        var prev = find(root, conf.prev).click(function(e) { e.stopPropagation(); self.prev(); }),
             next = find(root, conf.next).click(function(e) { e.stopPropagation(); self.next(); });

        if (!conf.circular) {
            self.onBeforeSeek(function(e, i) {
                setTimeout(function() {
                    if (!e.isDefaultPrevented()) {
                        prev.toggleClass(conf.disabledClass, i <= 0);
                        next.toggleClass(conf.disabledClass, i >= self.getSize() -1);
                    }
                }, 1);
            });

            if (!conf.initialIndex) {
                prev.addClass(conf.disabledClass);
            }
        }

        if (self.getSize() < 2) {
            prev.add(next).addClass(conf.disabledClass);
        }

        // mousewheel support
        if (conf.mousewheel && $.fn.mousewheel) {
            root.mousewheel(function(e, delta)  {
                if (conf.mousewheel) {
                    self.move(delta < 0 ? 1 : -1, conf.wheelSpeed || 50);
                    return false;
                }
            });
        }

        // touch event
        if (conf.touch) {
            var touch = {};

            itemWrap[0].ontouchstart = function(e) {
                var t = e.touches[0];
                touch.x = t.clientX;
                touch.y = t.clientY;
            };

            itemWrap[0].ontouchmove = function(e) {

                // only deal with one finger
                if (e.touches.length == 1 && !itemWrap.is(":animated")) {
                    var t = e.touches[0],
                         deltaX = touch.x - t.clientX,
                         deltaY = touch.y - t.clientY;

                    self[vertical && deltaY > 0 || !vertical && deltaX > 0 ? 'next' : 'prev']();
                    e.preventDefault();
                }
            };
        }

        if (conf.keyboard)  {

            $(document).on("keydown.scrollable", function(evt) {

                // skip certain conditions
                if (!conf.keyboard || evt.altKey || evt.ctrlKey || evt.metaKey || $(evt.target).is(":input")) {
                    return;
                }

                // does this instance have focus?
                if (conf.keyboard != 'static' && current != self) { return; }

                var key = evt.keyCode;

                if (vertical && (key == 38 || key == 40)) {
                    self.move(key == 38 ? -1 : 1);
                    return evt.preventDefault();
                }

                if (!vertical && (key == 37 || key == 39)) {
                    self.move(key == 37 ? -1 : 1);
                    return evt.preventDefault();
                }

            });
        }

        // initial index
        if (conf.initialIndex) {
            self.seekTo(conf.initialIndex, 0, function() {});
        }
    }


    // jQuery plugin implementation
    $.fn.scrollable = function(conf) {

        // already constructed --> return API
        var el = this.data("scrollable");
        if (el) { return el; }

        conf = $.extend({}, $.tools.scrollable.conf, conf);

        this.each(function() {
            el = new Scrollable($(this), conf);
            $(this).data("scrollable", el);
        });

        return conf.api ? el: this;

    };


})(jQuery);

/**
 * @license
 * jQuery Tools @VERSION / Scrollable Navigator
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/scrollable/navigator.html
 *
 * Since: September 2009
 * Date: @DATE
 */
(function($) {

    var t = $.tools.scrollable;

    t.navigator = {

        conf: {
            navi: '.navi',
            naviItem: null,
            activeClass: 'active',
            indexed: false,
            idPrefix: null,

            // 1.2
            history: false
        }
    };

    function find(root, query) {
        var el = $(query);
        return el.length < 2 ? el : root.parent().find(query);
    }

    // jQuery plugin implementation
    $.fn.navigator = function(conf) {

        // configuration
        if (typeof conf == 'string') { conf = {navi: conf}; }
        conf = $.extend({}, t.navigator.conf, conf);

        var ret;

        this.each(function() {

            var api = $(this).data("scrollable"),
                 navi = conf.navi.jquery ? conf.navi : find(api.getRoot(), conf.navi),
                 buttons = api.getNaviButtons(),
                 cls = conf.activeClass,
                 hashed = conf.history && !!history.pushState,
                 size = api.getConf().size;


            // @deprecated stuff
            if (api) { ret = api; }

            api.getNaviButtons = function() {
                return buttons.add(navi);
            };


            if (hashed) {
                history.pushState({i: 0}, '');

                $(window).on("popstate", function(evt) {
                    var s = evt.originalEvent.state;
                    if (s) { api.seekTo(s.i); }
                });
            }

            function doClick(el, i, e) {
                api.seekTo(i);
                e.preventDefault();
                if (hashed) { history.pushState({i: i}, ''); }
            }

            function els() {
                return navi.find(conf.naviItem || '> *');
            }

            function addItem(i) {

                var item = $("<" + (conf.naviItem || 'a') + "/>").click(function(e)  {
                    doClick($(this), i, e);
                });

                // index number / id attribute
                if (i === 0) {  item.addClass(cls); }
                if (conf.indexed)  { item.text(i + 1); }
                if (conf.idPrefix) { item.attr("id", conf.idPrefix + i); }

                return item.appendTo(navi);
            }


            // generate navigator
            if (els().length) {
                els().each(function(i) {
                    $(this).click(function(e)  {
                        doClick($(this), i, e);
                    });
                });

            } else {
                $.each(api.getItems(), function(i) {
                    if (i % size === 0) addItem(i);
                });
            }

            // activate correct entry
            api.onBeforeSeek(function(e, index) {
                setTimeout(function() {
                    if (!e.isDefaultPrevented()) {
                        var i = index / size,
                             el = els().eq(i);

                        if (el.length) { els().removeClass(cls).eq(i).addClass(cls); }
                    }
                }, 1);
            });

            // new item being added
            api.onAddItem(function(e, item) {
                var i = api.getItems().index(item);
                if (i % size === 0) addItem(i);
            });

        });

        return conf.api ? ret : this;

    };

})(jQuery);

/**
 * @license
 * jQuery Tools @VERSION Tabs- The basics of UI design.
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/tabs/
 *
 * Since: November 2008
 * Date: @DATE
 */
(function($) {

    // static constructs
    $.tools = $.tools || {version: '@VERSION'};

    $.tools.tabs = {

        conf: {
            tabs: 'a',
            current: 'current',
            onBeforeClick: null,
            onClick: null,
            effect: 'default',
            initialEffect: false,   // whether or not to show effect in first init of tabs
            initialIndex: 0,
            event: 'click',
            rotate: false,

      // slide effect
      slideUpSpeed: 400,
      slideDownSpeed: 400,

            // 1.2
            history: false
        },

        addEffect: function(name, fn) {
            effects[name] = fn;
        }

    };

    var effects = {

        // simple "toggle" effect
        'default': function(i, done) {
            this.getPanes().hide().eq(i).show();
            done.call();
        },

        /*
            configuration:
                - fadeOutSpeed (positive value does "crossfading")
                - fadeInSpeed
        */
        fade: function(i, done) {

            var conf = this.getConf(),
                 speed = conf.fadeOutSpeed,
                 panes = this.getPanes();

            if (speed) {
                panes.fadeOut(speed);
            } else {
                panes.hide();
            }

            panes.eq(i).fadeIn(conf.fadeInSpeed, done);
        },

        // for basic accordions
        slide: function(i, done) {
          var conf = this.getConf();

            this.getPanes().slideUp(conf.slideUpSpeed);
            this.getPanes().eq(i).slideDown(conf.slideDownSpeed, done);
        },

        /**
         * AJAX effect
         */
        ajax: function(i, done)  {
            this.getPanes().eq(0).load(this.getTabs().eq(i).attr("href"), done);
        }
    };

    /**
     * Horizontal accordion
     *
     * @deprecated will be replaced with a more robust implementation
    */

    var
      /**
      *   @type {Boolean}
      *
      *   Mutex to control horizontal animation
      *   Disables clicking of tabs while animating
      *   They mess up otherwise as currentPane gets set *after* animation is done
      */
      animating,
      /**
      *   @type {Number}
      *
      *   Initial width of tab panes
      */
      w;

    $.tools.tabs.addEffect("horizontal", function(i, done) {
      if (animating) {
        return;    // don't allow other animations
      }

      var nextPane = this.getPanes().eq(i),
          currentPane = this.getCurrentPane();

        // store original width of a pane into memory
        w || ( w = this.getPanes().eq(0).width() );
        animating = true;

        nextPane.show(); // hidden by default

        // animate current pane's width to zero
    // animate next pane's width at the same time for smooth animation
    currentPane.animate({width: 0}, {
      step: function(now){
        nextPane.css("width", w-now);
      },
      complete: function(){
        $(this).hide();
        done.call();
        animating = false;
     }
    });
    // Dirty hack...  onLoad, currentPant will be empty and nextPane will be the first pane
    // If this is the case, manually run callback since the animation never occured, and reset animating
    if (!currentPane.length){
      done.call();
      animating = false;
    }
    });


    function Tabs(root, paneSelector, conf) {

        var self = this,
        trigger = root.add(this),
        tabs = root.find(conf.tabs),
        panes = paneSelector.jquery ? paneSelector : root.children(paneSelector),
        current;


        // make sure tabs and panes are found
        if (!tabs.length)  { tabs = root.children(); }
        if (!panes.length) { panes = root.parent().find(paneSelector); }
        if (!panes.length) { panes = $(paneSelector); }


        // public methods
        $.extend(this, {
            click: function(i, e) {

                var tab = tabs.eq(i),
                    firstRender = !root.data('tabs');

                if (typeof i == 'string' && i.replace("#", "")) {
                    tab = tabs.filter("[href*=\"" + i.replace("#", "") + "\"]");
                    i = Math.max(tabs.index(tab), 0);
                }

                if (conf.rotate) {
                    var last = tabs.length -1;
                    if (i < 0) { return self.click(last, e); }
                    if (i > last) { return self.click(0, e); }
                }

                if (!tab.length) {
                    if (current >= 0) { return self; }
                    i = conf.initialIndex;
                    tab = tabs.eq(i);
                }

                // current tab is being clicked
                if (i === current) { return self; }

                // possibility to cancel click action
                e = e || $.Event();
                e.type = "onBeforeClick";
                trigger.trigger(e, [i]);
                if (e.isDefaultPrevented()) { return; }

        // if firstRender, only run effect if initialEffect is set, otherwise default
                var effect = firstRender ? conf.initialEffect && conf.effect || 'default' : conf.effect;

                // call the effect
                effects[effect].call(self, i, function() {
                    current = i;
                    // onClick callback
                    e.type = "onClick";
                    trigger.trigger(e, [i]);
                });

                // default behaviour
                tabs.removeClass(conf.current);
                tab.addClass(conf.current);

                return self;
            },

            getConf: function() {
                return conf;
            },

            getTabs: function() {
                return tabs;
            },

            getPanes: function() {
                return panes;
            },

            getCurrentPane: function() {
                return panes.eq(current);
            },

            getCurrentTab: function() {
                return tabs.eq(current);
            },

            getIndex: function() {
                return current;
            },

            next: function() {
                return self.click(current + 1);
            },

            prev: function() {
                return self.click(current - 1);
            },

            destroy: function() {
                tabs.off(conf.event).removeClass(conf.current);
                panes.find("a[href^=\"#\"]").off("click.T");
                return self;
            }

        });

        // callbacks
        $.each("onBeforeClick,onClick".split(","), function(i, name) {

            // configuration
            if ($.isFunction(conf[name])) {
                $(self).on(name, conf[name]);
            }

            // API
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });


        if (conf.history && $.fn.history) {
            $.tools.history.init(tabs);
            conf.event = 'history';
        }

        // setup click actions for each tab
        tabs.each(function(i) {
            $(this).on(conf.event, function(e) {
                self.click(i, e);
                return e.preventDefault();
            });
        });

        // cross tab anchor link
        panes.find("a[href^=\"#\"]").on("click.T", function(e) {
            self.click($(this).attr("href"), e);
        });

        // open initial tab
        if (location.hash && conf.tabs == "a" && root.find("[href=\"" +location.hash+ "\"]").length) {
            self.click(location.hash);

        } else {
            if (conf.initialIndex === 0 || conf.initialIndex > 0) {
                self.click(conf.initialIndex);
            }
        }

    }


    // jQuery plugin implementation
    $.fn.tabs = function(paneSelector, conf) {

        // return existing instance
        var el = this.data("tabs");
        if (el) {
            el.destroy();
            this.removeData("tabs");
        }

        if ($.isFunction(conf)) {
            conf = {onBeforeClick: conf};
        }

        // setup conf
        conf = $.extend({}, $.tools.tabs.conf, conf);


        this.each(function() {
            el = new Tabs($(this), paneSelector, conf);
            $(this).data("tabs", el);
        });

        return conf.api ? el: this;
    };

}) (jQuery);



/**
 * @license
 * jQuery Tools @VERSION Slideshow - Extend it.
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/tabs/slideshow.html
 *
 * Since: September 2009
 * Date: @DATE
 */
(function($) {

    var tool;

    tool = $.tools.tabs.slideshow = {

        conf: {
            next: '.forward',
            prev: '.backward',
            disabledClass: 'disabled',
            autoplay: false,
            autopause: true,
            interval: 3000,
            clickable: true,
            api: false
        }
    };

    function Slideshow(root, conf) {

        var self = this,
             fire = root.add(this),
             tabs = root.data("tabs"),
             timer,
             stopped = true;

        // next / prev buttons
        function find(query) {
            var el = $(query);
            return el.length < 2 ? el : root.parent().find(query);
        }

        var nextButton = find(conf.next).click(function() {
            tabs.next();
        });

        var prevButton = find(conf.prev).click(function() {
            tabs.prev();
        });

    /**
    *
    *   Similar fix for autoscroll animation queue problem
    */
    function next(){
      // Fixes https://github.com/jquerytools/jquerytools/issues/885
      if (timer) {
        clearTimeout(timer); // reset timeout, especially for angry clicks
      }
      timer = setTimeout(function(){
        tabs.next();
      }, conf.interval);
    }

        // extend the Tabs API with slideshow methods
        $.extend(self, {

            // return tabs API
            getTabs: function() {
                return tabs;
            },

            getConf: function() {
                return conf;
            },

            play: function() {

                // do not start additional timer if already exists
                if (timer) { return self; }

                // onBeforePlay
                var e = $.Event("onBeforePlay");
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return self; }

                stopped = false;

                // onPlay
                fire.trigger("onPlay");

                fire.on('onClick', next);
                next();

                return self;
            },

            pause: function() {

                if (!timer) { return self; }

                // onBeforePause
                var e = $.Event("onBeforePause");
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return self; }

                timer = clearTimeout(timer);

                // onPause
                fire.trigger("onPause");

                fire.off('onClick', next);

                return self;
            },

            // resume playing if not stopped
            resume: function() {
                stopped || self.play();
            },

            // when stopped - mouseover won't restart
            stop: function() {
                self.pause();
                stopped = true;
            }

        });

        // callbacks
        $.each("onBeforePlay,onPlay,onBeforePause,onPause".split(","), function(i, name) {

            // configuration
            if ($.isFunction(conf[name]))  {
                $(self).on(name, conf[name]);
            }

            // API methods
            self[name] = function(fn) {
                return $(self).on(name, fn);
            };
        });


        /* when mouse enters, slideshow stops */
        if (conf.autopause) {
            tabs.getTabs().add(nextButton).add(prevButton).add(tabs.getPanes()).hover(self.pause, self.resume);
        }

        if (conf.autoplay) {
            self.play();
        }

        if (conf.clickable) {
            tabs.getPanes().click(function()  {
                tabs.next();
            });
        }

        // manage disabling of next/prev buttons
        if (!tabs.getConf().rotate) {

            var disabled = conf.disabledClass;

            if (!tabs.getIndex()) {
                prevButton.addClass(disabled);
            }

            tabs.onBeforeClick(function(e, i)  {
                prevButton.toggleClass(disabled, !i);
                nextButton.toggleClass(disabled, i == tabs.getTabs().length -1);
            });
        }
    }

    // jQuery plugin implementation
    $.fn.slideshow = function(conf) {

        // return existing instance
        var el = this.data("slideshow");
        if (el) { return el; }

        conf = $.extend({}, tool.conf, conf);

        this.each(function() {
            el = new Slideshow($(this), conf);
            $(this).data("slideshow", el);
        });

        return conf.api ? el : this;
    };

})(jQuery);


/**
 * @license
 * jQuery Tools @VERSION / Expose - Dim the lights
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/toolbox/expose.html
 *
 * Since: Mar 2010
 * Date: @DATE
 */
(function($) {

    // static constructs
    $.tools = $.tools || {version: '@VERSION'};

    var tool;

    tool = $.tools.expose = {

        conf: {
            maskId: 'exposeMask',
            loadSpeed: 'slow',
            closeSpeed: 'fast',
            closeOnClick: true,
            closeOnEsc: true,

            // css settings
            zIndex: 9998,
            opacity: 0.8,
            startOpacity: 0,
            color: '#fff',

            // callbacks
            onLoad: null,
            onClose: null
        }
    };

    /* one of the greatest headaches in the tool. finally made it */
    function viewport() {

        // the horror case
        if (/msie/.test(navigator.userAgent.toLowerCase())) {

            // if there are no scrollbars then use window.height
            var d = $(document).height(), w = $(window).height();

            return [
                window.innerWidth ||                             // ie7+
                document.documentElement.clientWidth ||     // ie6
                document.body.clientWidth,                     // ie6 quirks mode
                d - w < 20 ? w : d
            ];
        }

        // other well behaving browsers
        return [$(document).width(), $(document).height()];
    }

    function call(fn) {
        if (fn) { return fn.call($.mask); }
    }

    var mask, exposed, loaded, config, overlayIndex;


    $.mask = {

        load: function(conf, els) {

            // already loaded ?
            if (loaded) { return this; }

            // configuration
            if (typeof conf == 'string') {
                conf = {color: conf};
            }

            // use latest config
            conf = conf || config;

            config = conf = $.extend($.extend({}, tool.conf), conf);

            // get the mask
            mask = $("#" + conf.maskId);

            // or create it
            if (!mask.length) {
                mask = $('<div/>').attr("id", conf.maskId);
                $("body").append(mask);
            }

            // set position and dimensions
            var size = viewport();

            mask.css({
                position:'absolute',
                top: 0,
                left: 0,
                width: size[0],
                height: size[1],
                display: 'none',
                opacity: conf.startOpacity,
                zIndex: conf.zIndex
            });

            if (conf.color) {
                mask.css("backgroundColor", conf.color);
            }

            // onBeforeLoad
            if (call(conf.onBeforeLoad) === false) {
                return this;
            }

            // esc button
            if (conf.closeOnEsc) {
                $(document).on("keydown.mask", function(e) {
                    if (e.keyCode == 27) {
                        $.mask.close(e);
                    }
                });
            }

            // mask click closes
            if (conf.closeOnClick) {
                mask.on("click.mask", function(e)  {
                    $.mask.close(e);
                });
            }

            // resize mask when window is resized
            $(window).on("resize.mask", function() {
                $.mask.fit();
            });

            // exposed elements
            if (els && els.length) {

                overlayIndex = els.eq(0).css("zIndex");

                // make sure element is positioned absolutely or relatively
                $.each(els, function() {
                    var el = $(this);
                    if (!/relative|absolute|fixed/i.test(el.css("position"))) {
                        el.css("position", "relative");
                    }
                });

                // make elements sit on top of the mask
                exposed = els.css({ zIndex: Math.max(conf.zIndex + 1, overlayIndex == 'auto' ? 0 : overlayIndex)});
            }

            // reveal mask
            mask.css({display: 'block'}).fadeTo(conf.loadSpeed, conf.opacity, function() {
                $.mask.fit();
                call(conf.onLoad);
                loaded = "full";
            });

            loaded = true;
            return this;
        },

        close: function() {
            if (loaded) {

                // onBeforeClose
                if (call(config.onBeforeClose) === false) { return this; }

                mask.fadeOut(config.closeSpeed, function()  {
                    if (exposed) {
                        exposed.css({zIndex: overlayIndex});
                    }
                    loaded = false;
                    call(config.onClose);
                });

                // unbind various event listeners
                $(document).off("keydown.mask");
                mask.off("click.mask");
                $(window).off("resize.mask");
            }

            return this;
        },

        fit: function() {
            if (loaded) {
                var size = viewport();
                mask.css({width: size[0], height: size[1]});
            }
        },

        getMask: function() {
            return mask;
        },

        isLoaded: function(fully) {
            return fully ? loaded == 'full' : loaded;
        },

        getConf: function() {
            return config;
        },

        getExposed: function() {
            return exposed;
        }
    };

    $.fn.mask = function(conf) {
        $.mask.load(conf);
        return this;
    };

    $.fn.expose = function(conf) {
        $.mask.load(conf, this);
        return this;
    };


})(jQuery);

/**
 * @license
 * jQuery Tools @VERSION / Flashembed - New wave Flash embedding
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/toolbox/flashembed.html
 *
 * Since : March 2008
 * Date  : @DATE
 */
(function() {

    var IE = document.all,
         URL = 'http://www.adobe.com/go/getflashplayer',
         JQUERY = typeof jQuery == 'function',
         RE = /(\d+)[^\d]+(\d+)[^\d]*(\d*)/,
         GLOBAL_OPTS = {
            // very common opts
            width: '100%',
            height: '100%',
            id: "_" + ("" + Math.random()).slice(9),

            // flashembed defaults
            allowfullscreen: true,
            allowscriptaccess: 'always',
            quality: 'high',

            // flashembed specific options
            version: [3, 0],
            onFail: null,
            expressInstall: null,
            w3c: false,
            cachebusting: false
    };

    // version 9 bugfix: (http://blog.deconcept.com/2006/07/28/swfobject-143-released/)
    if (window.attachEvent) {
        window.attachEvent("onbeforeunload", function() {
            __flash_unloadHandler = function() {};
            __flash_savedUnloadHandler = function() {};
        });
    }

    // simple extend
    function extend(to, from) {
        if (from) {
            for (var key in from) {
                if (from.hasOwnProperty(key)) {
                    to[key] = from[key];
                }
            }
        }
        return to;
    }

    // used by asString method
    function map(arr, func) {
        var newArr = [];
        for (var i in arr) {
            if (arr.hasOwnProperty(i)) {
                newArr[i] = func(arr[i]);
            }
        }
        return newArr;
    }

    window.flashembed = function(root, opts, conf) {

        // root must be found / loaded
        if (typeof root == 'string') {
            root = document.getElementById(root.replace("#", ""));
        }

        // not found
        if (!root) { return; }

        if (typeof opts == 'string') {
            opts = {src: opts};
        }

        return new Flash(root, extend(extend({}, GLOBAL_OPTS), opts), conf);
    };

    // flashembed "static" API
    var f = extend(window.flashembed, {

        conf: GLOBAL_OPTS,

        getVersion: function()  {
            var fo, ver;

            try {
                ver = navigator.plugins["Shockwave Flash"].description.slice(16);
            } catch(e) {

                try  {
                    fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
                    ver = fo && fo.GetVariable("$version");

                } catch(err) {
                try  {
                    fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                    ver = fo && fo.GetVariable("$version");
                } catch(err2) { }
                }
            }

            ver = RE.exec(ver);
            return ver ? [ver[1], ver[3]] : [0, 0];
        },

        asString: function(obj) {

            if (obj === null || obj === undefined) { return null; }
            var type = typeof obj;
            if (type == 'object' && obj.push) { type = 'array'; }

            switch (type){

                case 'string':
                    obj = obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1');

                    // flash does not handle %- characters well. transforms "50%" to "50pct" (a dirty hack, I admit)
                    obj = obj.replace(/^\s?(\d+\.?\d*)%/, "$1pct");
                    return '"' +obj+ '"';

                case 'array':
                    return '['+ map(obj, function(el) {
                        return f.asString(el);
                    }).join(',') +']';

                case 'function':
                    return '"function()"';

                case 'object':
                    var str = [];
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            str.push('"'+prop+'":'+ f.asString(obj[prop]));
                        }
                    }
                    return '{'+str.join(',')+'}';
            }

            // replace ' --> "  and remove spaces
            return String(obj).replace(/\s/g, " ").replace(/\'/g, "\"");
        },

        getHTML: function(opts, conf) {

            opts = extend({}, opts);

            /******* OBJECT tag and it's attributes *******/
            var html = '<object width="' + opts.width +
                '" height="' + opts.height +
                '" id="' + opts.id +
                '" name="' + opts.id + '"';

            if (opts.cachebusting) {
                opts.src += ((opts.src.indexOf("?") != -1 ? "&" : "?") + Math.random());
            }

            if (opts.w3c || !IE) {
                html += ' data="' +opts.src+ '" type="application/x-shockwave-flash"';
            } else {
                html += ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"';
            }

            html += '>';

            /******* nested PARAM tags *******/
            if (opts.w3c || IE) {
                html += '<param name="movie" value="' +opts.src+ '" />';
            }

            // not allowed params
            opts.width = opts.height = opts.id = opts.w3c = opts.src = null;
            opts.onFail = opts.version = opts.expressInstall = null;

            for (var key in opts) {
                if (opts[key]) {
                    html += '<param name="'+ key +'" value="'+ opts[key] +'" />';
                }
            }

            /******* FLASHVARS *******/
            var vars = "";

            if (conf) {
                for (var k in conf) {
                    if (conf[k]) {
                        var val = conf[k];
                        vars += k +'='+ encodeURIComponent(/function|object/.test(typeof val) ? f.asString(val) : val) + '&';
                    }
                }
                vars = vars.slice(0, -1);
                html += '<param name="flashvars" value=\'' + vars + '\' />';
            }

            html += "</object>";

            return html;
        },

        isSupported: function(ver) {
            return VERSION[0] > ver[0] || VERSION[0] == ver[0] && VERSION[1] >= ver[1];
        }

    });

    var VERSION = f.getVersion();

    function Flash(root, opts, conf) {

        // version is ok
        if (f.isSupported(opts.version)) {
            root.innerHTML = f.getHTML(opts, conf);

        // express install
        } else if (opts.expressInstall && f.isSupported([6, 65])) {
            root.innerHTML = f.getHTML(extend(opts, {src: opts.expressInstall}), {
                MMredirectURL: location.href,
                MMplayerType: 'PlugIn',
                MMdoctitle: document.title
            });

        } else {

            // fail #2.1 custom content inside container
            if (!root.innerHTML.replace(/\s/g, '')) {
                root.innerHTML =
                    "<h2>Flash version " + opts.version + " or greater is required</h2>" +
                    "<h3>" +
                        (VERSION[0] > 0 ? "Your version is " + VERSION : "You have no flash plugin installed") +
                    "</h3>" +

                    (root.tagName == 'A' ? "<p>Click here to download latest version</p>" :
                        "<p>Download latest version from <a href='" + URL + "'>here</a></p>");

                if (root.tagName == 'A') {
                    root.onclick = function() {
                        location.href = URL;
                    };
                }
            }

            // onFail
            if (opts.onFail) {
                var ret = opts.onFail.call(this);
                if (typeof ret == 'string') { root.innerHTML = ret; }
            }
        }

        // http://flowplayer.org/forum/8/18186#post-18593
        if (IE) {
            window[opts.id] = document.getElementById(opts.id);
        }

        // API methods for callback
        extend(this, {

            getRoot: function() {
                return root;
            },

            getOptions: function() {
                return opts;
            },


            getConf: function() {
                return conf;
            },

            getApi: function() {
                return root.firstChild;
            }

        });
    }

    // setup jquery support
    if (JQUERY) {

        // tools version number
        jQuery.tools = jQuery.tools || {version: '@VERSION'};

        jQuery.tools.flashembed = {
            conf: GLOBAL_OPTS
        };

        jQuery.fn.flashembed = function(opts, conf) {
            return this.each(function() {
                jQuery(this).data("flashembed", flashembed(this, opts, conf));
            });
        };
    }

})();


/**
 * @license
 * jQuery Tools @VERSION History "Back button for AJAX apps"
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/toolbox/history.html
 *
 * Since: Mar 2010
 * Date: @DATE
 */
(function($) {

    var hash, iframe, links, inited;

    $.tools = $.tools || {version: '@VERSION'};

    $.tools.history = {

        init: function(els) {

            if (inited) { return; }

            // IE
            if ($.browser.msie && $.browser.version < '8') {

                // create iframe that is constantly checked for hash changes
                if (!iframe) {
                    iframe = $("<iframe/>").attr("src", "javascript:false;").hide().get(0);
                    $("body").append(iframe);

                    setInterval(function() {
                        var idoc = iframe.contentWindow.document,
                             h = idoc.location.hash;

                        if (hash !== h) {
                            $(window).trigger("hash", h);
                        }
                    }, 100);

                    setIframeLocation(location.hash || '#');
                }


            // other browsers scans for location.hash changes directly without iframe hack
            } else {
                setInterval(function() {
                    var h = location.hash;
                    if (h !== hash) {
                        $(window).trigger("hash", h);
                    }
                }, 100);
            }

            links = !links ? els : links.add(els);

            els.click(function(e) {
                var href = $(this).attr("href");
                if (iframe) { setIframeLocation(href); }

                // handle non-anchor links
                if (href.slice(0, 1) != "#") {
                    location.href = "#" + href;
                    return e.preventDefault();
                }

            });

            inited = true;
        }
    };


    function setIframeLocation(h) {
        if (h) {
            var doc = iframe.contentWindow.document;
            doc.open().close();
            doc.location.hash = h;
        }
    }

    // global histroy change listener
    $(window).on("hash", function(e, h)  {
        if (h) {
            links.filter(function() {
              var href = $(this).attr("href");
              return href == h || href == h.replace("#", "");
            }).trigger("history", [h]);
        } else {
            links.eq(0).trigger("history", [h]);
        }

        hash = h;

    });


    // jQuery plugin implementation
    $.fn.history = function(fn) {

        $.tools.history.init(this);

        // return jQuery
        return this.on("history", fn);
    };

})(jQuery);


/**
 * @license
 * jQuery Tools @VERSION Mousewheel
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/toolbox/mousewheel.html
 *
 * based on jquery.event.wheel.js ~ rev 1 ~
 * Copyright (c) 2008, Three Dub Media
 * http://threedubmedia.com
 *
 * Since: Mar 2010
 * Date: @DATE
 */
(function($) {

    $.fn.mousewheel = function( fn ){
        return this[ fn ? "on" : "trigger" ]( "wheel", fn );
    };

    // special event config
    $.event.special.wheel = {
        setup: function() {
            $.event.add( this, wheelEvents, wheelHandler, {} );
        },
        teardown: function(){
            $.event.remove( this, wheelEvents, wheelHandler );
        }
    };

    // events to bind ( browser sniffed... )
    var wheelEvents = !$.browser.mozilla ? "mousewheel" : // IE, opera, safari
        "DOMMouseScroll"+( $.browser.version<"1.9" ? " mousemove" : "" ); // firefox

    // shared event handler
    function wheelHandler( event ) {

        switch ( event.type ) {

            // FF2 has incorrect event positions
            case "mousemove":
                return $.extend( event.data, { // store the correct properties
                    clientX: event.clientX, clientY: event.clientY,
                    pageX: event.pageX, pageY: event.pageY
                });

            // firefox
            case "DOMMouseScroll":
                $.extend( event, event.data ); // fix event properties in FF2
                event.delta = -event.detail / 3; // normalize delta
                break;

            // IE, opera, safari
            case "mousewheel":
                event.delta = event.wheelDelta / 120;
                break;
        }

        event.type = "wheel"; // hijack the event
        return $.event.handle.call( this, event, event.delta );
    }

})(jQuery);


/**
 * @license
 * jQuery Tools @VERSION / Tooltip Dynamic Positioning
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/tooltip/dynamic.html
 *
 * Since: July 2009
 * Date: @DATE
 */
(function($) {

    // version number
    var t = $.tools.tooltip;

    t.dynamic = {
        conf: {
            classNames: "top right bottom left"
        }
    };

    /*
     * See if element is on the viewport. Returns an boolean array specifying which
     * edges are hidden. Edges are in following order:
     *
     * [top, right, bottom, left]
     *
     * For example following return value means that top and right edges are hidden
     *
     * [true, true, false, false]
     *
     */
    function getCropping(el) {

        var w = $(window);
        var right = w.width() + w.scrollLeft();
        var bottom = w.height() + w.scrollTop();

        return [
            el.offset().top <= w.scrollTop(),                         // top
            right <= el.offset().left + el.width(),                // right
            bottom <= el.offset().top + el.height(),            // bottom
            w.scrollLeft() >= el.offset().left                     // left
        ];
    }

    /*
        Returns true if all edges of an element are on viewport. false if not

        @param crop the cropping array returned by getCropping function
     */
    function isVisible(crop) {
        var i = crop.length;
        while (i--) {
            if (crop[i]) { return false; }
        }
        return true;
    }

    // dynamic plugin
    $.fn.dynamic = function(conf) {

        if (typeof conf == 'number') { conf = {speed: conf}; }

        conf = $.extend({}, t.dynamic.conf, conf);

        var confOrigin = $.extend(true,{},conf),
            cls = conf.classNames.split(/\s/),
            orig, ret;

        this.each(function() {

            var api = $(this).tooltip().onBeforeShow(function(e, pos) {

                // get nessessary variables
                var tip = this.getTip(), tipConf = this.getConf();

                /*
                    We store the original configuration and use it to restore back to the original state.
                */
                if (!orig) {
                    orig = [
                        tipConf.position[0],
                        tipConf.position[1],
                        tipConf.offset[0],
                        tipConf.offset[1],
                        $.extend({}, tipConf)
                    ];
                }

                /*
                    display tip in it's default position and by setting visibility to hidden.
                    this way we can check whether it will be on the viewport
                */
                $.extend(tipConf, orig[4]);
                tipConf.position = [orig[0], orig[1]];
                tipConf.offset = [orig[2], orig[3]];

                tip.css({
                    visibility: 'hidden',
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left
                }).show();

                var conf = $.extend(true,{},confOrigin),

                    // now let's see for hidden edges
                    crop = getCropping(tip);

                // possibly alter the configuration
                if (!isVisible(crop)) {

                    // change the position and add class
                    if (crop[2]) { $.extend(tipConf, conf.top);        tipConf.position[0] = 'top';         tip.addClass(cls[0]); }
                    if (crop[3]) { $.extend(tipConf, conf.right);    tipConf.position[1] = 'right';     tip.addClass(cls[1]); }
                    if (crop[0]) { $.extend(tipConf, conf.bottom);     tipConf.position[0] = 'bottom';    tip.addClass(cls[2]); }
                    if (crop[1]) { $.extend(tipConf, conf.left);        tipConf.position[1] = 'left';     tip.addClass(cls[3]); }

                    // vertical offset
                    if (crop[0] || crop[2]) { tipConf.offset[0] *= -1; }

                    // horizontal offset
                    if (crop[1] || crop[3]) { tipConf.offset[1] *= -1; }
                }

                tip.css({visibility: 'visible'}).hide();

            });

            // restore positioning as soon as possible
            api.onBeforeShow(function() {
                var c = this.getConf(), tip = this.getTip();
                setTimeout(function() {
                    c.position = [orig[0], orig[1]];
                    c.offset = [orig[2], orig[3]];
                }, 0);
            });

            // remove custom class names and restore original effect
            api.onHide(function() {
                var tip = this.getTip();
                tip.removeClass(conf.classNames);
            });

            ret = api;

        });

        return conf.api ? ret : this;
    };

}) (jQuery);

/**
 * @license
 * jQuery Tools @VERSION Tooltip - UI essentials
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/tooltip/
 *
 * Since: November 2008
 * Date: @DATE
 */
(function($) {
    // static constructs
    $.tools = $.tools || {version: '@VERSION'};

    $.tools.tooltip = {

        conf: {

            // default effect variables
            effect: 'toggle',
            fadeOutSpeed: "fast",
            predelay: 0,
            delay: 30,
            opacity: 1,
            tip: 0,
            fadeIE: false, // enables fade effect in IE

            // 'top', 'bottom', 'right', 'left', 'center'
            position: ['top', 'center'],
            offset: [0, 0],
            relative: false,
            cancelDefault: true,

            // type to event mapping
            events: {
                def:             "mouseenter,mouseleave",
                input:         "focus,blur",
                widget:        "focus mouseenter,blur mouseleave",
                tooltip:        "mouseenter,mouseleave"
            },

            // 1.2
            layout: '<div/>',
            tipClass: 'tooltip'
        },

        addEffect: function(name, loadFn, hideFn) {
            effects[name] = [loadFn, hideFn];
        }
    };


    var effects = {
        toggle: [
            function(done) {
                var conf = this.getConf(), tip = this.getTip(), o = conf.opacity;
                if (o < 1) { tip.css({opacity: o}); }
                tip.show();
                done.call();
            },

            function(done) {
                this.getTip().hide();
                done.call();
            }
        ],

        fade: [
            function(done) {
                var conf = this.getConf();
                if (!/msie/.test(navigator.userAgent.toLowerCase()) || conf.fadeIE) {
                    this.getTip().fadeTo(conf.fadeInSpeed, conf.opacity, done);
                }
                else {
                    this.getTip().show();
                    done();
                }
            },
            function(done) {
                var conf = this.getConf();
                if (!/msie/.test(navigator.userAgent.toLowerCase()) || conf.fadeIE) {
                    this.getTip().fadeOut(conf.fadeOutSpeed, done);
                }
                else {
                    this.getTip().hide();
                    done();
                }
            }
        ]
    };


    /* calculate tip position relative to the trigger */
    function getPosition(trigger, tip, conf) {


        // get origin top/left position
        var top = conf.relative ? trigger.position().top : trigger.offset().top,
             left = conf.relative ? trigger.position().left : trigger.offset().left,
             pos = conf.position[0];

        top  -= tip.outerHeight() - conf.offset[0];
        left += trigger.outerWidth() + conf.offset[1];

        // iPad position fix
        if (/iPad/i.test(navigator.userAgent)) {
            top -= $(window).scrollTop();
        }

        // adjust Y
        var height = tip.outerHeight() + trigger.outerHeight();
        if (pos == 'center')     { top += height / 2; }
        if (pos == 'bottom')     { top += height; }


        // adjust X
        pos = conf.position[1];
        var width = tip.outerWidth() + trigger.outerWidth();
        if (pos == 'center')     { left -= width / 2; }
        if (pos == 'left')       { left -= width; }

        return {top: top, left: left};
    }



    function Tooltip(trigger, conf) {

        var self = this,
             fire = trigger.add(self),
             tip,
             timer = 0,
             pretimer = 0,
             title = trigger.attr("title"),
             tipAttr = trigger.attr("data-tooltip"),
             effect = effects[conf.effect],
             shown,

             // get show/hide configuration
             isInput = trigger.is(":input"),
             isWidget = isInput && trigger.is(":checkbox, :radio, select, :button, :submit"),
             type = trigger.attr("type"),
             evt = conf.events[type] || conf.events[isInput ? (isWidget ? 'widget' : 'input') : 'def'];


        // check that configuration is sane
        if (!effect) { throw "Nonexistent effect \"" + conf.effect + "\""; }

        evt = evt.split(/,\s*/);
        if (evt.length != 2) { throw "Tooltip: bad events configuration for " + type; }


        // trigger --> show
        trigger.on(evt[0], function(e) {

            clearTimeout(timer);
            if (conf.predelay) {
                pretimer = setTimeout(function() { self.show(e); }, conf.predelay);

            } else {
                self.show(e);
            }

        // trigger --> hide
        }).on(evt[1], function(e)  {
            clearTimeout(pretimer);
            if (conf.delay)  {
                timer = setTimeout(function() { self.hide(e); }, conf.delay);

            } else {
                self.hide(e);
            }

        });


        // remove default title
        if (title && conf.cancelDefault) {
            trigger.removeAttr("title");
            trigger.data("title", title);
        }

        $.extend(self, {

            show: function(e) {

                // tip not initialized yet
                if (!tip) {

                    // data-tooltip
                    if (tipAttr) {
                        tip = $(tipAttr);

                    // single tip element for all
                    } else if (conf.tip) {
                        tip = $(conf.tip).eq(0);

                    // autogenerated tooltip
                    } else if (title) {
                        tip = $(conf.layout).addClass(conf.tipClass).appendTo(document.body)
                            .hide().append(title);

                    // manual tooltip
                    } else {
                        tip = trigger.find('.' + conf.tipClass);
                        if (!tip.length) { tip = trigger.next(); }
                        if (!tip.length) { tip = trigger.parent().next(); }
                    }

                    if (!tip.length) { throw "Cannot find tooltip for " + trigger;    }
                }

                 if (self.isShown()) { return self; }

                 // stop previous animation
                 tip.stop(true, true);

                // get position
                var pos = getPosition(trigger, tip, conf);

                // restore title for single tooltip element
                if (conf.tip) {
                    tip.html(trigger.data("title"));
                }

                // onBeforeShow
                e = $.Event();
                e.type = "onBeforeShow";
                fire.trigger(e, [pos]);
                if (e.isDefaultPrevented()) { return self; }


                // onBeforeShow may have altered the configuration
                pos = getPosition(trigger, tip, conf);

                // set position
                tip.css({position:'absolute', top: pos.top, left: pos.left});

                shown = true;

                // invoke effect
                effect[0].call(self, function() {
                    e.type = "onShow";
                    shown = 'full';
                    fire.trigger(e);
                });


                // tooltip events
                var event = conf.events.tooltip.split(/,\s*/);

                if (!tip.data("__set")) {

                    tip.off(event[0]).on(event[0], function() {
                        clearTimeout(timer);
                        clearTimeout(pretimer);
                    });

                    if (event[1] && !trigger.is("input:not(:checkbox, :radio), textarea")) {
                        tip.off(event[1]).on(event[1], function(e) {

                            // being moved to the trigger element
                            if (e.relatedTarget != trigger[0]) {
                                trigger.trigger(evt[1].split(" ")[0]);
                            }
                        });
                    }

                    // bind agein for if same tip element
                    if (!conf.tip) {
                        tip.data("__set", true);
                    }
                }

                return self;
            },

            hide: function(e) {

                if (!tip || !self.isShown()) { return self; }

                // onBeforeHide
                e = $.Event();
                e.type = "onBeforeHide";
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return; }

                shown = false;

                effects[conf.effect][1].call(self, function() {
                    e.type = "onHide";
                    fire.trigger(e);
                });

                return self;
            },

            isShown: function(fully) {
                return fully ? shown == 'full' : shown;
            },

            getConf: function() {
                return conf;
            },

            getTip: function() {
                return tip;
            },

            getTrigger: function() {
                return trigger;
            }

        });

        // callbacks
        $.each("onHide,onBeforeShow,onShow,onBeforeHide".split(","), function(i, name) {

            // configuration
            if ($.isFunction(conf[name])) {
                $(self).on(name, conf[name]);
            }

            // API
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });

    }


    // jQuery plugin implementation
    $.fn.tooltip = function(conf) {
        var api;
        conf = $.extend(true, {}, $.tools.tooltip.conf, conf);

        // position can also be given as string
        if (typeof conf.position == 'string') {
            conf.position = conf.position.split(/,?\s/);
        }

        // install tooltip for each entry in jQuery object
        // that is not an existing instance
        this.each(function() {
            if ( $(this).data("tooltip")===null){
                api = new Tooltip($(this), conf);
                $(this).data("tooltip", api);
            }
        });

        return conf.api ? api: this;
    };

}) (jQuery);




/**
 * @license
 * jQuery Tools @VERSION / Tooltip Slide Effect
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/tooltip/slide.html
 *
 * Since: September 2009
 * Date: @DATE
 */
(function($) {

    // version number
    var t = $.tools.tooltip;

    // extend global configuragion with effect specific defaults
    $.extend(t.conf, {
        direction: 'up', // down, left, right
        bounce: false,
        slideOffset: 10,
        slideInSpeed: 200,
        slideOutSpeed: 200,
        slideFade: !/msie/.test(navigator.userAgent.toLowerCase())
    });

    // directions for slide effect
    var dirs = {
        up: ['-', 'top'],
        down: ['+', 'top'],
        left: ['-', 'left'],
        right: ['+', 'left']
    };

    /* default effect: "slide"  */
    t.addEffect("slide",

        // show effect
        function(done) {

            // variables
            var conf = this.getConf(),
                 tip = this.getTip(),
                 params = conf.slideFade ? {opacity: conf.opacity} : {},
                 dir = dirs[conf.direction] || dirs.up;

            // direction
            params[dir[1]] = dir[0] +'='+ conf.slideOffset;

            // perform animation
            if (conf.slideFade) { tip.css({opacity:0}); }
            tip.show().animate(params, conf.slideInSpeed, done);
        },

        // hide effect
        function(done) {

            // variables
            var conf = this.getConf(),
                 offset = conf.slideOffset,
                 params = conf.slideFade ? {opacity: 0} : {},
                 dir = dirs[conf.direction] || dirs.up;

            // direction
            var sign = "" + dir[0];
            if (conf.bounce) { sign = sign == '+' ? '-' : '+'; }
            params[dir[1]] = sign +'='+ offset;

            // perform animation
            this.getTip().animate(params, conf.slideOutSpeed, function()  {
                $(this).hide();
                done.call();
            });
        }
    );

})(jQuery);


/**
 * @license
 * jQuery Tools Validator @VERSION - HTML5 is here. Now use it.
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/form/validator/
 *
 * Since: Mar 2010
 * Date: @DATE
 */
/*jslint evil: true */
(function($) {

    $.tools = $.tools || {version: '@VERSION'};

    // globals
    var typeRe = /\[type=([a-z]+)\]/,
        numRe = /^-?[0-9]*(\.[0-9]+)?$/,
        dateInput = $.tools.dateinput,

        // http://net.tutsplus.com/tutorials/other/8-regular-expressions-you-should-know/
        emailRe = /^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i,
        urlRe = /^(https?:\/\/)?[\da-z\.\-]+\.[a-z\.]{2,6}[#&+_\?\/\w \.\-=]*$/i,
        v;

    v = $.tools.validator = {

        conf: {
            grouped: false,                 // show all error messages at once inside the container
            effect: 'default',            // show/hide effect for error message. only 'default' is built-in
            errorClass: 'invalid',        // input field class name in case of validation error

            // when to check for validity?
            inputEvent: null,                // change, blur, keyup, null
            errorInputEvent: 'keyup',  // change, blur, keyup, null
            formEvent: 'submit',       // submit, null

            lang: 'en',                        // default language for error messages
            message: '<div/>',
            messageAttr: 'data-message', // name of the attribute for overridden error message
            messageClass: 'error',        // error message element's class name
            offset: [0, 0],
            position: 'center right',
            singleError: false,             // validate all inputs at once
            speed: 'normal'                // message's fade-in speed
        },


        /* The Error Messages */
        messages: {
            "*": { en: "Please correct this value" }
        },

        localize: function(lang, messages) {
            $.each(messages, function(key, msg)  {
                v.messages[key] = v.messages[key] || {};
                v.messages[key][lang] = msg;
            });
        },

        localizeFn: function(key, messages) {
            v.messages[key] = v.messages[key] || {};
            $.extend(v.messages[key], messages);
        },

        /**
         * Adds a new validator
         */
        fn: function(matcher, msg, fn) {

            // no message supplied
            if ($.isFunction(msg)) {
                fn = msg;

            // message(s) on second argument
            } else {
                if (typeof msg == 'string') { msg = {en: msg}; }
                this.messages[matcher.key || matcher] = msg;
            }

            // check for "[type=xxx]" (not supported by jQuery)
            var test = typeRe.exec(matcher);
            if (test) { matcher = isType(test[1]); }

            // add validator to the arsenal
            fns.push([matcher, fn]);
        },

        /* Add new show/hide effect */
        addEffect: function(name, showFn, closeFn) {
            effects[name] = [showFn, closeFn];
        }

    };

    /* calculate error message position relative to the input */
    function getPosition(trigger, el, conf) {

        // Get the first element in the selector set
        el = $(el).first() || el;

        // get origin top/left position
        var    top = trigger.offset().top,
            left = trigger.offset().left,
            pos = conf.position.split(/,?\s+/),
            y = pos[0],
            x = pos[1];

        top  -= el.outerHeight() - conf.offset[0];
        left += trigger.outerWidth() + conf.offset[1];


        // iPad position fix
        if (/iPad/i.test(navigator.userAgent)) {
            top -= $(window).scrollTop();
        }

        // adjust Y
        var height = el.outerHeight() + trigger.outerHeight();
        if (y == 'center')     { top += height / 2; }
        if (y == 'bottom')     { top += height; }

        // adjust X
        var width = trigger.outerWidth();
        if (x == 'center')     { left -= (width  + el.outerWidth()) / 2; }
        if (x == 'left')      { left -= width; }

        return {top: top, left: left};
    }



    // $.is("[type=xxx]") or $.filter("[type=xxx]") not working in jQuery 1.3.2 or 1.4.2
    function isType(type) {
        function fn() {
            return this.getAttribute("type") == type;
        }
        fn.key = "[type=\"" + type + "\"]";
        return fn;
    }


    var fns = [], effects = {

        'default' : [

            // show errors function
            function(errs) {

                var conf = this.getConf();

                // loop errors
                $.each(errs, function(i, err) {

                    // add error class
                    var input = err.input;
                    input.addClass(conf.errorClass);

                    // get handle to the error container
                    var msg = input.data("msg.el");

                    // create it if not present
                    if (!msg) {
                        msg = $(conf.message).addClass(conf.messageClass).appendTo(document.body);
                        input.data("msg.el", msg);
                    }

                    // clear the container
                    msg.css({visibility: 'hidden'}).find("p").remove();

                    // populate messages
                    $.each(err.messages, function(i, m) {
                        $("<p/>").html(m).appendTo(msg);
                    });

                    // make sure the width is not full body width so it can be positioned correctly
                    if (msg.outerWidth() == msg.parent().width()) {
                        msg.add(msg.find("p")).css({display: 'inline'});
                    }

                    // insert into correct position (relative to the field)
                    var pos = getPosition(input, msg, conf);

                    msg.css({ visibility: 'visible', position: 'absolute', top: pos.top, left: pos.left })
                        .fadeIn(conf.speed);
                });


            // hide errors function
            }, function(inputs) {

                var conf = this.getConf();
                inputs.removeClass(conf.errorClass).each(function() {
                    var msg = $(this).data("msg.el");
                    if (msg) { msg.css({visibility: 'hidden'}); }
                });
            }
        ]
    };


    /* sperial selectors */
    $.each("email,url,number".split(","), function(i, key) {
        $.expr[':'][key] = function(el) {
            return el.getAttribute("type") === key;
        };
    });


    /*
        oninvalid() jQuery plugin.
        Usage: $("input:eq(2)").oninvalid(function() { ... });
    */
    $.fn.oninvalid = function( fn ){
        return this[fn ? "on" : "trigger"]("OI", fn);
    };


    /******* built-in HTML5 standard validators *********/

    v.fn(":email", "Please enter a valid email address", function(el, v) {
        return !v || emailRe.test(v);
    });

    v.fn(":url", "Please enter a valid URL", function(el, v) {
        return !v || urlRe.test(v);
    });

    v.fn(":number", "Please enter a numeric value.", function(el, v) {
        return numRe.test(v);
    });

    v.fn("[max]", "Please enter a value no larger than $1", function(el, v) {

        // skip empty values and dateinputs
        if (v === '' || dateInput && el.is(":date")) { return true; }

        var max = el.attr("max");
        return parseFloat(v) <= parseFloat(max) ? true : [max];
    });

    v.fn("[min]", "Please enter a value of at least $1", function(el, v) {

        // skip empty values and dateinputs
        if (v === '' || dateInput && el.is(":date")) { return true; }

        var min = el.attr("min");
        return parseFloat(v) >= parseFloat(min) ? true : [min];
    });

    v.fn("[required]", "Please complete this mandatory field.", function(el, v) {
        if (el.is(":checkbox")) { return el.is(":checked"); }
        return !!v;
    });

    v.fn("[pattern]", function(el, v) {
        return v === '' || new RegExp("^" + el.attr("pattern") + "$").test(v);
    });

    v.fn(":radio[required]", "Please select an option.", function(el) {
        var    checked = false;
        var    els = $("[name='" + el.attr("name") + "']").each(function(i, el) {
            if ($(el).is(":checked") || checked) {
                checked = true;
            }
        });
        return (checked) ? true : false;
    });

    function Validator(inputs, form, conf) {

        // private variables
        var self = this,
            fire = form.add(self);

        // make sure there are input fields available
        inputs = inputs.not(":button, :image, :reset, :submit");

    // Prevent default Firefox validation
    form.attr("novalidate", "novalidate");

        // utility function
        function pushMessage(to, matcher, returnValue) {

            // only one message allowed
            if (!conf.grouped && to.length) { return; }

            // the error message
            var msg;

            // substitutions are returned
            if (returnValue === false || $.isArray(returnValue)) {
                msg = v.messages[matcher.key || matcher] || v.messages["*"];
                msg = msg[conf.lang] || v.messages["*"].en;

                // substitution
                var matches = msg.match(/\$\d/g);

                if (matches && $.isArray(returnValue)) {
                    $.each(matches, function(i) {
                        msg = msg.replace(this, returnValue[i]);
                    });
                }

            // error message is returned directly
            } else {
                msg = returnValue[conf.lang] || returnValue;
            }

            to.push(msg);
        }


        // API methods
        $.extend(self, {

            getConf: function() {
                return conf;
            },

            getForm: function() {
                return form;
            },

            getInputs: function() {
                return inputs;
            },

            reflow: function() {
                inputs.each(function()  {
                    var input = $(this),
                         msg = input.data("msg.el");

                    if (msg) {
                        var pos = getPosition(input, msg, conf);
                        msg.css({ top: pos.top, left: pos.left });
                    }
                });
                return self;
            },

            /* @param e - for internal use only */
            invalidate: function(errs, e) {

                // errors are given manually: { fieldName1: 'message1', fieldName2: 'message2' }
                if (!e) {
                    var errors = [];
                    $.each(errs, function(key, val) {
                        var input = inputs.filter("[name='" + key + "']");
                        if (input.length) {

                            // trigger HTML5 ininvalid event
                            input.trigger("OI", [val]);

                            errors.push({ input: input, messages: [val]});
                        }
                    });

                      errs = errors;
                    e = $.Event();
                }

                // onFail callback
                e.type = "onFail";
                fire.trigger(e, [errs]);

                // call the effect
                if (!e.isDefaultPrevented()) {
                    effects[conf.effect][0].call(self, errs, e);
                }

                return self;
            },

            reset: function(els) {
                els = els || inputs;
                els.removeClass(conf.errorClass).each(function()  {
                    var msg = $(this).data("msg.el");
                    if (msg) {
                        msg.remove();
                        $(this).data("msg.el", null);
                    }
                }).off(conf.errorInputEvent + '.v' || '');
                return self;
            },

            destroy: function() {
                form.off(conf.formEvent + ".V reset.V");
                inputs.off(conf.inputEvent + ".V change.V");
                return self.reset();
            },


//{{{  checkValidity() - flesh and bone of this tool

            /* @returns boolean */
            checkValidity: function(els, e) {

                els = els || inputs;
                els = els.not(":disabled");

                // filter duplicate elements by name
                var names = {};
                els = els.filter(function(){
                    var name = $(this).attr("name");
                    if (!names[name]) {
                        names[name] = true;
                        return $(this);
                    }
                });

                if (!els.length) { return true; }

                e = e || $.Event();

                // onBeforeValidate
                e.type = "onBeforeValidate";
                fire.trigger(e, [els]);
                if (e.isDefaultPrevented()) { return e.result; }

                // container for errors
                var errs = [];

                // loop trough the inputs
                els.each(function() {

                    // field and it's error message container
                    var msgs = [],
                         el = $(this).data("messages", msgs),
                         event = dateInput && el.is(":date") ? "onHide.v" : conf.errorInputEvent + ".v";

                    // cleanup previous validation event
                    el.off(event);


                    // loop all validator functions
                    $.each(fns, function() {
                        var fn = this, match = fn[0];

                        // match found
                        if (el.filter(match).length)  {

                            // execute a validator function
                            var returnValue = fn[1].call(self, el, el.val());


                            // validation failed. multiple substitutions can be returned with an array
                            if (returnValue !== true) {

                                // onBeforeFail
                                e.type = "onBeforeFail";
                                fire.trigger(e, [el, match]);
                                if (e.isDefaultPrevented()) { return false; }

                                // overridden custom message
                                var msg = el.attr(conf.messageAttr);
                                if (msg) {
                                    msgs = [msg];
                                    return false;
                                } else {
                                    pushMessage(msgs, match, returnValue);
                                }
                            }
                        }
                    });

                    if (msgs.length) {

                        errs.push({input: el, messages: msgs});

                        // trigger HTML5 ininvalid event
                        el.trigger("OI", [msgs]);

                        // begin validating upon error event type (such as keyup)
                        if (conf.errorInputEvent) {
                            el.on(event, function(e) {
                                self.checkValidity(el, e);
                            });
                        }
                    }

                    if (conf.singleError && errs.length) { return false; }

                });


                // validation done. now check that we have a proper effect at hand
                var eff = effects[conf.effect];
                if (!eff) { throw "Validator: cannot find effect \"" + conf.effect + "\""; }

                // errors found
                if (errs.length) {
                    self.invalidate(errs, e);
                    return false;

                // no errors
                } else {

                    // call the effect
                    eff[1].call(self, els, e);

                    // onSuccess callback
                    e.type = "onSuccess";
                    fire.trigger(e, [els]);

                    els.off(conf.errorInputEvent + ".v");
                }

                return true;
            }
//}}}

        });

        // callbacks
        $.each("onBeforeValidate,onBeforeFail,onFail,onSuccess".split(","), function(i, name) {

            // configuration
            if ($.isFunction(conf[name]))  {
                $(self).on(name, conf[name]);
            }

            // API methods
            self[name] = function(fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });


        // form validation
        if (conf.formEvent) {
            form.on(conf.formEvent + ".V", function(e) {
                if (!self.checkValidity(null, e)) {
                    return e.preventDefault();
                }
                // Reset event type and target
                e.target = form;
                e.type = conf.formEvent;
            });
        }

        // form reset
        form.on("reset.V", function()  {
            self.reset();
        });

        // disable browser's default validation mechanism
        if (inputs[0] && inputs[0].validity) {
            inputs.each(function()  {
                this.oninvalid = function() {
                    return false;
                };
            });
        }

        // Web Forms 2.0 compatibility
        if (form[0]) {
            form[0].checkValidity = self.checkValidity;
        }

        // input validation
        if (conf.inputEvent) {
            inputs.on(conf.inputEvent + ".V", function(e) {
                self.checkValidity($(this), e);
            });
        }

        // checkboxes and selects are checked separately
        inputs.filter(":checkbox, select").filter("[required]").on("change.V", function(e) {
            var el = $(this);
            if (this.checked || (el.is("select") && $(this).val())) {
                effects[conf.effect][1].call(self, el, e);
            }
        });

        // get radio groups by name
        inputs.filter(":radio[required]").on("change.V", function(e) {
            var els = $("[name='" + $(e.srcElement).attr("name") + "']");
            if ((els !== null) && (els.length !== 0)) {
                self.checkValidity(els, e);
            }
        });

        // reposition tooltips when window is resized
        $(window).resize(function() {
            self.reflow();
        });

    }


    // jQuery plugin initialization
    $.fn.validator = function(conf) {

        var instance = this.data("validator");

        // destroy existing instance
        if (instance) {
            instance.destroy();
            this.removeData("validator");
        }

        // configuration
        conf = $.extend(true, {}, v.conf, conf);

        // selector is a form
        if (this.is("form")) {
            return this.each(function() {
                var form = $(this);
                instance = new Validator(form.find(":input"), form, conf);
                form.data("validator", instance);
            });

        } else {
            instance = new Validator(this, this.eq(0).closest("form"), conf);
            return this.data("validator", instance);
        }

    };

})(jQuery);
