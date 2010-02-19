/**
 * @license 
 * jQuery Tools @VERSION Rangeinput - HTML5 <input type="range" /> for humans
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/rangeinput/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
(function($) {
	 
	$.tools = $.tools || {version: '@VERSION'};
	 
	var tool;
	
	tool = $.tools.rangeinput = {
		
		conf: {
			min: 0,
			max: 100,
			step: 0, 	// Specifies the value granularity of the element's value (onSlide callbacks)
			value: 0,			
			accuracy: 0,
			vertical: false,
			keyboard: true,
			progress: false,
			
			
			hideInput: false, 
			speed: 200,
			
			// set to null if not needed
			css: {
				input:		'range',
				slider: 		'slider',
				progress: 	'progress',
				handle: 		'handle'					
			}

		} 
	};
	
//{{{ fn.drag
		
	/* 
		Full featured drag and drop implementation in 35 lines (0.4 kb minified). 
		Who told that drag and drop is rocket science? Find your way. Example:
		
		$(".myelement").drag({y: false}).bind("drag", function(event, x, y) {
			// do your custom thing
		});
		 
		Configuration: x (enable horizontal), y (enable vertical), drag (perform drag) 
		Tree events: dragStart, drag, dragEnd. 
	*/
	var doc, draggable;
	
	$.fn.drag = function(conf) {
		
		conf = $.extend({x: true, y: true, drag: true}, conf);
	
		doc = doc || $(document).bind("mousedown mouseup", function(e) {
				
			var el = $(e.target); 
			
			// start 
			if (e.type == "mousedown" && el.data("drag")) {
				
				var offset = el.position(),
					 x0 = e.pageX - offset.left, 
					 y0 = e.pageY - offset.top,
					 start = true;    
				
				doc.bind("mousemove.drag", function(e) {  
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
				if (draggable) {  
					draggable.trigger("dragEnd");  
				}
				doc.unbind("mousemove.drag");
				draggable = null; 
			} 
							
		});
		
		return this.data("drag", true); 
	};	

//}}}
	

	function toSteps(value, size, max) {
		var step = max / size;
		return Math.round(value / step) * step;		
	}
	
	function round(value, accuracy) {
		var n = Math.pow(10, accuracy);
		return Math.round(value * n) / n;
	}
	
	function dim(el, key) {
		return parseInt(el.css(key), 10);	
	}
	
	function hasEvent(el) {
		var e = el.data("events");
		return e && e.onSlide;
	}
	
	function Range(input, conf) {
		
		// private variables
		var self = this,  
			 css = conf.css,
			 
			 root = $("<div><div/><a href='#'/></div>").data("rangeinput", self),	 
			 value,			// current value
			 origo,			// handle's start point
			 len,				// length of the range
			 pos,				// current position of the handle
			 progress,		// progressbar
			 handle;			// drag handle 
			 
		// create range	 
		input.before(root);	
		handle = root.addClass(css.slider).find("a").addClass(css.handle);
		progress = root.find("div").addClass(css.progress);  		   
		
		// get (HTML5) attributes into configuration
		$.each("min,max,step,value".split(","), function(i, key) {
			var val = input.attr(key);
			if (val || val === 0) {
				conf[key] = parseFloat(val, 10);
			}
		});			   
		
		var range = conf.max - conf.min;
		
		// Replace built-in date input: NOTE: input.attr("type", "text") throws exception by the browser
		if (input[0].getAttribute("type") == 'range') {
			var tmp = input.clone().attr("type", "text").addClass(css.input);
			input.replaceWith(tmp);
			input = tmp;
		}

		if (conf.hideInput) { input.hide(); }  
			 
		var fire = $(self).add(input), fireOnSlide;

		
		// flesh and bone of this tool 
		function seek(x, e) {  
			
			var v = 0, isClick = false;
			
			// fit inside the range		
			x = Math.min(Math.max(0, x), len);			 
 
			// increment in steps
			if (conf.step) {
				x = toSteps(x, conf.step, len);	
			}
			
			// calculate value	
			var isClick = e && e.originalEvent && e.originalEvent.type == "click",
				 v = round(x / len * range + conf.min, conf.accuracy);

			if (v != value)  { 
		
				// onSlide
				if (fireOnSlide && value !== undefined && !isClick) {
					e = e || $.Event();
					e.type = "onSlide";           
					fire.trigger(e, [v]); 
					if (e.isDefaultPrevented()) { return self; }  
				}				
				
				// move handle & resize progress
				var speed = isClick ? conf.speed : 0,
					 fn = isClick ? function()  {
					 	e.type = "change";
					 	fire.trigger(e, [v]);
					 } : null;

				if (conf.vertical) {
					handle.animate({top: -(x - len)}, speed, fn);
					if (conf.progress) { progress.animate({height: x}, speed);	}				
					
				} else {
					handle.animate({left: x}, speed, fn);
					if (conf.progress) { progress.animate({width: x}, speed); }
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
				if (isNaN(val) || val == value) { return self; } 
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
				if (conf.max <= 1)  { am /= 10; } 
				
				// step size should
				var step = conf.step && range / conf.step;
				if (step && Math.abs(am) < step) {
					am = am < 0 ? -step : step;	
				}
				
				return self.setValue(value + am);
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
		handle.drag({drag: false}).bind("dragStart", function() {
		
			/* do some pre- calculations for seek() function. improves performance */
			
			// avoid redundant event triggering (= heavy stuff)
			fireOnSlide = hasEvent($(self)) || hasEvent(input);

				
		}).bind("drag", function(e, y, x) {        
				
			if (input.is(":disabled")) { return false; } 
			seek(conf.vertical ? y : x, e); 
			
		}).bind("dragEnd", function(e) {
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
			seek(conf.vertical ? e.pageY + fix : e.pageX - origo - fix, e); 
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
				 range = el.data("rangeinput"),
				 key = e.keyCode,
				 up = $([75, 76, 38, 33, 39]).index(e.keyCode) != -1,
				 down = $([74, 72, 40, 34, 37]).index(e.keyCode) != -1;
				 
			if ((up || down) && !(e.shiftKey || e.altKey || e.ctrlKey) && range) {
			
				// UP: 	k=75, l=76, up=38, pageup=33, right=39			
				if (up) {
					range.step(key == 33 ? 10 : 1, e);
					
				// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
				} else if (down) {
					range.step(key == 34 ? -10 : -1, e); 
				} 
				return e.preventDefault();
			} 
		});
	}
	
	$.expr[':'].range = function(el) {
		var type = el.getAttribute("type");
		return type && type == 'range' || !!$(el).filter("input").data("rangeinput");
	};
	
	
	// jQuery plugin implementation
	$.fn.rangeinput = function(conf) {

		// return existing instance
		var el = this.data("rangeinput"), els;
		if (el) { return el; }
		
		
		// extend configuration with globals
		conf = $.extend(true, {}, tool.conf, conf);		
		
		this.each(function() {				
			el = new Range($(this), $.extend(true, {}, conf));		 
			var input = el.getInput().data("rangeinput", el);
			els = els ? els.add(input) : input;	
		});		
		
		return els ? els : this; 
	};	
	
	
}) (jQuery);

