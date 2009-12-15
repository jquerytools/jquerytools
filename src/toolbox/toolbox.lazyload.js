/**
 * @license 
 * toolbox.mask @VERSION - We need a faster web
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/toolbox/lazyload.html
 * 
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: jQuery Tools 1.2.0 (Mar 2010)
 * Date: @DATE 
 */
 

/* --- TODO ---		
	get rid of flash effects
	sizing: padding / margins
	proper progress behaviour
	recursive load + class names
	grow --> growParent	
*/
(function($) {

	$.tools = $.tools || {};
	 
	var tool = $.tools.lazyload = {
		
		version: '@VERSION',
		
		conf: {
			css: {
				before: 'lazy',
				loading: 'loading',
				after: null,
				progress: 'progress'
			},
			
			effect: 'show',
			fadeInSpeed: 'normal',			
			growSpeed: 'slow',
			grow: '.grow',			
			progress: 'Loading',
			loadOnScroll: false 
		},
		
		addLoader: function(matcher, initFn, loadFn) {			
			var loader = loadFn ? [initFn, loadFn] : [null, initFn];
			loaders[matcher] = loader;	
		},
		
		addEffect: function(name, fn) {			
			effects[name] = fn;	
		}
		
	}, effects = {		

		show: function(el, done) {
			el.hide().css({visibility: 'visible'}).fadeIn(this.getConf().fadeInSpeed, done);
		},

		/*
			we need two things: 
				1. the root element to be grown
				2. element to get dimensions from
		*/
		grow: function(el, done) {
			
			var self = this, 
				 conf = self.getConf()
				 root = conf.grow.jquery ? conf.grow : el.closest(conf.grow),
				 css = null;				 
			 
			if (el.is("img")) { 
				var img = el[0];
				css = {width: img.width, height: img.height};				
				
			} else if (el.is(":backgroundImage")) {
				var img = el.data("image")[0];
				css = {width: img.width, height: img.height};
				el.css(css);
				
			} else {
				var dim = el.is(":loaded") ? el : el.children(":first");
				css = {width: dim.width(), height: dim.height()};
				el = el.children();
			}

			// hide element before show/fadeIn
			el.css({visibility: 'hidden'}).hide();

			// grow the parent
			root.animate(css, conf.growSpeed, function() {
				effects.show.call(self, el, done);				
			});			
		}
		
	}, loaders = {};
			

	
	/* custom selectors */
	$.extend($.expr[':'], {
		backgroundImage: function(el) {
			return $(el).css("backgroundImage") != 'none' || !!$(el).data("bg") ;
		},
		
		loaded: function(el) {
			return $(el).data("loaded") == true;
		},		
		
		invisible: function(element) {			
			var el = $(element);			
			if (!el.is("img, :backgroundImage")) { return false; }
			
			var w = $(window), top = el.offset().top;

			// below || above 
			return top + el.height() < w.scrollTop() || w.height() + w.scrollTop() < top;			
		}
		
	});
	
//{{{ LOADERS 
		
	/* image loader */
	tool.addLoader('img',
		
		// initialization	
		function(img) {
			var src = img.attr("src");
			img.attr("src", "").data("src", src);	
		},
		
		// load function
		function(img, done) {		
			var p = this.getProgress();
			if (p) { img.before(p); }
			
			img.attr("src", img.data("src")).load(function() {
				if (p) { p.remove(); }
				done.call();	
				
			}).error(function(error, b)  {
				
				// TODO, call with error
				console.error(img.data("src"), error, b);
				done.call();	
			});
		}	  
	);			

	
	/* content loader */
	tool.addLoader(':has(a[href]:only-child)', function(root, done) {

		var url = root.children().attr("href"), 
			 p = this.getProgress(),			
			 
			 callback = function(ev, els) {
			 	if (p) { p.remove(); }
				done.call();
			};

		root.html(p).load(url, function() {
			root.prepend(p);	
			
			// lazyloading of nested elements
			var assets = root.find("img, :backgroundImage");
			
			if (assets.length)  {
				assets.lazyload({api: true}).onLoad(callback).load();
				
			} else {
				callback();	
			}
			
		}).ajaxError(function(root, error)  {
			done.call(null, error);
		});
		
	});
		
	
	tool.addLoader(":backgroundImage",

		// initialization function
		function(el) {
			var name = "backgroundImage", bg = el.css(name);
			el.data("bg", bg).css(name, "none");
		},
		
		// load function
		function(el, done) {
			
			// url("bg.jpg") --> bg.jpg
			var bg = el.data("bg"), p = this.getProgress();
			bg = bg.substring(bg.indexOf("(") + 1, bg.indexOf(")")).replace(/\"/g, "");			
			
			// progress indicator
			el.prepend(p);
			
			// load image & store it using data()
			$("<img/>").attr("src", bg).load(function()  {
				el.css("backgroundImage", "url(" + bg + ")").data("image", $(this));
				p.remove();
				done.call();
			});
		}
		
	);
//}}}
			
							 
	/**
	 * @constructor
	 */
	function Loader(els, conf) {
		
		// private variables
		var self = this, 
			 $self = $(this), 
			 css = conf.css,
			 progress;
			 
		if (conf.progress) {
			progress = $("<div/>").addClass(css.progress).text(conf.progress);	
		}
		
		// initialize 
		els.each(function() {				
			var el = $(this).addClass(css.before);

			$.each(loaders, function(matcher, loader) {
				if (el.filter(matcher).length && $.isFunction(loader[0])) {
					loader[0].call(self, el);	
				}
			});
		});
		
		
		// The API  
		$.extend(self, { 
				
			load: function(filter) {			
				
				// filtered set of nodes
				var nodes = els, loaded = [];
				if (filter) { nodes = filter.jquery ? filter : els.filter(filter); }  

								
				// loop trough nodes
				nodes.each(function(index) {				
					
					var el = $(this);		

					// already loaded --> skip.
					if (el.is(":loaded")) {								
						return effects[conf.effect].call(self, el, function() {}); 
					}					
					
					// loop trough loaders
					$.each(loaders, function(matcher, loader) {					
						
						if (el.is(matcher) && $.isFunction(loader[1]))  {
							
							// match found
							var e = new $.Event("onBeforeLoad"), last = !el.next().length;
							$self.trigger(e, [el]);

							// loading cancelled by user
							if (e.isDefaultPrevented()) {
								if (last) { $self.trigger("onLoadAll", [el]); }
								
							} else {															
								
								// start loading
								el.addClass(css.loading);										
								
								loader[1].call(self, el, function(error)  {
									
									// do not remove this!	
									if (el.is(":loaded")) { return; }
									
									if (error) {
										$self.trigger("onError", [el, error]);
										
									} else {									
										
										// perform loading
										effects[conf.effect].call(self, el, function() {												
												
											// onLoad callback
											$self.trigger("onLoad", [el]);											
											
											// CSS class names											
											el.removeClass(css.before).removeClass(css.loading);
											if (css.after) { el.addClass(css.after); }

										});
									}
									
									// loaded flag
									el.data("loaded", true);
									
									// onLoadAll callback
									if (last) {
										$self.trigger("onLoadAll", [els]);
									}
									
								});
							}							
						}
					});
				});
				
				return self;				
			},			

			getElements: function() {
				return els;	
			},
			
			getConf: function() {
				return conf;	
			},
			
			getProgress: function() {
				return progress ? progress.clone() : null;	
			},
			
			bind: function(name, fn) {
				$self.bind(name, fn);
				return self;	
			},

			one: function(name, fn) {
				$self.one(name, fn);
				return self;	
			},			
			
			unbind: function(name) {
				$self.unbind(name);
				return self;	
			}
			
		});
		
		// callbacks	
		$.each("onBeforeLoad,onLoad,onLoadAll,onError".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				self.bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				return self.bind(name, fn);	
			};
		});	

		if (conf.loadOnScroll)  {
			$(window).bind("scroll", function()  {
				els.each(function()  {
					var el = $(this);
					if (!el.is(":loaded") && !el.is(":invisible")) {
						self.load(el);	
					}
				});
			});
		}
	}
					
	// jQuery plugin implementation
	$.fn.lazyload = function(conf, all) {		
		
		// return existing instance
		var el = this.data("lazyload");
		if (el) { return el; } 
		
		// loadOnScroll shortcut
		if (conf === true) { conf = {loadOnScroll: true, progress: null}; }
		
		// configuration
		var globals = $.extend({}, tool.conf); 
		conf = $.extend(globals, conf);		
		
		// construct loader									
		el = new Loader(this, conf);
		this.data("lazyload", el);
		
		return conf.api ? el: this;				
		
	};
	
		
})(jQuery); 

