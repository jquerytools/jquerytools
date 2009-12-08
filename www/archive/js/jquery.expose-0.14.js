/**
 * jquery.expose 0.14. Make HTML elements stand out.
 * 
 * http://flowplayer.org/tools/expose.html
 *
 * Copyright (c) 2008 Tero Piirainen (support@flowplayer.org)
 *
 * Released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * >> Basically you can do anything you want but leave this header as is <<
 *
 * Since  : 0.10 - 10/06/2008
 * Version: 0.14 - Fri Nov 07 2008 16:51:35 GMT-0000 (GMT+00:00)
 */
(function($) { 
	
	function expose(el, params) { 
		
		var opts = {
			speed: 1000,
			zIndex: 1,
			opacity: 0.8,
			color:'#333',
			onClose: null
		};
		
		$.extend(opts, params);
		
		/* 
			create the fading "blanket" that sits on top of the document
			CSS settings for this are given in external stylesheet
		*/
		var blanket = $("#blanket");
		
		if (blanket.is(":visible")) {
			return;	
		}
		
		if (!blanket.length) {
			blanket = $('<div id="blanket"></div>').css({				
				position:'absolute', top:0, left:0,
				width:'100%',
				height:$(document).height(),
				display:'none'
			}).css("opacity", 0);
			
			$("body").append(blanket);	
		} 
		
		// these can vary from time to time
		blanket.css({
			backgroundColor:opts.color,
			zIndex:opts.zIndex	
		});
		
		// make given element sit on top of the blanket
		el.css({zIndex:opts.zIndex + 1});
		if (!/relative|absolute/i.test(el.css("position"))) {
			el.css("position", "relative");		
		}		 
		 
		// reveal blanket
		blanket.css("display", "block").fadeTo(opts.speed, opts.opacity);		
		

		function unexpose(fn) {			
			
			if (opts.onClose || fn) {
				if (!fn || fn.target) { fn = opts.onClose; }
				if (fn) { fn.call(el); }	
			}
			
			blanket.fadeTo(opts.speed, 0, function() {
				blanket.hide();
				el.css({zIndex:opts.zIndex -1});
			});				
			
			blanket.unbind("click.unexpose");
		}
		
		// esc button "unexposes"
		$(document).bind("keypress.unexpose", function(evt) {
			if (evt.keyCode == 27) {
				 unexpose();
				 $(document).unbind("keypress.unexpose");
			}
		});	
		
		blanket.bind("click.unexpose", unexpose);		
		$.unexpose = unexpose; 	
		
	}
	
	
	// jQuery plugin initialization
	$.fn.expose = function(params) {    
		expose(this, params);		
		return this; 
	}; 
	

})(jQuery);
