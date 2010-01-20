/**
 * @license 
 * jQuery Tools @VERSION Slideshow - Extend it.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/tabs/slideshow.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: September 2009
 * Date: @DATE 
 */
(function($) {
	
	var t = $.tools.tabs; 
	
	var tool = t.slideshow = { 

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
	
	
	// jQuery plugin implementation
	$.fn.slideshow = function(conf) {
	
		var len = this.length, ret; 
		conf = $.extend({}, tool.conf, conf);		
		
		this.each(function() {
			
			var tabs = $(this), 
				 api = tabs.data("tabs"), 
				 $api = $(api);
				 
			if (api) { ret = api; }
			 
			function find(query) {
				return len == 1 ? $(query) : tabs.parent().find(query);	
			}	
			
			var nextButton = find(conf.next).click(function() {
				api.next();		
			});
			
			var prevButton = find(conf.prev).click(function() {
				api.prev();		
			});
			
			// interval stuff
			var timer, hoverTimer, startTimer, stopped = false;
	

			// extend the Tabs API with slideshow methods			
			$.extend(api, {
					
				play: function() {
		
					// do not start additional timer if already exists
					if (timer) { return; }
					
					// onBeforePlay
					var e = $.Event("onBeforePlay");
					$api.trigger(e);
					
					if (e.isDefaultPrevented()) { return api; }				
					
					stopped = false;
					
					// construct new timer
					timer = setInterval(api.next, conf.interval);
	
					// onPlay
					$api.trigger("onPlay");				
					
					api.next();
				},
			
				pause: function() {
					
					if (!timer) { return api; }
					
					// onBeforePause
					var e = $.Event("onBeforePause");
					$api.trigger(e);					
					if (e.isDefaultPrevented()) { return api; }		
					
					timer = clearInterval(timer);
					startTimer = clearInterval(startTimer);
					
					// onPause
					$api.trigger("onPause");		
				},
				
				// when stopped - mouseover won't restart 
				stop: function() {					
					api.pause();
					stopped = true;	
				}
				
			});
	
			// callbacks	
			$.each("onBeforePlay,onPlay,onBeforePause,onPause".split(","), function(i, name) {
					
				// configuration
				if ($.isFunction(conf[name]))  {
					self.bind(name, conf[name]);	
				}
				
				// API methods				
				api[name] = function(fn) {
					return api.bind("onPause", fn);
				};
			});	
			
		
			/* when mouse enters, slideshow stops */
			if (conf.autopause) {
				var els = api.getTabs().add(nextButton).add(prevButton).add(api.getPanes());
				
				els.hover(function() {					
					api.pause();					
					hoverTimer = clearInterval(hoverTimer);
					
				}, function() {
					if (!stopped) {						
						hoverTimer = setTimeout(api.play, conf.interval);						
					}
				});
			} 
			
			if (conf.autoplay) {
				startTimer = setTimeout(api.play, conf.interval);				
			} else {
				api.stop();	
			}
			
			if (conf.clickable) {
				api.getPanes().click(function()  {
					api.next();
				});
			} 
			
			// manage disabling of next/prev buttons
			if (!api.getConf().rotate) {
				
				var cls = conf.disabledClass;
				
				if (!api.getIndex()) {
					prevButton.addClass(cls);
				}
				api.onBeforeClick(function(e, i)  {
					if (!i) {
						prevButton.addClass(cls);
					} else {
						prevButton.removeClass(cls);	
					
						if (i == api.getTabs().length -1) {
							nextButton.addClass(cls);
						} else {
							nextButton.removeClass(cls);	
						}
					}
				});
			}
			
		});
		
		
		return conf.api ? ret : this;
	};
	
})(jQuery); 

