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
			activeClass: 'active',
			circular: false,
			clonedClass: 'cloned',
			disabledClass: 'disabled',
			easing: 'swing',
			initialIndex: 0,
			item: '> *',
			items: '.items',
			keyboard: true,
			mousewheel: false,
			next: '.next',   
			prev: '.prev', 
			size: 1,
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
			 vertical = conf.vertical;
				
		if (!current) { current = self; } 
		if (itemWrap.length > 1) { itemWrap = $(conf.items, root); }
		
		
		// in this version circular not supported when size > 1
		if (conf.size > 1) { conf.circular = false; } 
		
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
							
			move: function(offset, time) {
				return self.seekTo(index + offset, time);
			},
			
			next: function(time) {
				return self.move(conf.size, time);	
			},
			
			prev: function(time) {
				return self.move(-conf.size, time);	
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
					next.removeClass("disabled");
					
				} else {
					itemWrap.children().last().before(item);
					itemWrap.children().first().replaceWith(item.clone().addClass(conf.clonedClass)); 						
				}
				
				fire.trigger("onAddItem", [item]);
				return self;
			},
			
			
			/* all seeking functions depend on this */		
			seekTo: function(i, time, fn) {	
				
				// ensure numeric index
				if (!i.jquery) { i *= 1; }
				
				// avoid seeking from end clone to the beginning
				if (conf.circular && i === 0 && index == -1 && time !== 0) { return self; }
				
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
	
				var props = vertical ? {top: -item.position().top} : {left: -item.position().left};  
				
				index = i;
				current = self;  
				if (time === undefined) { time = conf.speed; }   
				
				itemWrap.animate(props, time, conf.easing, fn || function() { 
					fire.trigger("onSeek", [i]);		
				});	 
				
				return self; 
			}					
			
		});
				
		// callbacks	
		$.each(['onBeforeSeek', 'onSeek', 'onAddItem'], function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).on(name, conf[name]); 
			}
			
			self[name] = function(fn) {
				if (fn) { $(self).on(name, fn); }
				return self;
			};
		});  
		
		// circular loop
		if (conf.circular) {
			
			var cloned1 = self.getItems().slice(-1).clone().prependTo(itemWrap),
				 cloned2 = self.getItems().eq(1).clone().appendTo(itemWrap);

			cloned1.add(cloned2).addClass(conf.clonedClass);
			
			self.onBeforeSeek(function(e, i, time) {
				
				if (e.isDefaultPrevented()) { return; }
				
				/*
					1. animate to the clone without event triggering
					2. seek to correct position with 0 speed
				*/
				if (i == -1) {
					self.seekTo(cloned1, time, function()  {
						self.end(0);		
					});          
					return e.preventDefault();
					
				} else if (i == self.getSize()) {
					self.seekTo(cloned2, time, function()  {
						self.begin(0);		
					});	
				}
				
			});

			// seek over the cloned item

			// if the scrollable is hidden the calculations for seekTo position
			// will be incorrect (eg, if the scrollable is inside an overlay).
			// ensure the elements are shown, calculate the correct position,
			// then re-hide the elements. This must be done synchronously to
			// prevent the hidden elements being shown to the user.

			// See: https://github.com/jquerytools/jquerytools/issues#issue/87

			var hidden_parents = root.parents().add(root).filter(function () {
				if ($(this).css('display') === 'none') {
					return true;
				}
			});
			if (hidden_parents.length) {
				hidden_parents.show();
				self.seekTo(0, 0, function() {});
				hidden_parents.hide();
			}
			else {
				self.seekTo(0, 0, function() {});
			}

		}
		
		// next/prev buttons
		var prev = find(root, conf.prev).click(function(e) { e.stopPropagation(); self.prev(); }),
			 next = find(root, conf.next).click(function(e) { e.stopPropagation(); self.next(); }); 
		
		if (!conf.circular) {
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
			
		if (self.getSize() < 2) {
			prev.add(next).addClass(conf.disabledClass);	
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
		if (conf.touch && ('ontouchstart' in document)) {
			var touch = {};
      // yes, you want a limit to not launch scrollable on tiny moves
      // this value can come from configuration, but I do not want to be too intrusive
      var touchMinDelta = conf.touchMinDelta || 25;
      
      // prototype this method if not exists
      if(!('identifiedTouch' in TouchList.prototype)) {
        TouchList.prototype.identifiedTouch = function( id ) {
          var i = this.length, t;
          while( i-- ) {
            t = this.item( i );
            // found, stop and return it
            if( t.identifier === id ) return t;
          }
          // not found
          return false;
        };
      }
			
			itemWrap[0].ontouchstart = function(e) {
        // at first, look if it is not a second touch
        if(!touch.id) {
          // we want the first touch that trigger the event
				  var t = e.changedTouches[0];
				  touch.id = t.identifier;
				  touch.x = t.clientX;
				  touch.y = t.clientY;
        }
			};
			
			itemWrap[0].ontouchmove = function(e) {
				
				// do the current touch still on contact
        // - first contact (registered)
        // - second contact (not regisetred)
        // - remove first contact (unregistred)
        // - move second contact
        // = will trigger a touchmove event from the second contact, but the 
        // first one is not available anymore
				if (touch.id && !itemWrap.is(":animated")) {
          // look if the current touch has trigger the event
          var t = e.changedTouches.identifiedTouch(touch.id);
          
          if (t) {
            // ok, we can do the job now
            // >0 from right to left, <0 from left to right
            var deltaX = touch.x - t.clientX;
            var absdeltaX = Math.abs( deltaX );
            // >0 from bottom to top, <0 from top to bottom
            var deltaY = touch.y - t.clientY;
            var absdeltaY = Math.abs( deltaY );
            
            // look for the biggest one to determine vertical or horizontal move
            if (absdeltaX > absdeltaY) {
              // horizontal move
              
              // if the scrollable is vertical, do not do anything
              if(vertical) return true;
              
              // prevent tiny move
              if(absdeltaX > touchMinDelta){
                // we are ok, we can process move
                // >0 from right to left: move right, next
                // <0 from left to right: move left, prev
                self[ deltaX > 0 ? 'next' : 'prev']();
                
                // reassign x/y
                touch.x = t.clientX;
                touch.y = t.clientY;
              }
              
              // prevent default, even on tiny moves
              e.preventDefault();
              
            } else if (absdeltaX < absdeltaY) {
              // vertical move
              
              // if the scrollable is not vertical, do not do anything
              if (!vertical) return true;
              
              // prevent tiny move
              if(absdeltaY > touchMinDelta){
                // we are ok, we can process move
                // >0 from bottom to top: move down, prev
                // <0 from top to bottom: move up, next
                self[ deltaY > 0 ? 'prev' : 'next']();
                
                // reassign x/y
                touch.x = t.clientX;
                touch.y = t.clientY;
              }
              
              // prevent default, even on tiny moves
              e.preventDefault();
              
            } else {
              // can be both
              if (vertical) {
                // consider vertical
                
                // prevent tiny move
                if(absdeltaY > touchMinDelta){
                  // we are ok, we can process move
                  // >0 from bottom to top: move down, prev
                  // <0 from top to bottom: move up, next
                  self[ deltaY > 0 ? 'prev' : 'next']();
                
                  // reassign x/y
                  touch.x = t.clientX;
                  touch.y = t.clientY;
                }

                // prevent default, even on tiny moves
                e.preventDefault();
              } else {
                // consider horizontal
                
                // prevent tiny move
                if(absdeltaX > touchMinDelta){
                  // we are ok, we can process move
                  // >0 from right to left: move right, next
                  // <0 from left to right: move left, prev
                  self[ deltaX > 0 ? 'next' : 'prev']();
                
                  // reassign x/y
                  touch.x = t.clientX;
                  touch.y = t.clientY;
                }

                // prevent default, even on tiny moves
                e.preventDefault();
              }
            }
          }
				}
			};
			
			itemWrap[0].ontouchend = function(e) {
        // do the current touch still on contact
				if (touch.id) {	
          // look if the current touch has trigger the event
          if(e.changedTouches.identifiedTouch(touch.id)) {
            // ok, unregister
            touch = {};
            // if there was a move, a touchmove should have 
            // been trigger before this event
          }
        }
      };
			
			itemWrap[0].ontouchcancel = function(e) {
        // do the current touch still on contact
				if (touch.id) {	
          // look if the current touch has trigger the event
          if(e.changedTouches.identifiedTouch(touch.id)) {
            // ok, unregister
            touch = {};
            // if there was a move, a touchmove should have 
            // been trigger before this event
          }
        }
      };
			
			itemWrap[0].ontouchleave = function(e) {
        // do the current touch still on contact
				if (touch.id) {	
          // look if the current touch has trigger the event
          if(e.changedTouches.identifiedTouch(touch.id)) {
            // ok, unregister
            touch = {};
            // if there was a move, a touchmove should have 
            // been trigger before this event
          }
        }
      };
      
		}
		
		if (conf.keyboard)  {
			
			$(document).on("keydown.scrollable", function(evt) {

				// skip certain conditions
				if (!conf.keyboard || evt.altKey || evt.ctrlKey || evt.metaKey || $(evt.target).is(":input")) { 
					return; 
				}
				
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
