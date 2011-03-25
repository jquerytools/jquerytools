/**
 * @license 
 * jQuery Tools @VERSION Scrollable - New wave UI design
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/scrollable.html
 *
 * Since: March 2008
 * Date: @DATE 
 */
(function($) { 

	// static constructs
	$.tools = $.tools || {version: '@VERSION'};
	
	$.tools.scrollable = {
		
		conf: {	
			transition: 'scroll',
			activeClass: 'active',
			circular: false,
			clonedClass: 'cloned',
			disabledClass: 'disabled',
			easing: 'swing',
			initialIndex: 0,
			item: null,
			items: '.items',
			keyboard: true,
			mousewheel: false,
			next: '.next',   
			prev: '.prev', 
			speed: 400,
			vertical: false,
			touch: true,
			wheelSpeed: 0
		} 
	};
					
	// get hidden element's width or height even though it's hidden
	function dim(el, key) {
		var v = parseInt(el.css(key), 10);
		if (v) { return v; }
		var s = el[0].currentStyle; 
		return s && s.width && parseInt(s.width, 10);	
	}

	function find(root, query) { 
		var el = $(query);
		return el.length < 2 ? el : root.parent().find(query);
	}
	
	var current;		
	
	// constructor
	function Scrollable(root, conf) {   
		// current instance
		var self = this, 
			 fire = root.add(self),
			 itemWrap = root.children(),
			 index = 0,
			 vertical = conf.vertical,
			 lastActiveItem = null;
				
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
				return itemWrap.find(conf.item).not("." + conf.clonedClass);	
			},

			// Adjusts the given index for circular loops (if circular is enabled).
			// We only need to adjust the index if circular is enabled and the transition is 'fade'.
			// When the transition is 'scroll', we don't want to adjust the index because we actually want to go *beyond* the last index to the cloned slide just beyond. Then it adjusts it to the true index in the onBeforeSeek callback.
			getCorrectedIndex: function(i) {
				if (conf.circular && conf.transition == 'fade')  {
					if (i < 0) {
						return self.getSize() - 1;
					} else if (i >= self.getSize()) {
						return 0;
					}
				} else {
				}
				return i;
			},
							
			move: function(offset, time) {
				return self.seekTo(self.getCorrectedIndex(index + offset), time);
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
				} else {
					itemWrap.children("." + conf.clonedClass + ":last").before(item);
					itemWrap.children("." + conf.clonedClass + ":first").replaceWith(item.clone().addClass(conf.clonedClass)); 						
				}
				
				fire.trigger("onAddItem", [item]);
				return self;
			},
			
			
			/* all seeking functions depend on this */		
			seekTo: function(i, time, fn) {	
				//console.debug("------------------------------------------------\nseekTo(", i, ")");
				
				// ensure numeric index
				if (!i.jquery) { i *= 1; }
				
				if (conf.transition == 'scroll') {
					// avoid seeking from end clone to the beginning
					if (conf.circular && i === 0 && index == -1 && time !== 0) { return self; }
				}
				
				// check that index is sane				
				if (!conf.circular && i < 0 || i > self.getSize() || i < -1) { return self; }

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

				index = i;
				current = self;  
				if (time === undefined) { time = conf.speed; }   
	
				if (conf.transition == 'scroll') {
					var props = vertical ? {top: -item.position().top} : {left: -item.position().left};  
					
					itemWrap.animate(props, time, conf.easing, fn || function() { 
						fire.trigger("onSeek", [i]);		
					});	 

				} else if (conf.transition == 'fade') {
					// Note: passing in easing is only possible in jQuery >= 1.4.3 
					if (lastActiveItem)
						lastActiveItem.fadeOut(time, conf.easing);
					item.    fadeIn(time, conf.easing, fn || function() { 
						fire.trigger("onSeek", [i]);		
					});	 
				}

				lastActiveItem = item;
				return self; 
			}					
			
		});
				
		// callbacks	
		$.each(['onBeforeSeek', 'onSeek', 'onAddItem'], function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).bind(name, conf[name]); 
			}
			
			self[name] = function(fn) {
				if (fn) { $(self).bind(name, fn); }
				return self;
			};
		});  

		if (conf.transition == 'fade') {
			self.getItems().each(function(i) {
				var item = $(this);
				item.css('z-index', String(self.getSize()-i)).
				     css('position', 'absolute').
				     hide();

			});
		}
		
		
		// circular loop
		if (conf.circular) {
			if (conf.transition == 'fade') {
				self.onBeforeSeek(function(e, i, time) {
					if (i == self.getSize()) {
						self.seekTo(self.getCorrectedIndex(i+1), time, function()  {
							self.begin(0);		
						});	
					}
				});
			} else {
				var clonedAtBegin = self.getItems().slice(-1).clone().prependTo(itemWrap);
				var clonedAtEnd   = self.getItems().eq(1).clone().appendTo(itemWrap);
					
				clonedAtBegin.add(clonedAtEnd).addClass(conf.clonedClass);

				self.onBeforeSeek(function(e, i, time) {
					if (e.isDefaultPrevented()) { return; }
					
					/*
						1. animate to the clone without event triggering
						2. when animation finishes, immediately seek to correct position with 0 speed (no visible transition)
					*/
					if (i == -1) {
						// Head to the cloned element on the left, then seek immediately to the end
						self.seekTo(clonedAtBegin, time, function()  {
							self.end(0);		
						});          
						return e.preventDefault();
						
					} else if (i == self.getSize()) {
						// Head to the cloned element on the right, then seek immediately to the beginning
						self.seekTo(clonedAtEnd, time, function()  {
							self.begin(0);		
						});	
					}
					
				});
			}
			
			// seek over the cloned item
			self.seekTo(conf.initialIndex, 0, function() {});
		}
		
		// next/prev buttons
		var prev = find(root, conf.prev).click(function() { self.prev(); }),
			 next = find(root, conf.next).click(function() { self.next(); });	
		
		if (!conf.circular && self.getSize() > 1) {
			
			self.onBeforeSeek(function(e, i) {
				setTimeout(function() {
					if (!e.isDefaultPrevented()) {
						prev.toggleClass(conf.disabledClass, i <= 0);
						next.toggleClass(conf.disabledClass, i >= self.getSize() -1);
					}
				}, 1);
			}); 
			
			if (!conf.initialIndex) {
				prev.addClass(conf.disabledClass);	
			}
		}
			
		// mousewheel support
		if (conf.mousewheel && $.fn.mousewheel) {
			root.mousewheel(function(e, delta)  {
				if (conf.mousewheel) {
					self.move(delta < 0 ? 1 : -1, conf.wheelSpeed || 50);
					return false;
				}
			});			
		}
		
		// touch event
		if (conf.touch) {
			var touch = {};
			
			itemWrap[0].ontouchstart = function(e) {
				var t = e.touches[0];
				touch.x = t.clientX;
				touch.y = t.clientY;
			};
			
			itemWrap[0].ontouchmove = function(e) {
				
				// only deal with one finger
				if (e.touches.length == 1 && !itemWrap.is(":animated")) {			
					var t = e.touches[0],
						 deltaX = touch.x - t.clientX,
						 deltaY = touch.y - t.clientY;
	
					self[vertical && deltaY > 0 || !vertical && deltaX > 0 ? 'next' : 'prev']();				
					e.preventDefault();
				}
			};
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
					return evt.preventDefault();
				}
				
				if (!vertical && (key == 37 || key == 39)) {					
					self.move(key == 37 ? -1 : 1);
					return evt.preventDefault();
				}	  
				
			});  
		}
		
		// initial index
		if (conf.initialIndex) {
			self.seekTo(conf.initialIndex, 0, function() {});
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
