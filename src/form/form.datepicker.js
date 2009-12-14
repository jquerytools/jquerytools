/**
 * @license                                     
 * form.datepickerer @VERSION - Pick your (HTML5) day.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/form/datepickerer/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: jQuery Tools 1.2.0 (Mar 2010)
 * Date: @DATE 
 */

/* --- TODO ---
	event management
	trigger from icon
*/ 
(function($) {	

	$.tools = $.tools || {};	
	$.tools.form = $.tools.form || {};
	
	var instances = [], tool = $.tools.form.datepicker = {
		
		version: '@VERSION',  
		
		conf: { 
			format: 'mm/dd/yy',
			selectors: false,
			yearRange: [-5, 5],
			lang: 'en',
			offset: [0, 0],
			speed: 100,
			easing: null,
			firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
			min: 0,
			max: 0,
			
			css: {
				
				// ids
				root: 'picker'	,
				head: 'head',
				title: 'pickertitle', 
				previousMonth: 'pm',
				nextMonth: 'nm',
				monthSelector: 'monthSelector',
				yearSelector: 'yearSelector', 
				days: 'days',
				weeks: 'weeks',
				today: 'today',				
				
				// classnames
				week: 'week', 
				offmonth: 'off',
				sunday: 'sun',
				focus: 'focus',
				disabled: 'disabled'
			}  
		} 
	};
	
	var LABELS = {
		en:  {
			months: 		 ['January','February','March','April','May','June',
	  					 		'July','August','September','October','November','December'], 
			shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],  
			days: 		 ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 
			shortDays: 	 ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']	  
		}
	};
	
//{{{ private functions
		

	// @return amount of days in certain month
	function dayAm(year, month) {
		return 32 - new Date(year, month, 32).getDate();		
	}
 
	function zeropad(val, len) {
		val = '' + val;
		len = len || 2;
		while (val.length < len) val = "0" + val;
		return val;
	}
		
	var Re = /d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g;

	// thanks: http://stevenlevithan.com/assets/misc/date.format.js 
	function format(date, format, lang) {
		
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

		return format.replace(Re, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
		
	}
	
	function integer(val) {
		return parseInt(val, 10);	
	}
	
	function rfc3339(val) {
		if (val) {
			val = val.split("-");		
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
		
	
	
	function Datepicker(input, conf)  { 

		// variables
		var self = this,
			 $self = $(this).add(input),			  
			 css = conf.css,
			 labels = LABELS[conf.lang],
			 root = $("#" + css.root),
			 title = root.find("#" + css.title),
			 pm, nm, 
			 currYear, currMonth, currDay,
			 value = rfc3339(input.attr("data-value") || input.val()),
			 min = rfc3339(input.attr("min")) || roll(value, conf.min), 
			 max = rfc3339(input.attr("max")) || roll(value, conf.max);
			 
			 
		// Replace build-in date input: NOTE: input.attr("type", "text") throws exception by the browser
		var tmp = $('<input/>')
			.attr("type", "text")
			.attr("name", input.attr("name"))
			.addClass(input.attr("className"));					
			
		input.replaceWith(tmp);
		input = tmp;
		
		// default value
		if (value) {			
			input.data("date", value);			
			input.val(format(value, conf.format, conf.lang));
		}		
			 
		// construct layout
		if (!root.length) {
			
			// root
			root = $('<div><div><a/><div/><a/></div><div/><div/></div>').hide().css({position: 'absolute'}).attr("id", css.root);			
						
			// elements
			root.children()
				.eq(0).attr("id", css.head).end()
				.eq(1).attr("id", css.days).end()
				.eq(2).attr("id", css.weeks).end()
				.find("a").eq(0).attr("id", css.previousMonth).end().eq(1).attr("id", css.nextMonth);		 				  
			
			// title
			title = root.find("#" + css.head).find("div").attr("id", css.title);
			
			// year & month selectors
			if (conf.selectors) {				
				var monthSelector = $("<select/>").attr("id", css.monthSelector),
					 yearSelector = $("<select/>").attr("id", css.yearSelector);				
				title.append(monthSelector.add(yearSelector));
			}						
			
			// day titles
			var days = root.find("#" + css.days);

			$.each(labels.shortDays, function(i, el) {
				days.append($("<span>/").text(el)); 		
			}); 
			
			$("body").append(root);
		}	
		
		// layout elements
		var weeks = root.find("#" + css.weeks),
			 yearSelector = root.find("#" + css.yearSelector),
			 monthSelector = root.find("#" + css.monthSelector);
			 

		input.focus(function() { 
			$.each(instances, function() {
				this.hide();	
			});
			self.show();  
			
		}).keydown(function(e) {
			input.blur();	
		});
		
		function pick(date, conf, e) { 
			
			// onBeforePick
			e.type = "onBeforePick"; 
			$self.trigger(e, [date]); 
			if (e.isDefaultPrevented()) { return; }
			
			// formatting			
			input.val(format(date, conf.format, conf.lang));
			
			// onPick
			e.type = "onPick";
			$self.trigger(e, [date]);
			
			// store date
			input.data("date", date);
			
			self.hide(); 
		}
		
		
		$.extend(self, {
			
			show: function() {
				
				// month selector
				monthSelector.unbind("change").change(function() {
					self.setDate(yearSelector.val(), $(this).val());		
				});
				
				// year selector
				yearSelector.unbind("change").change(function() {
					self.setDate($(this).val(), monthSelector.val());		
				});
				
				// prev / next month
				pm = root.find("#" + css.previousMonth).unbind("click").click(function(e) {
					if (!pm.hasClass(css.disabled)) {	
						self.prev();
					}
					return false;
				});
				
				nm = root.find("#" + css.nextMonth).unbind("click").click(function(e) {
					if (!nm.hasClass(css.disabled)) {
						self.next();
					}
					return false;
				});	
				
				
				// set date
				self.setDate();				
				
				// show datepickerer
				var pos = input.offset(), h = root.height(), w = root.width();

				root.css({
						 
					top: pos.top + input.outerHeight({margins: true}) + conf.offset[0], 
					left: pos.left + conf.offset[1],
					width: 0,
					height: 0,
					opacity: 0
					
				}).animate({height: h, width: w, opacity: 1}, conf.speed, conf.easing, function()  {
					
					// keyboard actions
					$(document).bind("keydown.dp", function(e) {
							
						var key = e.keyCode;				
						
						// esc key
						if (key == 27) { return self.hide(); }						
												
						// h=72, j=74, k=75, l=76, down=40, left=37, up=38, right=39			
						if ($([75, 76, 38, 39, 74, 72, 40, 37]).index(key) != -1) {

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
							return false;
						}
					 
						// pageUp / pageDown
						if (key == 34) { return self.next(); }						
						if (key == 33) { return self.prev(); }
						
						// home
						if (key == 36) { return self.setDate(); }
						
						
						// enter
						if (key == 13) {
							if (!$(e.target).is("select")) {
								pick($("." + css.focus).data("date"), conf, e);
							}
						}
						
					});
					
					// click outside datepicker
					$(window).bind("click.dp", function(e) {
						var el = $(e.target);
						if (!el.parents("#" + css.root).length && el.index(input) !== 0) { 
							self.hide(); 
						}
					});					
					
				});				
			
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
						if ((!min || min < new Date(year, i + 1, -1)) && (!max || max > new Date(year, i, 0))) {
							monthSelector.append($("<option/>").text(m).attr("value", i));
						}
					});
					
					// year selector
					yearSelector.empty();					
					for (var i = year + conf.yearRange[0];  i < year + conf.yearRange[1]; i++) {
						if ((!min || min < new Date(i + 1, -1, 0)) && (!max || max > new Date(i, 0, 0))) {
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
				
				for (var i = 0, a, num; i < 35; i++) { 
					
					a = $("<a/>");
					
					if (i % 7 == 0) {
						week = $("<div/>").addClass(css.week);
						weeks.append(week);			
					}					
					
					if (i < begin)  { 
						a.addClass(css.offmonth); 
						num = prevDays - begin + i + 1;
						date = new Date(year, month-1, num);
						
					} else if (i >= begin + days)  {
						a.addClass(css.offmonth);	
						num = i - days - begin + 1;
						date = new Date(year, month+1, num);
						
					} else  { 
						num = i - begin + 1;
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
					weeks.find(".week").each(function() {
						var beg = conf.firstDay ? 7 - conf.firstDay : 0;
						$(this).children().slice(beg, beg + 1).addClass(css.sunday);		
					});	
				} 
				
				currMonth = month;
				currYear = year;				
				currDay = day;
				
				return self;
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
			
			bind: function(name, fn) {
				$self.bind(name, fn);
				return self;	
			},	
			
			unbind: function(name) {
				$self.unbind(name);
				return self;	
			}, 
			
			hide: function() {				
				$(window).unbind("click.dp");
				$(document).unbind("keydown.dp");	
				root.hide();	
				return self;
			},
			
			getInput: function() {
				return input;	
			}
			
		}); 
		
		// callbacks
		$.each("onBeforePick,onPick".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				self.bind(name, conf[name]);	
			}
			
			// API methods
			self[name] = function(fn) {
				return self.bind(name, fn);	
			};
		});		
	}
	

	
	
	$.fn.datepicker = function(conf) {   
		
		// return existing instance
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("datepicker");
		if (el) { return el; } 
		
		// configuration
		var globals = $.extend({}, tool.conf); 
		conf = $.extend(globals, conf);		
		
		this.each(function() {									
			el = new Datepicker($(this), conf);
			instances.push(el);
			$(this).add(el.getInput()).data("datepicker", el);
		});		
		
		return conf.api ? el: this;		
	}; 
	
	
}) (jQuery);
 
	
