/**
 * @license 
 * jQuery Tools @VERSION Slider - HTML5 <input type="range" /> for humans
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
(function($) {
	 
	$.tools = $.tools || {version: '@VERSION'};
	 
	var current, tool;
	
	tool = $.tools.slider = {
		
		conf: {
			min: 0,
			max: 100,
			step: 0, 	// Specifies the value granularity of the element's value (onSlide callbacks)
			value: 0,			
			decimals: 2,
			vertical: false,
			keyboard: true,
			
			hideInput: false, 
			speed: 200,
			
			// set to null if not needed
			sliderClass: 'slider',
			progressClass: 'progress',
			handleClass: 'handle'
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
	
	function dim(el, key) {
		return parseInt(el.css(key), 10);	
	}
	
	function Slider(input, conf) {
		
		// private variables
		var self = this,  
			 root = $("<div><div/><a/></div>").data("slider", self),	 
			 value,			// current value
			 origo,			// handle's start point
			 len,				// length of the slider
			 pos,				// current position of the handle
			 progress,		// progress "bar"
			 handle;			// drag handle 
			 
		// create slider	 
		input.before(root);	
		handle = root.addClass(conf.sliderClass).find("a").addClass(conf.handleClass);
		progress = root.find("div").addClass(conf.progressClass);  		   
		
		// get (HTML5) attributes into configuration
		$.each("min,max,step,value".split(","), function(i, key) {
			var val = input.attr(key);
			if (val || val === 0) {;
				conf[key] = parseFloat(val, 10);
			}
		});			   
		
		var range = conf.max - conf.min;
		
		/* replace build-in range element for cross browser consistency
			NOTE: input.attr("type", "text") throws exception by the browser */
			
		if (input[0].getAttribute("type") == 'range') {
			var tmp = $('<input/>')
				.attr("type", "text")
				.addClass(input.attr("className"))
				.attr("name", input.attr("name"))
				.attr("disabled", input.attr("disabled")).val(input.val());					
	
			input.replaceWith(tmp);
			input = tmp;
		}

		if (conf.hideInput) { input.hide(); }  
			 
		var fire = input.add(this);
		
		
		// flesh and bone of this tool 
		function seek(x, e) {  
			
			// fit inside the slider		
			x = Math.min(Math.max(0, x), len);			 
			
			// increment in steps
			if (conf.step) {
				x = toSteps(x, conf.step, len);	
			}
			
			// calculate value	
			var isClick = e && e.originalEvent && e.originalEvent.type == "click",
				 v = round(x / len * range + conf.min, conf.decimals);

			// onSlide
			if (value !== undefined && !isClick) {
				e = e || $.Event();
				e.type = "onSlide";           
				fire.trigger(e, [v]); 
				if (e.isDefaultPrevented()) { return self; }  
			}
			
			if (v != value)  { 
				
				// move handle & resize progress
				var speed = isClick ? conf.speed : 0,
					 fn = isClick ? function()  {
					 	e.type = "change";
					 	fire.trigger(e, [v]);
					 } : null;

				if (conf.vertical) {
					handle.animate({top: -(x - len)}, speed, fn);
					progress.animate({height: x}, speed);						
					
				} else {
					handle.animate({left: x}, speed, fn);
					progress.animate({width: x}, speed);	
				}
				
				value = v; 
				pos = x;			
				input.val(v);
			}  
			
			return self;
		}
		
		$.extend(self, {  
			
			setValue: function(val, e) {
				val = parseFloat(val);
				if (val === NaN || val == value) { return self; } 
				var x = (val - conf.min) * (len / range);	
				return seek(x, e);	 
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
		$.each("onSlide,change".split(","), function(i, name) {
				
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
		handle.bind("drag", function(e) {
			if (input.is(":disabled")) { return false; } 
			if (!origo) { init(); } 
			seek(conf.vertical ? origo - e.offsetY  : e.offsetX - origo, e); 
			
		}).bind("dragend", function(e) {
			if (!e.isDefaultPrevented()) {
				e.type = "change";
				fire.trigger(e, [value]);			
			}
			
		}).click(function(e) {
			return e.preventDefault();	 
		});		
		
		// clicking
		root.click(function(e) { 
			if (input.is(":disabled")) { return false; }				  
			var fix = handle.width() / 2; 
			if (!origo) { init(); }
			seek(conf.vertical ? origo - e.pageY + fix : e.pageX - origo - fix, e); 
		});

		
		input.blur(function(e) {			
			self.setValue($(this).val(), e); 
		});    
		
		function init() {
			if (conf.vertical) {
				len = dim(root, "height") - dim(handle, "height");
				origo = root.offset().top + len; 
				
			} else {
				len = dim(root, "width") - dim(handle, "width");
				origo = root.offset().left;	  
			} 	  
		}
		
		init();
		
		self.setValue(input.val() || conf.value || conf.min);
	}
		
	if (tool.conf.keyboard) {
		
		$(document).keydown(function(e) {
	
			var el = $(e.target), 
				 slider = el.data("slider") || current,
				 key = e.keyCode,
				 up = $([75, 76, 38, 33, 39]).index(e.keyCode) != -1,
				 down = $([74, 72, 40, 34, 37]).index(e.keyCode) != -1;

				 
			if ((up || down) && !(e.shiftKey || e.altKey) && slider) {
			
				// UP: 	k=75, l=76, up=38, pageup=33, right=39			
				if (up) {
					slider.step(e.ctrlKey || key == 33 ? 5 : 1, e);
					
				// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
				} else if (down) {
					slider.step(e.ctrlKey || key == 34 ? -5 : -1, e); 
				} 
				return e.preventDefault();
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
		
		
		// extend configuration with globals
		conf = $.extend({}, tool.conf, conf);		
		
		this.each(function() {				
			el = new Slider($(this), $.extend({}, conf));		 
			var input = el.getInput().data("slider", el);
			els = els ? els.add(input) : input;	
		});		
		
		return els; 
	};	
	
	
}) (jQuery);

