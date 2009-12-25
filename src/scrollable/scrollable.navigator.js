/**
 * @license 
 * jQuery Tools @VERSION / Scrollable Navigator
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/scrollable/navigator.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: September 2009
 * Date: @DATE 
 */
(function($) {
		
	var t = $.tools.scrollable; 
	t.plugins = t.plugins || {};
	
	t.plugins.navigator = {
		version: '@VERSION',
		
		conf: {
			navi: '.navi',
			naviItem: null,		
			activeClass: 'active',
			indexed: false,
			api: false,
			idPrefix: null,
			
			// 1.2
			history: false
		}
	};		
		
	// jQuery plugin implementation
	$.fn.navigator = function(conf) {

		var globals = $.extend({}, t.plugins.navigator.conf), ret;
		if (typeof conf == 'string') { conf = {navi: conf}; }
		
		conf = $.extend(globals, conf);
		
		this.each(function() {
			
			var api = $(this).scrollable(),
				 root = api.getRoot(), 
				 navi = root.data("finder").call(null, conf.navi), 
				 els = null, 
				 buttons = api.getNaviButtons();
			
			if (api) { ret = api; }
			
			api.getNaviButtons = function() {
				return buttons.add(navi);	
			}; 
				
			// generate new entries
			function reload() {
				
				if (!navi.children().length || navi.data("navi") == api) {
					
					navi.empty();
					navi.data("navi", api);
					
					for (var i = 0; i < api.getPageAmount(); i++) {		
						navi.append($("<" + (conf.naviItem || 'a') + "/>"));
					}
					
					els = navi.children().each(function(i) {
						var el = $(this).attr("href", "#" + i);
						
						el.click(function(e) {
							api.setPage(i);				
							if (!conf.history) {
								return e.preventDefault();		
							}							
						});
						
						// possible index number
						if (conf.indexed)  { el.text(i); }
						if (conf.idPrefix) { el.attr("id", conf.idPrefix + i); }
					});
					
					
				// assign onClick events to existing entries
				} else {
					
					// find a entries first -> syntaxically correct
					els = conf.naviItem ? navi.find(conf.naviItem) : navi.children();
					
					els.each(function(i)  {
						var el = $(this);
						
						el.click(function(evt) {
							api.setPage(i);
							return evt.preventDefault();						
						});
						
					});
				}
				
				// activate first entry
				els.eq(0).addClass(conf.activeClass); 
				
			}
			
			// activate correct entry
			api.onStart(function(e, index) {
				var cls = conf.activeClass;				
				els.removeClass(cls).eq(api.getPageIndex()).addClass(cls);
			});
			
			api.onReload(function() {
				reload();		
			});
			
			reload();			
			
			// look for correct navi item from location.hash
			var el = els.filter("[href=" + location.hash + "]");	
			if (el.length) { api.move(els.index(el)); }			
			
			
			// history support
			if (conf.history && $.fn.history) {

				// enable history support
				els.history(function(evt, hash) {
					els.eq(hash.replace("#", "")).click();		
				});	  
				
				// tab clicks perform their original action
				els.click(function(e) {
					location.hash = $(this).attr("href").replace("#", "");	
				});		 
			}
			
		});		
		
		return conf.api ? ret : this;
		
	};
	
})(jQuery);			
