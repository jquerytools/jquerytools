/*!
 * jQuery TOOLS plugin :: scrollable.autoscroll @VERSION
 * 
 * Copyright (c) 2009 Tero Piirainen
 * http://flowplayer.org/tools/scrollable.html#autoscroll
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Launch  : September 2009
 * Date: @DATE
 * Revision: @REVISION 
 */
(function($) {		

	var t = $.tools.scrollable; 
	t.plugins = t.plugins || {};
	
	t.plugins.autoscroll = {
		version: '@VERSION',
		
		conf: {
			autoplay: true,
			interval: 3000,
			autopause: true,
			steps: 1,
			api: false
		}
	};	
	
	// jQuery plugin implementation
	$.fn.autoscroll = function(conf) { 

		if (typeof conf == 'number') {
			conf = {interval: conf};	
		}
		
		var opts = $.extend({}, t.plugins.autoscroll.conf), ret;
		$.extend(opts, conf);   	
		
		this.each(function() {		
				
			var api = $(this).scrollable();			
			if (api) { ret = api; }
			
			// interval stuff
			var timer, hoverTimer, stopped = true;
	
			api.play = function() {
	
				// do not start additional timer if already exists
				if (timer) { return; }
				
				stopped = false;
				
				// construct new timer
				timer = setInterval(function() { 
					api.move(opts.steps);				
				}, opts.interval);
				
				api.move(opts.steps);
			};	

			api.pause = function() {
				timer = clearInterval(timer);	
			};
			
			// when stopped - mouseover won't restart 
			api.stop = function() {
				api.pause();
				stopped = true;	
			};
		
			/* when mouse enters, autoscroll stops */
			if (opts.autopause) {
				api.getRoot().add(api.getNaviButtons()).hover(function() {			
					api.pause();
					clearInterval(hoverTimer);
					
				}, function() {
					if (!stopped) {						
						hoverTimer = setTimeout(api.play, opts.interval);						
					}
				});
			}			
			
			if (opts.autoplay) {
				setTimeout(api.play, opts.interval);				
			}

		});
		
		return opts.api ? ret : this;
		
	}; 
	
})(jQuery);		
