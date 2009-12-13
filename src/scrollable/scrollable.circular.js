/* @license
 * scrollable.circular @VERSION - Not production ready yet.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/scrollable/circular.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: September 2009
 * Date: @DATE 
 */
(function($) {

	// version number
	var t = $.tools.scrollable; 
	t.plugins = t.plugins || {};
	
	t.plugins.circular = {
		version: '@VERSION', 
		conf: { 
			api: false,
			clonedClass: 'cloned'
		} 		
	};

	
	$.fn.circular = function(opts)  {
	
		var config = $.extend({}, t.plugins.circular.conf), ret;
		$.extend(config, opts);
		
		this.each(function() {			
 
			var api = $(this).scrollable(),
				 items = api.getItems(), 
				 conf = api.getConf(), 
				 wrap = api.getItemWrap(), 
				 index = 0;
				 
			if (api) { ret = api; }
				
			// too few items. no need for this plugin.
			if (items.length < conf.size) { return false; }
			

			// clone first visible elements and append them to the end			
			items.slice(0, conf.size).each(function(i) {
  				$(this).clone().appendTo(wrap).click(function()  {
					api.click(items.length + i);
					
				}).addClass(config.clonedClass);			
			});			
			
			// clone last set of elements to the beginning in reversed order
			var tail = $.makeArray(items.slice(-conf.size)).reverse();
			
  			$(tail).each(function(i) {
				$(this).clone().prependTo(wrap).click(function()  {
					api.click(-i -1);			
					
				}).addClass(config.clonedClass);				
			});
			
			var allItems = wrap.children(conf.item);
			
			
			// reset hovering for cloned items too
			var hc = conf.hoverClass;
			
			if (hc) {
				allItems.hover(function()  {
					$(this).addClass(hc);		
				}, function() {
					$(this).removeClass(hc);	
				});						
			}
		 
			// custom seeking function that does not trigger callbacks
			function seek(i) {
				
				var item = allItems.eq(i);
				
				if (conf.vertical) {						
					wrap.css({top: -item.position().top});
				} else {
					wrap.css({left: -item.position().left});							
				}					
			}
			
			// skip the clones at the beginning
			seek(conf.size);			

			// overridden scrollable API methods
			$.extend(api, {

				move: function(offset, time, fn, click) {  
					
					var to = index + offset + conf.size;				
					var exceed = to > api.getSize() - conf.size; 
					
					if (to <= 0 || exceed) {
						var fix = index + conf.size + (exceed ? -items.length : items.length);
						seek(fix);
						to = fix + offset;
					} 
					
					if (click) {
						allItems.removeClass(conf.activeClass)
							.eq(to + Math.floor(conf.size / 2)).addClass(conf.activeClass);
					}
					
					// nothing happens
					if (to === index + conf.size) { return self; }					

					return api.seekTo(to, time, fn);
				},			
				
				begin: function(time, fn) {
					return this.seekTo(conf.size, time, fn);	
				},
				
				end: function(time, fn) {				
					return this.seekTo(items.length, time, fn);	
				},
				
				click: function(i, time, fn) {		
					
					if (!conf.clickable) { return self; }
					if (conf.size == 1) { return this.next(); }
					
					var to = i - index, klass = conf.activeClass;				
					to -= Math.floor(conf.size / 2);				
					
					return this.move(to, time, fn, true);
				},
				
				getIndex: function() {
					return index;  
				},
				
				setPage: function(page, time, fn) {
					return this.seekTo(page * conf.size + conf.size, time, fn);	
				},
				
				getPageAmount: function()  {
					return Math.ceil(items.length / conf.size);		
				},
				
				getPageIndex: function()  {            	
					if (index < 0) { return this.getPageAmount() -1; }
					if (index >= items.length) { return 0; }
					var i = (index + conf.size) / conf.size -1;
					return i;
				},

				getVisibleItems: function() {
					var i = index + conf.size;
					return allItems.slice(i, i + conf.size);	
				} 
				
			});  
			
			// update index 
			api.onStart(function(e, i) {		
				index = i - conf.size;
				
				// navi buttons are never disabled
				return false;
			});				
			
			api.getNaviButtons().removeClass(conf.disabledClass);
			
				
		});
		
		return config.api ? ret : this;
		
	};

		
})(jQuery);
		
