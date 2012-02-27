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
				
			var api = $(this).data("scrollable"),
			    root = api.getRoot(),
			    // interval stuff
    			timer, stopped = false;

	    /**
      *
      *   Function to run autoscroll through event binding rather than setInterval
      *   Fixes this bug: http://flowplayer.org/tools/forum/25/72029
      */
      function scroll(){        
      	// Fixes https://github.com/jquerytools/jquerytools/issues/591
        if (timer) clearTimeout(timer); // reset timeout, especially for onSeek event
        timer = setTimeout(function(){
          api.next();
        }, opts.interval);
      }
			    
			if (api) { ret = api; }
			
			api.play = function() { 
				
				// do not start additional timer if already exists
				if (timer) { return; }
				
				stopped = false;
				root.on('onSeek', scroll);
				scroll();
			};	

			api.pause = function() {
				timer = clearTimeout(timer);  // clear any queued items immediately
				root.off('onSeek', scroll);
			};
			
			// resume playing if not stopped
			api.resume = function() {
				stopped || api.play();
			};
			
			// when stopped - mouseover won't restart 
			api.stop = function() {
			  stopped = true;
				api.pause();
			};
		
			/* when mouse enters, autoscroll stops */
			if (opts.autopause) {
				root.add(api.getNaviButtons()).hover(api.pause, api.resume);
			}
			
			if (opts.autoplay) {
				api.play();				
			}

		});
		
		return opts.api ? ret : this;
		
	}; 
	
})(jQuery);		
