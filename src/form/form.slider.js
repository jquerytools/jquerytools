/**
 * @license 
 * form.slider @VERSION - HTML5 slider. Implemented.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/form/slider/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 * 
 * Requires toolbox.drag.js
 *
 * Since: jQuery Tools 1.2.0 (Mar 2010)
 * Date: @DATE 
 */
 
/* --- TODO ---
	browser testing, bug hunting, demos
	http://developer.yahoo.com/yui/examples/button/btn_example14.html 
*/

(function($) {
	 
	$.tools = $.tools || {};
	 
	var current, tool = $.tools.slider = {
		version: '@VERSION',
		
		conf: {
			min: 0,
			max: 100,
			size: 0, 	// The number of options meant to be shown by the control (fixed points in scrubber)
			step: 0, 	// Specifies the value granularity of the element’s value (onSlide callbacks)
			value: 0,			
			decimals: 2,
			vertical: false,
			keyboard: true,
			
			hideInput: true,
			sliderClass: 'slider',
			speed: 200,
			
			// set to null if not needed
			progressClass: 'progress',
			handleClass: 'handle',			
			api: false
		}
		
	};
	
	function toSteps(value, size, max) {
		var step = max / size;
		return Math.round(value / step) * step;		
	}
	
	function round(value, decimals) {
		var n = Math.pow(10, decimals);
		return Math.round(value * n) / n;
	}
	
	
	function Slider(el, conf) {
		
		var root, input; 
		
		// construct slider from the range input
		if (el.is("input")) {
			
			input = el;
			root = $("<div><div/><a/></div>");
			
			root.addClass(conf.sliderClass).find("a").addClass(conf.handleClass);
			
			// progress is not required			
			if (conf.progressClass)  {
				root.find("div").addClass(conf.progressClass);
			}				
			
			// get (HTML5) attributes
			$.each("min,max,size,step,value".split(","), function(i, key) {
				var val = input.attr(key);
				conf[key] = parseFloat(val, 10);
			});			
						
			input.before(root);			
			
			if (conf.hideInput) { 
				input.hide();
				
			} else {
				
				/*
					with JavaScript we don't want the HTML5 range element 
					NOTE: input.attr("type", "text") throws exception by the browser
				*/
				var tmp = $('<input/>').attr("type", "text").addClass(input.attr("className"))
					.attr("name", input.attr("name"));					

				input.replaceWith(tmp);
				input = tmp;
			}			
		}
		
		// private variables
		var self = this, 
			 $self = $(this), 
			 progress = root.find("." + conf.progressClass), 
			 handle = root.find("." + conf.handleClass),	
			 range = conf.max - conf.min,
			 value,
			 callbacks,
			 origo,
			 len,
			 pos;
			 
			 
		function init() {
			var o = handle.offset();
			
			// recalculate when value = 0 (a recovery mechanism)
			if (!len || !value) {
				if (conf.vertical) {
					len = root.height() - handle.outerWidth(true);
					origo = o.top + len; 
					
				} else {
					len = root.width() - handle.outerWidth(true);
					origo = o.left;	  
				}
			} 				
		}
		
		// flesh and bone of this tool 
		function seek(x, e) { 
			init(); 
			
			// fit inside the slider		
			x = Math.min(Math.max(0, x), len);			 
			
			// increment in steps
			if (conf.size) {
				x = toSteps(x, conf.size, len);	
			}
			
			// calculate value			
			var v = x / len * range + conf.min;

			if (conf.step) {
				v = toSteps(v, conf.step, conf.max);	
			}						

			// rounding
			v = round(v, conf.decimals);			
			
			if (v != value)  {
				value = v;	
				e = e || $.Event();
				e.type = "onSlide";
				$(self).trigger(e, [v]);
			}
			
			// move handle & resize progress
			var orig = e && e.originalEvent, 
				 speed = orig && orig.type == "click" ? conf.speed : 0;
			
			if (conf.vertical) {
				handle.animate({top: -(x - len)}, speed);
				progress.animate({height: x}, speed);						
				
			} else {
				handle.animate({left: x}, speed);
				progress.animate({width: x}, speed);	
			}

			pos = x;			
			
			return self;
		}
		
		$.extend(self, {
				
			setValue: function(v, e) {
				if (v == value) { return self; }
				init();
				
				// widget is hidden. cannot determine wrapper dimension
				if (!len) {
					value = v;
					return self;
				}				
				var x = (v - conf.min) * (len / range);				
				return seek(x, e);
			}, 
			
			// if widget is hidden
			draw: function(e) {
				var v = value;
				value = 0;
				self.setValue(v, e);
			},
			
			getName: function() {
				return input.attr("name");	
			},
			
			getValue: function() {
				return value;	
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
				init();
				var x = Math.max(len / conf.step || conf.size || 10, 2);
				return seek(pos + x * am, e)
			},
			
			next: function() {
				return this.step(1);	
			},
			
			prev: function() {
				return this.step(-1);	
			},			
			
			// callback functions
			bind: function(name, fn) {
				$self.bind(name, fn);
				return self;	
			},	
			
			unbind: function(name) {
				$self.unbind(name);
				return self;	
			}	
			
		});
		
		// callbacks
		$.each("onBeforeSlide,onSlide,onSlideEnd".split(","), function(i, name) {
				
			// from configuration
			if ($.isFunction(conf[name]))  {
				self.bind(name, conf[name]);	
			}
			
			// API methods
			self[name] = function(fn) {
				return self.bind(name, fn);	
			};
		});
		
			

		// dragging		
		handle.bind("dragstart", function(e) {				
			if (input.is(":disabled")) { return false; }
			
			e.type = "onBeforeSlide";
			$self.trigger(e);
			if (e.isDefaultPrevented()) { return false; }			
			init();	
			
		}).bind("drag", function(e) {			
			if (input.is(":disabled")) { return false; }
			
			
			seek(conf.vertical ? origo - e.offsetY  : e.offsetX - origo, e);
			
		}).bind("dragend", function(e) {
			e.type = "onSlideEnd";
			$self.trigger(e);			
			
		}).click(function(e) {
			return e.preventDefault();	
		});		
		
		// clicking
		root.click(function(e) {
				
			if (input.is(":disabled")) { return false; }	
				
			e.type = "onBeforeSlide";
			$self.trigger(e);			
			if (e.isDefaultPrevented()) { return false; } 
			init(); 
			
			var fix = handle.width() / 2;
			
			seek(conf.vertical ? origo - e.pageY + fix : e.pageX - origo - fix, e);
			
			e.type = "onSlideEnd";
			$self.trigger(e);			 			
		});
		
		
		if (input) {
			self.onSlide(function(e, val)  {
				input.val(val);		
			});  
		}
		
		if (conf.value) {
			self.setValue(conf.value || conf.min);	
		}		
		
	}
	
	if (tool.conf.keyboard) {
		
		$(document).keydown(function(e) {

			var el = $(e.target), slider = el.data("slider") || current;
			
			if (slider) {
				
				// UP: 	k=75, l=76, up=38, pageup=33, right=39			
				if ($([75, 76, 38, 33, 39]).index(e.keyCode) != -1) {
					slider.step(e.ctrlKey || e.keyCode == 33 ? 3 : 1, e);
					return false;
				}
				
				// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
				if ($([74, 72, 40, 34, 37]).index(e.keyCode) != -1) {
					slider.step(e.ctrlKey || e.keyCode == 34 ? -3 : -1, e);
					return false;
				}
				
				setTimeout(function() {
					var val = /[\d\.]+/.exec(el.val());
					if (val && parseFloat(val)) {
						slider.setValue(parseFloat(val), e);		
					} else {
						el.val(slider.getValue());	
					}
				}, 300);
				
				current = slider;
			}		
		});
		
		$(document).click(function(e) {
			var el = $(e.target);	
			current = el.data("slider") || el.parent().data("slider");
		});
	}
	
		
	// jQuery plugin implementation
	$.fn.slider = function(conf) {

		// return existing instance
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("slider");
		if (el) { return el; }
		
		if (typeof conf == 'number') {
			conf = {max: conf};
		}
		
		// extend configuration with globals
		var globals = $.extend({}, tool.conf);
		conf = $.extend(globals, conf);		
		
		this.each(function() {				
			var root = $(this);
			el = new Slider(root, $.extend({}, conf));			
			root.add(el.getInput()).data("slider", el);
		});		
		
		return conf.api ? el: this;		
	};	
	
	
}) (jQuery);

