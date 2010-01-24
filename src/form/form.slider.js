/**
 * @license 
 * jQuery Tools @VERSION Slider - A HTML5 slider component
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/form/slider/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 * 
 * Requires toolbox.drag.js
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
 
/* --- TODO ---
	browser testing, bug hunting, demos
	http://developer.yahoo.com/yui/examples/button/btn_example14.html 
*/

(function($) {
	 
	$.tools = $.tools || {version: '@VERSION'};
	 
	var current, tool;
	
	tool = $.tools.slider = {
		
		conf: {
			min: 0,
			max: 100,
			size: 0, 	// The number of options meant to be shown by the control (fixed points in scrubber)
			step: 0, 	// Specifies the value granularity of the element's value (onSlide callbacks)
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
	
	
	function Slider(input, conf) {
		
		// private variables
		var self = this,  
			 root = $("<div><div/><a/></div>"),	
			 range = conf.max - conf.min,
			 value,
			 callbacks,
			 origo,
			 len,
			 pos,
			 progress,
			 handle;		
			 
			 
		input.before(root);	
		handle = root.addClass(conf.sliderClass).find("a").addClass(conf.handleClass);
		progress = root.find("div").addClass(conf.progressClass);  
		
		// get (HTML5) attributes
		$.each("min,max,size,step,value".split(","), function(i, key) {
			var val = input.attr(key);
			conf[key] = parseFloat(val, 10);
		});			   
		
		/*
			with JavaScript we don't want the HTML5 range element 
			NOTE: input.attr("type", "text") throws exception by the browser
		*/
		var tmp = $('<input/>')
			.attr("type", "text")
			.addClass(input.attr("className"))
			.attr("name", input.attr("name"))
			.attr("disabled", input.attr("disabled"));					

		input.replaceWith(tmp);
		input = tmp;
		
		if (conf.hideInput) { input.hide(); }
			 
		var fire = input.add(this);
			 
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
		function seek(x, e, skipEvent) { 
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
				if (!skipEvent) { fire.trigger(e, [v]); }
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
				
			setValue: function(v, e, skipEvent) {
				if (v == value) { return self; }
				init();
				
				// widget is hidden. cannot determine wrapper dimension
				if (!len) {
					value = v;
					return self;
				}				
				var x = (v - conf.min) * (len / range);				
				return seek(x, e, skipEvent);
			}, 
			
			// if widget is hidden
			draw: function(e) {
				var v = value;
				value = 0;
				self.setValue(v, e, true);
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
				return seek(pos + x * am, e);
			},
			
			next: function() {
				return this.step(1);	
			},
			
			prev: function() {
				return this.step(-1);	
			}	
			
		});
		
		// callbacks
		$.each("onBeforeSlide,onSlide,onSlideEnd".split(","), function(i, name) {
				
			// from configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;	
			};
		}); 
			

		// dragging		
		handle.bind("dragstart", function(e) {	
				
			if (input.is(":disabled")) { return false; } 
			e.type = "onBeforeSlide";
			
			fire.trigger(e);
			if (e.isDefaultPrevented()) { return false; }			
			init();	
			
		}).bind("drag", function(e) {			
			if (input.is(":disabled")) { return false; } 
			
			seek(conf.vertical ? origo - e.offsetY  : e.offsetX - origo, e);
			
		}).bind("dragend", function(e) {
			e.type = "onSlideEnd";
			fire.trigger(e);			
			
		}).click(function(e) {
			return e.preventDefault();	
		});		
		
		// clicking
		root.click(function(e) {
			
			if (input.is(":disabled")) { return false; }	
			var fireEvent = e.target != handle[0];
			
			if (fireEvent) {
				e.type = "onBeforeSlide";
				fire.trigger(e);			
				if (e.isDefaultPrevented()) { return false; } 
			}
			
			init();  
			var fix = handle.width() / 2; 
			seek(conf.vertical ? origo - e.pageY + fix : e.pageX - origo - fix, e);
			
			if (fireEvent) {
				e.type = "onSlideEnd";
				fire.trigger(e);
			}
			
		});

		self.onSlide(function(e, val)  {
			input.val(val);		
		});   
		
		self.setValue(conf.value || conf.min);	 
	}
	
	if (tool.conf.keyboard) {
		
		$(document).keydown(function(e) {

			var el = $(e.target), 
				 slider = el.data("slider") || current,
				 key = e.keyCode,
				 up = $([75, 76, 38, 33, 39]).index(e.keyCode) != -1,
				 down = $([74, 72, 40, 34, 37]).index(e.keyCode) != -1;
			
			if ((up || down) && !(e.shiftKey || e.altKey) && slider) {
				
				var fire = slider.getInput().add(slider);
				e.type = "onBeforeSlide"; 
			
				// UP: 	k=75, l=76, up=38, pageup=33, right=39			
				if (up) {
					fire.trigger(e);
					if (e.isDefaultPrevented()) { return false; }	
					slider.step(e.ctrlKey || key == 33 ? 3 : 1, e);
					return false;
				}
				
				// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
				if (down) {
					fire.trigger(e);	
					if (e.isDefaultPrevented()) { return false; }	
					slider.step(e.ctrlKey || key == 34 ? -3 : -1, e);
					return false;
				}
			}
			
			if (slider) {
				
				setTimeout(function() {
					var val = /[\d\.]+/.exec(el.val());
					if (val && parseFloat(val)) {
						slider.setValue(parseFloat(val), e);		
					} else {
						el.val(slider.getValue());	
					}
				}, 400); 
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
		var el = this.data("slider"), els;
		if (el) { return el; }
		
		if (typeof conf == 'number') {
			conf = {max: conf};
		}
		
		// extend configuration with globals
		conf = $.extend({}, tool.conf, conf);		
		
		this.each(function() {				
			el = new Slider($(this), $.extend({}, conf));		 
			var input = el.getInput().data("slider", el);
			els = els ? els.add(input) : input;	
		});		
		
		return conf.api ? el : els;		
	};	
	
	
}) (jQuery);

