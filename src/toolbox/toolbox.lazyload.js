/**
 * @license 
 * jQuery Tools @VERSION / Toolbox:Lazyload - We need a faster web
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/toolbox/lazyload.html
 * 
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
(function($) {
		
	/*		
		sizing: padding / margins
	*/
	
	$.tools = $.tools || {};
	
	var tool = $.tools.lazyload = {
		
		conf: {
			css: {
				before: null,
				loading: 'loading',
				after: null,
				progress: 'progress'
			},
			
			effect: 'show',
			fadeInSpeed: 0,			
			growSpeed: 'slow',
			growParent: '.grow',	// jquery || closest(growParent) || parent		
			progress: 'Loading',
			loadOnScroll: false,
			placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
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
				 root = conf.growParent.jquery ? conf.growParent : el.closest(conf.growParent),
				 css = null;				 
			 
				 if (!root.length) { root = el.parent(); }
				 
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
			root.animate(css, conf.growParentSpeed, function() {
				effects.show.call(self, el, done);				
			});			
		}
		
	}, loaders = {};
			

	
	/* custom selectors */
	$.extend($.expr[':'], {
		backgroundImage: function(el) {
			return $(el).css("backgroundImage") != 'none' || !!$(el).data("bg") ;
		},
		
		unloaded: function(el) {
			return $(el).data("loaded") === false;
		},
		
		loaded: function(el) {
			return $(el).data("loaded") === true;
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
			img.attr("src", this.getConf().placeholder).data("src", src);	
		},
		
		// load function
		function(img, done) {		
			var p = this.getProgress();
			if (p) { img.before(p); }
			
			img.load(function() {
				if (p) { p.remove(); }
				done.call();	
				
			}).error(function(error, b)  { 
				done.call(null, error);	
				
			}).attr("src", img.data("src"));
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
				assets.lazyload({api: true}).onLoadAll(callback).load();
				
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
			if (p) { el.prepend(p); }
			
			// load image & store it using data()
			$("<img/>").load(function()  {
				el.css("backgroundImage", "url(" + bg + ")").data("image", $(this));
				if (p) { p.remove(); }
				done.call();
				
			}).attr("src", bg);
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
			progress = $("<div/>").addClass(css.progress).html(conf.progress);	
		} 
		
		// The API  
		$.extend(self, { 
				
			preload: function(begin, end) {
				return self.load(begin, end, true);	
			},
			
			/* 
				load() 			// loads all
				load(2)			// loads 3:rd element
				load(2, 4)		// loads elements 3 - 5
				load(els)		// loads supplied elements. must be a subset of the initial elements
			*/
			load: function(begin, end) {			
				
				// filtered set of nodes
				var nodes = null,
					 preload = arguments[arguments.length -1] === true;

				if (begin && begin.jquery) {
					nodes = begin.filter(function() {
						return els.index(this) >= 0;		
					}); 
					
				} else {
					nodes = begin >= 0 ? els.slice(begin, end || begin + 1) : els;	
				} 

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
							var e = new $.Event("onBeforeLoad");
							$self.trigger(e, [el]);

							// loading cancelled by user
							if (e.isDefaultPrevented()) {	return false; }						
							
							// start loading
							el.addClass(css.loading);										
							
							loader[1].call(self, el, function(error)  {
									  
								// loading failed
								if (error) {
									return $self.trigger("onError", [el, error]); 
								}

								function setLoaded() {
									
									// loaded flag
									el.data("loaded", true);
									
									// CSS class names											
									el.removeClass(css.before).removeClass(css.loading);
									if (css.after) { el.addClass(css.after); }  
									
									// onLoad callback
									$self.trigger("onLoad", [el]);										
								}
								
								if (preload) {
									// mark as loaded
									setLoaded();
									
								} else {
									// perform effect and mark loaded
									effects[conf.effect].call(self, el, setLoaded);	 
								}  
								
							});						
						}
					});
				});				
				
				// onLoadAll callback 
				$self.bind("onLoad.tmp", function() {
					if (!nodes.not(":loaded").length) {
						$self.trigger("onLoadAll", [nodes], preload);	
						$self.unbind("onLoad.tmp");
					}
				});                  
				
				
				
				
				return self;				
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
						self.load(els.index(el[0]));	
					}
				});
			});
		}
		
		
		// initialize 
		els.each(function() {				
			var el = $(this).addClass(css.before).data("loaded", false);

			$.each(loaders, function(matcher, loader) {
				if (el.filter(matcher).length && $.isFunction(loader[0])) {
					loader[0].call(self, el);	
				}
			});
		});
			
	}
					
	// jQuery plugin implementation
	$.fn.lazyload = function(conf, all) {		
		
		// return existing instance
		var el = this.data("lazyload");
		if (el) { return el; } 
		
		// loadOnScroll shortcut
		if (conf === true) { conf = {loadOnScroll: true, progress: null}; }
		
		// configuration 
		conf = $.extend(true, {}, tool.conf, conf);		
		
		// construct loader									
		el = new Loader(this, conf);
		this.data("lazyload", el);
		
		return conf.api ? el: this;				
		
	};
	
		
})(jQuery); 

