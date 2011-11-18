/**
 * @license 
 * jQuery Tools @VERSION / Scrollable Navigator
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/scrollable/navigator.html
 *
 * Since: September 2009
 * Date: @DATE 
 */
(function($) {
		
	var t = $.tools.scrollable; 
	
	t.navigator = {
		
		conf: {
			navi: '.navi',
			naviItem: null,		
			activeClass: 'active',
			indexed: false,
			idPrefix: null,
	
			
			// 1.2
			history: false
		}
	};		
	
	function find(root, query) {
		var el = $(query);
		return el.length < 2 ? el : root.parent().find(query);
	}
	
	// jQuery plugin implementation
	$.fn.navigator = function(conf) {

		// configuration
		if (typeof conf == 'string') { conf = {navi: conf}; } 
		conf = $.extend({}, t.navigator.conf, conf);
		
		var ret;
		
		this.each(function() {
				
			var api = $(this).data("scrollable"),
				 navi = conf.navi.jquery ? conf.navi : find(api.getRoot(), conf.navi), 
				 buttons = api.getNaviButtons(),
				 cls = conf.activeClass,
				 history = conf.history && $.fn.history;

			// @deprecated stuff
			if (api) { ret = api; }
			
			api.getNaviButtons = function() {
				return buttons.add(navi);	
			}; 
			
			
			function doClick(el, i, e) {
				api.seekTo(i);				
				if (history) {
					if (location.hash) {
						location.hash = el.attr("href").replace("#", "");	
					}
				} else  {
					return e.preventDefault();			
				}
			}
			
			function els() {
				return navi.find('.navItem');	
			}

			
			function addItem(i) {  
							
				var item = $("<" + (conf.naviItem || 'a') + "/>").click(function(e)  {
					doClick($(this), i, e);
					
				}).attr("href", "#" + i).addClass('navItem');
				
				// index number / id attribute
				if (i === 0) {  item.addClass(cls); }
				if (conf.indexed)  { item.text(i + 1); }
				if (conf.idPrefix) { item.attr("id", conf.idPrefix + i); } 
				
				if(i==1 || i==api.getSize()-1){
					$("<" + (conf.naviItem) + "/>").addClass('points').appendTo(navi).text("…").hide();
				}
				
				return item.appendTo(navi);
			}
			
			function makeCoolPagination(){
				
				// hide points
				navi.find('.points').hide();
				
				els().each(function(i,elm) { 
					if(i==0 || i==api.getSize()-1){
						// für den ersten und letzten
						$(elm).show();
					} else {
						if(Math.abs(i-api.getIndex())<2){
							$(elm).show();
						} else {
							$(elm).hide();
							
						}
					}
					if(api.getIndex()>2){
						navi.find('.points:first').show();
					}
					if(api.getSize()-api.getIndex()>3){
						navi.find('.points:last').show();
					}
					
				});
				
				
			}

			
			// generate navigator
			if (els().length) {
				els().each(function(i) { 
					$(this).click(function(e)  {
						doClick($(this), i, e);		
					});
				});
				
			} else {
				$.each(api.getItems(), function(i) {
					addItem(i); 
				});
			}   
			
			// Make cool pagination
			makeCoolPagination();
		
			// activate correct entry
			api.onBeforeSeek(function(e, index) {
				setTimeout(function() {
					if (!e.isDefaultPrevented()) {
						makeCoolPagination();
						var el = els().eq(index);
						if (!e.isDefaultPrevented() && el.length) {			
							els().removeClass(cls).eq(index).addClass(cls);
						}
					}
				}, 1);
			}); 
			
			function doHistory(evt, hash) {
				var el = els().eq(hash.replace("#", ""));
				if (!el.length) {
					el = els().filter("[href=" + hash + "]");	
				}
				el.click();		
			}
			
			// new item being added
			api.onAddItem(function(e, item) {
				item = addItem(api.getItems().index(item)); 
				if (history)  { item.history(doHistory); }
			});
			
			if (history) { els().history(doHistory); }
			
		});		
		
		return conf.api ? ret : this;
		
	};
	
})(jQuery);	