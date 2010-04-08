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
				
			var api = $(this).data("scrollable");			
			if (api) { ret = api; }
			
			// interval stuff
			var timer, hoverTimer, stopped = true;
	
			api.play = function() {
	
				// do not start additional timer if already exists
				if (timer) { return; }
				
				stopped = false;
				
				// construct new timer
				timer = setInterval(function() { 
					api.next();				
				}, opts.interval);
				
				api.next();
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
