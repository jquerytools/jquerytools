/**
 * @license 
 * jQuery Tools @VERSION / Overlay Apple effect. 
 * Commercial bling bling for all of us
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/overlay/apple.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: July 2009
 * Date: @DATE 
 */
(function($) { 

	// version number
	var t = $.tools.overlay; 
		
	// extend global configuragion with effect specific defaults
	$.extend(t.conf, { 
		start: { 
			absolute: true,
			top: null,
			left: null
		},
		
		fadeInSpeed: 'fast',
		zIndex: 9999
	});			
	
	// utility function
	function getPosition(el) {
		var p = el.offset();
		return [p.top + el.height() / 2, p.left + el.width() / 2]; 
	}
	
//{{{ load 

	var loadEffect = function(onLoad) {
		
		var overlay = this.getOverlay(),
			 opts = this.getConf(),
			 trigger = this.getTrigger(),
			 self = this,
			 oWidth = overlay.outerWidth({margin:true}),
			 img = overlay.data("img");  
		
		
		// growing image is required.
		if (!img) { 
			var bg = overlay.css("backgroundImage");
			
			if (!bg) { 
				throw "background-image CSS property not set for overlay"; 
			}
			
			// url("bg.jpg") --> bg.jpg
			bg = bg.substring(bg.indexOf("(") + 1, bg.indexOf(")")).replace(/\"/g, "");
			overlay.css("backgroundImage", "none");
			
			img = $('<img src="' + bg + '"/>');
			img.css({border:0,position:'absolute',display:'none'}).width(oWidth);			
			$('body').append(img); 
			overlay.data("img", img);
		}
		
		// initial top & left
		var w = $(window),
			 itop = opts.start.top || Math.round(w.height() / 2), 
			 ileft = opts.start.left || Math.round(w.width() / 2);
		
		if (trigger) {
			var p = getPosition(trigger);
			itop = p[0];
			ileft = p[1];
		} 
		
		// adjust positioning relative toverlay scrolling position
		if (!opts.start.absolute) {
			itop += w.scrollTop();
			ileft += w.scrollLeft();
		}
		
		// initialize background image and make it visible
		img.css({
			top: itop, 
			left: ileft,
			width: 0,
			zIndex: opts.zIndex
		}).show();
		
		// begin growing
		img.animate({
			top: overlay.css("top"), 
			left: overlay.css("left"), 
			width: oWidth}, opts.speed, function() { 

			// set close button and content over the image
			overlay.css("zIndex", opts.zIndex + 1).fadeIn(opts.fadeInSpeed, function()  { 
				
				if (self.isOpened() && !$(this).index(overlay)) {	
					onLoad.call(); 
				} else {
					overlay.hide();	
				} 
			});
		});
		
	};
//}}}
	
	
	var closeEffect = function(onClose) {

		// variables
		var overlay = this.getOverlay(), 
			 opts = this.getConf(),
			 trigger = this.getTrigger(),
			 top = opts.start.top,
			 left = opts.start.left;
		
		
		// hide overlay & closers
		overlay.hide();
		
		// trigger position
		if (trigger) {
			var p = getPosition(trigger);
			top = p[0];
			left = p[1];
		} 
		
		// shrink image		
		overlay.data("img").animate({top: top, left: left, width:0}, opts.closeSpeed, onClose);	
	};
	
	
	// add overlay effect	
	t.addEffect("apple", loadEffect, closeEffect); 
	
})(jQuery);	
		
