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
			 hoverTimer, 
			 startTimer, 
			 stopped = false;
		
			 
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
				if (timer) { return; }
				
				// onBeforePlay
				var e = $.Event("onBeforePlay");
				fire.trigger(e);
				
				if (e.isDefaultPrevented()) { return self; }				
				
				stopped = false;
				
				// construct new timer
				timer = setInterval(tabs.next, conf.interval);

				// onPlay
				fire.trigger("onPlay");				
				
				tabs.next();
			},
		
			pause: function() {
				
				if (!timer) { return self; }
				
				// onBeforePause
				var e = $.Event("onBeforePause");
				fire.trigger(e);					
				if (e.isDefaultPrevented()) { return self; }		
				
				timer = clearInterval(timer);
				startTimer = clearInterval(startTimer);
				
				// onPause
				fire.trigger("onPause");		
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
				self.bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				return self.bind(name, fn);
			};
		});	
		
	
		/* when mouse enters, slideshow stops */
		if (conf.autopause) {
			var els = tabs.getTabs().add(nextButton).add(prevButton).add(tabs.getPanes());
			
			els.hover(function() {					
				self.pause();					
				hoverTimer = clearInterval(hoverTimer);
				
			}, function() {
				if (!stopped) {						
					hoverTimer = setTimeout(self.play, conf.interval);						
				}
			});
		} 
		
		if (conf.autoplay) {
			startTimer = setTimeout(self.play, conf.interval);				
		} else {
			self.stop();	
		}
		
		if (conf.clickable) {
			tabs.getPanes().click(function()  {
				tabs.next();
			});
		} 
		
		// manage disabling of next/prev buttons
		if (!tabs.getConf().rotate) {
			
			var cls = conf.disabledClass;
			
			if (!tabs.getIndex()) {
				prevButton.addClass(cls);
			}
			tabs.onBeforeClick(function(e, i)  {
				if (!i) {
					prevButton.addClass(cls);
				} else {
					prevButton.removeClass(cls);	
				
					if (i == tabs.getTabs().length -1) {
						nextButton.addClass(cls);
					} else {
						nextButton.removeClass(cls);	
					}
				}
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

