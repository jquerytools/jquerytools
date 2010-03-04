/**
 * @license                                     
 * jQuery Tools @VERSION Dateinput - <input type="date" /> for humans
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/form/dateinput/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
(function($) {	
		
	/* TODO: 
		 preserve today highlighted
	*/
	
	$.tools = $.tools || {version: '@VERSION'};
	
	var instances = [], tool, LABELS = {};
	
	tool = $.tools.dateinput = {
		
		conf: { 
			format: 'mm/dd/yy',
			selectors: false,
			yearRange: [-5, 5],
			lang: 'en',
			offset: [0, 0],
			speed: 0,
			firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
			min: 0,
			max: 0,
			trigger: false,
			
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
				
				// classnames
				week: 0, 
				off: 0,
				sunday: 0,
				focus: 0,
				disabled: 0,
				trigger: 0
			}  
		},
		
		localize: function(language, labels) {
			$.each(labels, function(key, val) {
				labels[key] = val.split(",");		
			});
			LABELS[language] = labels;	
		}
		
	};
	
	tool.localize("en", {
		months: 		 'January,February,March,April,May,June,July,August,September,October,November,December', 
		shortMonths: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',  
		days: 		 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 
		shortDays: 	 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'	  
	});

	
//{{{ private functions
		

	// @return amount of days in certain month
	function dayAm(year, month) {
		return 32 - new Date(year, month, 32).getDate();		
	}
 
	function zeropad(val, len) {
		val = '' + val;
		len = len || 2;
		while (val.length < len) { val = "0" + val; }
		return val;
	}  

	// thanks: http://stevenlevithan.com/assets/misc/date.format.js 
	var Re = /d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g, tmpTag = $("<a/>");
	
	function format(date, fmt, lang) {
		
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

		var ret = fmt.replace(Re, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
		
		// a small trick to handle special characters
		return tmpTag.html(ret).html();
		
	}
	
	function integer(val) {
		return parseInt(val, 10);	
	}
	
	function rfc3339(val) {
		if (val) {
			val = val.toString().split("-");		
			if (val.length == 3) {
				return new Date(integer(val[0]), integer(val[1]) -1, integer(val[2]));
			}
		}
	}
	
	function roll(date, am) { 
		if (date && am) {
			var ret = new Date(date);
			ret.setDate(ret.getDate() + am);
			return ret;
		}
	}
	
//}}}
		
	
	
	function Dateinput(input, conf)  { 

		// variables
		var self = this,  
			 css = conf.css,
			 labels = LABELS[conf.lang],
			 root = $("#" + css.root),
			 title = root.find("#" + css.title),
			 trigger,
			 pm, nm, 
			 currYear, currMonth, currDay,
			 value = rfc3339(input.attr("data-value") || conf.value || input.val()) || new Date(), 
			 min = input.attr("min") || conf.min,  
			 max = input.attr("max") || conf.max;
			 
			 
		// make sure min / max has values		
		min = rfc3339(min) || roll(value, -Math.abs(min) || conf.yearRange[0] * 365);
		max = rfc3339(max) || roll(value, Math.abs(max) || conf.yearRange[1] * 365);
		
		
		// check that language exists
		if (!labels) { throw "Datepicker: invalid language: " + conf.lang; }
		
		// Replace built-in date input: NOTE: input.attr("type", "text") throws exception by the browser
		if (input.attr("type") == 'date') {
			var tmp = $("<input/>").attr("name", input.attr("name"));
			input.replaceWith(tmp);
			input = tmp;
		}
		input.addClass(css.input);
		
		var fire = input.add(this);
		
		// default value
		if (value) {			
			input.data("date", value);			
			input.val(format(value, conf.format, conf.lang));
		}		
			 
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
					.eq(1).attr("id", css.weeks).end().end()
				.find("a").eq(0).attr("id", css.prev).end().eq(1).attr("id", css.next);		 				  
			
			// title
			title = root.find("#" + css.head).find("div").attr("id", css.title);
			
			// year & month selectors
			if (conf.selectors) {				
				var monthSelector = $("<select/>").attr("id", css.month),
					 yearSelector = $("<select/>").attr("id", css.year);				
				title.append(monthSelector.add(yearSelector));
			}						
			
			// day titles
			var days = root.find("#" + css.days);
			
			// days of the week
			for (var d = 0; d < 7; d++) { 
				days.append($("<span>/").text(labels.shortDays[(d + conf.firstDay) % 7]));
			}
			
			$("body").append(root);
		}	
		
				
		// trigger icon
		if (conf.trigger) {
			trigger = $("<a/>").attr("href", "#").addClass(css.trigger).click(function(e)  {
				self.show();
				return e.preventDefault();
			}).insertAfter(input);	
		}
		
		
		// layout elements
		var weeks = root.find("#" + css.weeks);
		yearSelector = root.find("#" + css.year);
		monthSelector = root.find("#" + css.month);
			 
			 
		function pick(date, conf, e) {  

			if (input.is("[readonly]")) { return; }
				
			// current value
			value = date;
			
			// onPick
			e.type = "change";
			fire.trigger(e, [date]);
			if (e.isDefaultPrevented()) { return; }
			
			// formatting			
			input.val(format(date, conf.format, conf.lang));

			
			// store value into input
			input.data("date", date);
			
			// HTML5 DOM property
			input[0].valueAsDate = date;
			
			self.hide(e); 
		}

		function onShow(ev) {
			
			ev.type = "onShow";
			fire.trigger(ev);  
			
			$(document).bind("keydown.d", function(e) { 
				
				var key = e.keyCode;			 
				
				// esc key
				if (key == 27) { return self.hide(e); }						
									
				// h=72, j=74, k=75, l=76, down=40, left=37, up=38, right=39			
				if ($([75, 76, 38, 39, 74, 72, 40, 37]).index(key) >= 0) {
					
					if (root.is(":hidden")) { 
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
					
					
					if (index == -1) {
						self.prev();
						el = $("#" + css.weeks + " a:last");
						
					} else if (index == 35) {
						self.next();
						el = $("#" + css.weeks + " a:first");								
					} else {
						el = days.eq(index);
					}
					
					el.addClass(css.focus);
					return e.preventDefault();
					
				}
			 
				// pageUp / pageDown
				if (key == 34) { return self.next(); }						
				if (key == 33) { return self.prev(); }
				
				// home
				if (key == 36) { return self.today(); } 
				
				// enter
				if (key == 13) {
					if (!$(e.target).is("select")) {
						pick($("." + css.focus).data("date"), conf, e); 
					} 
				}
				
				return $([16, 17, 18, 9]).index(key) >= 0;  				
			});
			
			
			// click outside dateinput
			$(window).bind("click.d", function(e) {
				var el = e.target;
				if (!$(el).parents("#" + css.root).length && el != input[0] && (!trigger || el != trigger[0])) { 
					self.hide(e); 
				}
			}); 
		}
		
		
		$.extend(self, {
			
			show: function(e) {
				
				// onBeforeShow
				e = e || $.Event();
				e.type = "onBeforeShow";
				fire.trigger(e);
				if (e.isDefaultPrevented()) { return; }
			
				$.each(instances, function() {
					this.hide();	
				});
				
				// month selector
				monthSelector.unbind("change").change(function() {
					self.setDate(yearSelector.val(), $(this).val());		
				});
				
				// year selector
				yearSelector.unbind("change").change(function() {
					self.setDate($(this).val(), monthSelector.val());		
				});
				
				// prev / next month
				pm = root.find("#" + css.prev).unbind("click").click(function(e) {
					if (!pm.hasClass(css.disabled)) {	
						self.prev();
					}
					return false;
				});
				
				nm = root.find("#" + css.next).unbind("click").click(function(e) {
					if (!nm.hasClass(css.disabled)) {
						self.next();
					}
					return false;
				});	 
				
				// set date
				self.today();				 
				
				
				// show dateinputer
				var pos = input.offset();

				root.css({ 
					top: pos.top + input.outerHeight({margins: true}) + conf.offset[0], 
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
				
			setDate: function(year, month, day)  {						
				
				var date = new Date(year, month, day);
				
				// current year / month
				if (!year) {
					date = input.data("date") || new Date();					
					year = date.getYear() % 100 + 2000;
					month = date.getMonth();
					day = date.getDate();
				}
				
				// strings to numbers
				year = integer(year);
				month = integer(month);
				day = integer(day);
				
				// roll year & month
				if (month == -1) {
					month = 11;
					year--;
				} else if (month == 12) {
					month = 0;
					year++;
				} 
				
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
						if (min < new Date(year, i + 1, -1) && max > new Date(year, i, 0)) {
							monthSelector.append($("<option/>").html(m).attr("value", i));
						}
					});
					
					// year selector
					yearSelector.empty();					
					for (var i = year + conf.yearRange[0];  i < year + conf.yearRange[1]; i++) {
						if (min < new Date(i + 1, -1, 0) && max > new Date(i, 0, 0)) {
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
				
				for (var j = 0, a, num; j < 35; j++) { 
					
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
						if (num === day) {
							a.attr("id", css.today).addClass(css.focus);
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
					
					// date picking					
					a.click(function(e) {
						if (!$(this).hasClass(css.disabled)) {
							pick($(this).data("date"), conf, e);
						}
						return false;
					});
				}

				// sunday
				if (css.sunday) {
					weeks.find(css.week).each(function() {
						var beg = conf.firstDay ? 7 - conf.firstDay : 0;
						$(this).children().slice(beg, beg + 1).addClass(css.sunday);		
					});	
				} 
				
				currMonth = month;
				currYear = year;				
				currDay = day;
				
				return self;
			}, 
	
			today: function() {
				return self.setDate();	
			},
			
			next: function(day) {
				return this.setDate(currYear, currMonth + 1, day);	
			},
	
			prev: function(day) {
				return this.setDate(currYear, currMonth - 1, day);	
			},
			
			nextYear: function(year, day) {
				return this.setDate(currYear + 1, currMonth, day);	
			},
			
			prevYear: function(year, day) {
				return this.setDate(currYear - 1, currMonth, day);	
			},
						
			hide: function(e) {				
				
				if (root.is(":visible")) {
					root.hide();
					$(window).unbind("click.d"); 
					$(document).unbind("keydown.d");
					
					// onHide
					e = e || $.Event();
					e.type = "onHide";
					fire.trigger(e);
				}
				
				return self;
			},
			
			getConf: function() {
				return conf;	
			},
			
			getInput: function() {
				return input;	
			},
			
			getPicker: function() {
				return root;	
			},
			
			getDate: function(dateFormat) {
				return dateFormat ? format(value, dateFormat, conf.lang) : value;	
			}
			
		}); 
		
		// callbacks	
		$.each("onBeforeShow,onShow,change,onHide".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});

		
		// show dateinput & assign keyboard shortcuts
		input.bind("focus click", self.show).keydown(function(e) {

			var key = e.keyCode;
			
			// open dateinput with navigation keyw
			if (root.is(":hidden") &&  $([75, 76, 38, 39, 74, 72, 40, 37]).index(key) >= 0) {
				self.show(e);
				return e.preventDefault();
			} 
			
			// allow tab
			return e.shiftKey || e.ctrlKey || e.altKey || key == 9 ? true : e.preventDefault();   
			
		}); 
		
	} 
	
	$.expr[':'].date = function(el) {
		var type = el.getAttribute("type");
		return type && type == 'date' || !!$(el).data("dateinput");
	};
	
	
	$.fn.dateinput = function(conf) {   
		
		// already instantiated
		if (this.data("dateinput")) { return this; } 
		
		// configuration
		conf = $.extend({}, tool.conf, conf);		
		
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
 
	
