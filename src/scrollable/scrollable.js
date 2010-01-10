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
		
	// static constructs
	$.tools = $.tools || {};
	
	$.tools.scrollable = {
		
		conf: {
			
			// basics
			size: 5,
			vertical: false,
			speed: 400,
			keyboard: true,		
			
			// by default this is the same as size
			keyboardSteps: null, 
			
			// other
			disabledClass: 'disabled',
			hoverClass: null,		
			clickable: true,
			activeClass: 'active', 
			easing: 'swing',
			loop: false,
			
			items: '.items',
			item: null,
			
			// navigational elements			
			prev: '.prev',
			next: '.next',
			prevPage: '.prevPage',
			nextPage: '.nextPage',   
			api: false,
			
			// 1.2
			mousewheel: false,
			wheelSpeed: 0,
			lazyload: false
			
			// CALLBACKS: onBeforeSeek, onSeek, onReload
		} 
	};
				
	var current;		
	
	// constructor
	function Scrollable(root, conf) {   
		
		// current instance
		var self = this, $self = $(this),
			 horizontal = !conf.vertical,
			 wrap = root.children(),
			 index = 0,
			 forward;
				
		if (!current) { current = self; }
		
		// bind all callbacks from configuration
		$.each(conf, function(name, fn) {
			if ($.isFunction(fn)) { $self.bind(name, fn); }
		});
		
		if (wrap.length > 1) { wrap = $(conf.items, root); }
		
		// navigational items can be anywhere when globalNav = true
		function find(query) {
			var els = $(query);
			return conf.globalNav ? els : root.parent().find(query);	
		}
		
		// to be used by plugins
		root.data("finder", find);
		
		// get handle to navigational elements
		var prev = find(conf.prev),
			 next = find(conf.next),
			 prevPage = find(conf.prevPage),
			 nextPage = find(conf.nextPage);

		
		// methods
		$.extend(self, {
			
			getIndex: function() {
				return index;	
			},
			
			getClickIndex: function() {
				var items = self.getItems(); 
				return items.index(items.filter("." + conf.activeClass));	
			},
	
			getConf: function() {
				return conf;	
			},
			
			getSize: function() {
				return self.getItems().size();	
			},
	
			getPageAmount: function() {
				return Math.ceil(this.getSize() / conf.size); 	
			},
			
			getPageIndex: function() {
				return Math.ceil(index / conf.size);	
			},

			getNaviButtons: function() {
				return prev.add(next).add(prevPage).add(nextPage);	
			},
			
			getRoot: function() {
				return root;	
			},
			
			getItemWrap: function() {
				return wrap;	
			},
			
			getItems: function() {
				return wrap.children(conf.item);	
			},
			
			getVisibleItems: function() {
				return self.getItems().slice(index, index + conf.size);	
			},
			
			/* all seeking functions depend on this */		
			seekTo: function(i, time, fn) {

				if (i < 0) { i = 0; }				
				
				// nothing happens
				if (index === i) { return self; }				
				
				// function given as second argument
				if ($.isFunction(time)) {
					fn = time;
				}

				// seeking exceeds the end				 
				if (i > self.getSize() - conf.size) { 
					return conf.loop ? self.begin() : this.end(); 
				} 				

				var item = self.getItems().eq(i);					
				if (!item.length) { return self; }				
				
				// onBeforeSeek
				var e = $.Event("onBeforeSeek");

				$self.trigger(e, [i]);				
				if (e.isDefaultPrevented()) { return self; }				
				
				// get the (possibly altered) speed
				if (time === undefined || $.isFunction(time)) { time = conf.speed; }
				
				function callback() {
					if (fn) { fn.call(self, i); }
					$self.trigger("onSeek", [i]);
				}
				
				if (horizontal) {
					wrap.animate({left: -item.position().left}, time, conf.easing, callback);					
				} else {
					wrap.animate({top: -item.position().top}, time, conf.easing, callback);							
				}
				
				
				current = self;
				index = i;				
				
				// onStart
				e = $.Event("onStart");
				$self.trigger(e, [i]);				
				if (e.isDefaultPrevented()) { return self; }				
	
				
				/* default behaviour */
				
				// prev/next buttons disabled flags
				prev.add(prevPage).toggleClass(conf.disabledClass, i === 0);
				next.add(nextPage).toggleClass(conf.disabledClass, i >= self.getSize() - conf.size);
				
				return self; 
			},			
			
				
			move: function(offset, time, fn) {
				forward = offset > 0;
				return this.seekTo(index + offset, time, fn);
			},
			
			next: function(time, fn) {
				return this.move(1, time, fn);	
			},
			
			prev: function(time, fn) {
				return this.move(-1, time, fn);	
			},
			
			movePage: function(offset, time, fn) {
				forward = offset > 0;
				var steps = conf.size * offset;
				
				var i = index % conf.size;
				if (i > 0) {
				 	steps += (offset > 0 ? -i : conf.size - i);
				}
				
				return this.move(steps, time, fn);		
			},
			
			prevPage: function(time, fn) {
				return this.movePage(-1, time, fn);
			},  
	
			nextPage: function(time, fn) {
				return this.movePage(1, time, fn);
			},			
			
			setPage: function(page, time, fn) {
				return this.seekTo(page * conf.size, time, fn);
			},			
			
			begin: function(time, fn) {
				forward = false;
				return this.seekTo(0, time, fn);	
			},
			
			end: function(time, fn) {
				forward = true;
				var to = this.getSize() - conf.size;
				return to > 0 ? this.seekTo(to, time, fn) : self;	
			},
			
			reload: function() {				
				$self.trigger("onReload");
				return self;
			},			
			
			focus: function() {
				current = self;
				return self;
			},
			
			getLoader: function() {
				return loader;	
			},
			
			click: function(i) {
				
				var item = self.getItems().eq(i), 
					 klass = conf.activeClass,
					 size = conf.size;			
				
				// check that i is sane
				if (i < 0 || i >= self.getSize()) { return self; }
				
				// size == 1							
				if (size == 1) {
					if (conf.loop) { return self.next(); }
					
					if (i === 0 || i == self.getSize() -1)  { 
						forward = (forward === undefined) ? true : !forward;	 
					}
					return forward === false  ? self.prev() : self.next(); 
				} 
				
				// size == 2
				if (size == 2) {
					if (i == index) { i--; }
					self.getItems().removeClass(klass);
					item.addClass(klass);					
					return self.seekTo(i, time, fn);
				}				
		
				if (!item.hasClass(klass)) {				
					self.getItems().removeClass(klass);
					item.addClass(klass);
					var delta = Math.floor(size / 2);
					var to = i - delta;
		
					// next to last item must work
					if (to > self.getSize() - size) { 
						to = self.getSize() - size; 
					}
		
					if (to !== i) {
						return self.seekTo(to);		
					}
				}
				
				return self;
			},
			
			// bind / unbind
			bind: function(name, fn) {
				$self.bind(name, fn);
				return self;	
			},	
			
			unbind: function(name) {
				$self.unbind(name);
				return self;	
			}			
			
		});
		
		// callbacks	
		$.each("onBeforeSeek,onStart,onSeek,onReload".split(","), function(i, ev) {
			self[ev] = function(fn) {
				return self.bind(ev, fn);	
			};
		});  
			
			
		// prev button		
		prev.addClass(conf.disabledClass).click(function() {
			self.prev(); 
		});
		

		// next button
		next.click(function() { 
			self.next(); 
		});
		
		// prev page button
		nextPage.click(function() { 
			self.nextPage(); 
		});
		
		if (self.getSize() < conf.size) {
			next.add(nextPage).addClass(conf.disabledClass);	
		}
		

		// next page button
		prevPage.addClass(conf.disabledClass).click(function() { 
			self.prevPage(); 
		});		
		
		
		// hover
		var hc = conf.hoverClass, keyId = "keydown." + Math.random().toString().substring(10); 
			
		self.onReload(function() { 

			// hovering
			if (hc) {
				self.getItems().hover(function()  {
					$(this).addClass(hc);		
				}, function() {
					$(this).removeClass(hc);	
				});						
			}
			
			// clickable
			if (conf.clickable) {
				self.getItems().each(function(i) {
					$(this).unbind("click.scrollable").bind("click.scrollable", function(e) {
						if ($(e.target).is("a")) { return; }	
						return self.click(i);
					});
				});
			}				
			
			// keyboard			
			if (conf.keyboard) {				
				
				// keyboard works on one instance at the time. thus we need to unbind first
				$(document).unbind(keyId).bind(keyId, function(evt) {

					// do nothing with CTRL / ALT buttons
					if (evt.altKey || evt.ctrlKey) { return; }
					
					// do nothing for unstatic and unfocused instances
					if (conf.keyboard != 'static' && current != self) { return; }
					
					var s = conf.keyboardSteps;				
										
					if (horizontal && (evt.keyCode == 37 || evt.keyCode == 39)) {					
						self.move(evt.keyCode == 37 ? -s : s);
						return evt.preventDefault();
					}	
					
					if (!horizontal && (evt.keyCode == 38 || evt.keyCode == 40)) {
						self.move(evt.keyCode == 38 ? -s : s);
						return evt.preventDefault();
					}
					
					return true;
					
				});
				
			} else  {
				$(document).unbind(keyId);	
			}		
			
			
			// mousewheel support
			if (conf.mousewheel && $.fn.mousewheel) {
				root.mousewheel(function(e, delta)  {
					self.move(delta < 0 ? 1 : -1, conf.wheelSpeed || 50);
					return false;
				});			
			}

		}); 

		// lazyload support. all logic is here.
		var lconf = $.tools.lazyload && conf.lazyload, loader, lazies;
			 
		if (lconf) {
			lazies = lconf === true ? self.getItems() : root.find(lconf.select || lconf);
			
			if (typeof lconf != 'object') { lconf = {}; }
			
			$.extend(lconf, { growParent: root, api: true}, lconf); 
			loader = lazies.lazyload(lconf);
			
			function load(ev, i) {
				var els = self.getItems().slice(i, i + conf.size);
				
				els.each(function() {
					els = els.add($(this).find(":unloaded"));
				}); 
				loader.load(els);						
			} 
			self.onBeforeSeek(load);  
			load(null, 0);
		}
		
		self.reload();  
	} 

		
	// jQuery plugin implementation
	$.fn.scrollable = function(conf) { 
			
		// already constructed --> return API
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("scrollable");
		if (el) { return el; }		 
 
		var globals = $.extend({}, $.tools.scrollable.conf);
		conf = $.extend(globals, conf);
		
		conf.keyboardSteps = conf.keyboardSteps || conf.size;
		
		this.each(function() {			
			el = new Scrollable($(this), conf);
			$(this).data("scrollable", el);	
		});
		
		return conf.api ? el: this; 
		
	};
			
	
})(jQuery);
