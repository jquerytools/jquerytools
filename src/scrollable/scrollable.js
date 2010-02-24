/**
 * @license 
 * jQuery Tools @VERSION Scrollable - New wave UI design
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/scrollable.html
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: March 2008
 * Date: @DATE 
 */
(function($) { 
		
	/* 
		ADDED
			- freedom in "page design"
			- no reloading
			- variable size pages, items
			- circular no longer in beta!
			- history in navigator
			- live adding of new items
			- addItem() for circulared instances, onAddItem event
			- you've got all these new goodies in 40% less file size!
			- dynamic altering of configuration (clickable, mousewheel, circular)
			
		REMOVED: 
			size, item, hoverClass, keyboardSteps, nextPage, prevPage 
			getClickIndex(), getPageXXX() 
	*/
	
	// static constructs
	$.tools = $.tools || {version: '@VERSION'};
	
	$.tools.scrollable = {
		
		conf: {	
			activeClass: 'active', 
			clonedClass: 'cloned',
			disabledClass: 'disabled',
			easing: 'swing',
			item: null,
			items: '.items',
			keyboard: false,
			lazyload: false,
			circular: false,
			mousewheel: false,
			next: '.next',   
			prev: '.prev', 
			speed: 400,
			vertical: false,
			wheelSpeed: 0
		} 
	};
				
	var current;		
	
	// constructor
	function Scrollable(root, conf) {   
		
		// current instance
		var self = this, 
			 fire = root.add(self),
			 itemWrap = root.children(),
			 index = 0,
			 forward,
			 vertical;
				
		if (!current) { current = self; } 
		if (itemWrap.length > 1) { itemWrap = $(conf.items, root); }
		
		// methods
		$.extend(self, {
				
			getConf: function() {
				return conf;	
			},			
			
			getIndex: function() {
				return index;	
			}, 

			getSize: function() {
				return self.getItems().size();	
			},

			getNaviButtons: function() {
				return prev.add(next);	
			},
			
			getRoot: function() {
				return root;	
			},
			
			getItemWrap: function() {
				return itemWrap;	
			},
			
			getItems: function() {
				return itemWrap.children(conf.item).not("." + conf.clonedClass);	
			},
							
			move: function(offset, time) {
				return self.seekTo(index + offset, time);
			},
			
			next: function(time) {
				return self.move(1, time);	
			},
			
			prev: function(time) {
				return self.move(-1, time);	
			},
			
			begin: function(time) {
				return self.seekTo(0, time);	
			},
			
			end: function(time) {
				return self.seekTo(self.getSize() -1, time);	
			},	
			
			focus: function() {
				current = self;
				return self;
			},
			
			addItem: function(item) {
				item = $(item);
				if (!conf.circular)  {
					itemWrap.append(item);
					return self;
				} 
				
				$(".cloned:last").before(item);
				$(".cloned:first").replaceWith(item.clone().addClass(conf.clonedClass)); 
				
				fire.trigger("onAddItem", [item]);
			},
			
			
			/* all seeking functions depend on this */		
			seekTo: function(i, time, fn) {				
				
				var item = i;
				
				if (i.jquery) {
					i = self.getItems().index(i);	
				} else {
					item = self.getItems().eq(i);
				}
				
				// onBeforeSeek
				var e = $.Event("onBeforeSeek"); 
				if (!fn) {
					fire.trigger(e, [i, time]);				
					if (e.isDefaultPrevented() || !item.length) { return self; }			
				}  
	
				var props = vertical ? {top: -item.position().top} : {left: -item.position().left}; 
				
				itemWrap.animate(props, time, conf.easing, fn || function() {
					fire.trigger("onSeek", [i]);		
				});	
				
				current = self;
				index = i;
				
				return self; 
			}					
			
		});
				
		// callbacks	
		$.each("onBeforeSeek,onSeek,onAddItem".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).bind(name, conf[name]); 
			}
			
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});  
		
		// circular loop
		if (conf.circular) {
			
			var cloned1 = self.getItems().slice(-1).clone().prependTo(itemWrap),
				 cloned2 = self.getItems().eq(1).clone().appendTo(itemWrap);
				
			cloned1.add(cloned2).addClass(conf.clonedClass);
			
			self.seekTo(0, 0, true).onBeforeSeek(function(e, i, time) { 
				
				if (e.isDefaultPrevented()) { return; }
				
				/*
					1. animate to the clone without event triggering
					2. seek to correct position with 0 speed
				*/
				if (i == -1) {
					self.seekTo(cloned1, time, function()  {
						self.end(0);		
					});                        
					
				} else if (i == self.getSize()) {
					self.seekTo(cloned2, time, function()  {
						self.begin(0);		
					});	
				}
				
			});
		}  
		
		// next/prev buttons
		var prev = root.parent().find(conf.prev).click(function() { self.prev(); }),
			 next = root.parent().find(conf.next).click(function() { self.next(); });	
		
		prev.toggleClass(conf.disabledClass, !conf.circular);
		next.toggleClass(conf.disabledClass, self.getSize() < 2);
			 
			
		// mousewheel support
		if (conf.mousewheel && $.fn.mousewheel) {
			root.mousewheel(function(e, delta)  {
				if (conf.mousewheel) {
					self.move(delta < 0 ? 1 : -1, conf.wheelSpeed || 50);
					return false;
				}
			});			
		}
		
		if (conf.clickable) {
			root.click(function()  {
				if (conf.clickable) {
					self.next();		
				}
			});
		}
		
		if (conf.keyboard)  {
			
			$(document).bind("keydown.scrollable", function(evt) {

				// skip certain conditions
				if (!conf.keyboard || evt.altKey || evt.ctrlKey || $(evt.target).is(":input")) { return; }
				
				// does this instance have focus?
				if (conf.keyboard != 'static' && current != self) { return; }
					
				var key = evt.keyCode;
			
				if (vertical && (key == 38 || key == 40)) {
					self.move(key == 38 ? -1 : 1);
				}
				
				if (!vertical && (key == 37 || key == 39)) {					
					self.move(key == 37 ? -1 : 1);
				}	  
				
				if (key > 36 && key < 41) { return evt.preventDefault(); }
				
			}); 
			
		}
		
		// lazyload support. all logic is here.
		var lconf = $.tools.lazyload && conf.lazyload, loader;
		
		if (lconf) {
		
			// lazyload configuration
			if (typeof lconf != 'object') { lconf = { select: lconf }; }
			if (typeof lconf.select != 'string') { lconf.select = "img, :backgroundImage"; }
			
			// initialize lazyload
			loader = root.find(lconf.select).lazyload(lconf).data("lazyload");
			
			function doLoad(ev, i)  {
				loader.load(self.getItems().eq(i).find(":unloaded").andSelf());
			}
			
			self.onBeforeSeek(doLoad);
			doLoad(null, 0);
		}		
		
	} 

		
	// jQuery plugin implementation
	$.fn.scrollable = function(conf) { 
			
		// already constructed --> return API
		var el = this.data("scrollable");
		if (el) { return el; }		 

		conf = $.extend({}, $.tools.scrollable.conf, conf); 
		
		this.each(function() {			
			el = new Scrollable($(this), conf);
			$(this).data("scrollable", el);	
		});
		
		return conf.api ? el: this; 
		
	};
			
	
})(jQuery);
