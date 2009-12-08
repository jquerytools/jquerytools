/*!
 * jQuery TOOLS plugin :: tabs.history @VERSION
 * 
 * Copyright (c) 2009 Tero Piirainen
 * http://flowplayer.org/tools/tabs.html#history
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Launch  : September 2009
 * Date: @DATE
 * Revision: @REVISION 
 */
(function($) {
	
	$.tools = $.tools || {};
	var t = $.tools.util = $.tools.util || {};
	
	var tool = t.history = { 
		version: '@VERSION'
	};
		
	var hash, iframe;		

	function setIframe(h) {
		if (h) {
			var doc = iframe.contentWindow.document;
			doc.open().close();	
			doc.location.hash = h;
		}
	}
	
	// jQuery plugin implementation
	$.fn.history = function(fn) {
			
		var el = this;
		
		// IE
		if ($.browser.msie && $.browser.version < '8') {
			
			// create iframe that is constantly checked for hash changes
			if (!iframe) {
				iframe = $("<iframe/>").attr("src", "javascript:false;").hide().get(0);
				$("body").append(iframe);
								
				setInterval(function() {
					var idoc = iframe.contentWindow.document, 
						 h = idoc.location.hash;
				
					if (hash !== h) {						
						$.event.trigger("hash", h);
						hash = h;
					}
				}, 100);
				
				setIframe(location.hash || '#');
			}
			
			// when link is clicked the iframe hash updated
			el.bind("click.hash", function(e) {
				setIframe($(this).attr("href"));
			}); 

			
		// other browsers scans for location.hash changes directly without iframe hack
		} else { 
			setInterval(function() {
				var h = location.hash;
				var els = el.filter("[href$=" + h + "]");
				
				if (!els.length) { 
					h = h.replace("#", "");
					els = el.filter("[href$=" + h + "]");
				}
				
				if (els.length && h !== hash) {
					hash = h;
					$.event.trigger("hash", h);
				}						
			}, 100);
		}
		 
		// bind a history listener
		$(window).bind("hash", fn);
		
		// return jQuery
		return this;		
	};	
		
})(jQuery); 

