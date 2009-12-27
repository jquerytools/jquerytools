/**
 * @license 
 * jQuery Tools @VERSION Tabs- The basics of UI design.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/tabs/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: November 2008
 * Date: @DATE 
 */  
(function($) {
		
	// static constructs
	$.tools = $.tools || {};
	
	$.tools.tabs = {
		version: '@VERSION',
		
		conf: {
			tabs: 'a',
			current: 'current',
			onBeforeClick: null,
			onClick: null, 
			effect: 'default',
			initialIndex: 0,			
			event: 'click',
			api: false,
			rotate: false,
			
			// 1.2
			lazyload: null,
			history: false
		},
		
		addEffect: function(name, fn) {
			effects[name] = fn;
		}
		
	}, effects = {
		
		// simple "toggle" effect
		'default': function(i, done) { 
			this.getPanes().hide().eq(i).show();
			done.call();
		}, 
		
		/*
			configuration:
				- fadeOutSpeed (positive value does "crossfading")
				- fadeInSpeed
		*/
		fade: function(i, done) {
			var conf = this.getConf(), 
				 speed = conf.fadeOutSpeed,
				 panes = this.getPanes();
	 
			if (speed) {
				panes.fadeOut(speed);	
			} else {
				panes.hide();	
			}

			panes.eq(i).fadeIn(conf.fadeInSpeed, done);	
		},
		
		// for basic accordions
		slide: function(i, done) {			
			this.getPanes().slideUp(200);
			this.getPanes().eq(i).slideDown(400, done);			 
		}, 

		/**
		 * AJAX effect
		 * 
		 * @deprecated use util.loader instead
		 */
		ajax: function(i, done)  {			
			this.getPanes().eq(0).load(this.getTabs().eq(i).attr("href"), done);	
		}		
	};   	
	
	var w;
	
	/**
	 * Horizontal accordion
	 * 
	 * @deprecated will be replaced with a more robust implementation
	 */
	$.tools.tabs.addEffect("horizontal", function(i, done) {
	
		// store original width of a pane into memory
		if (!w) { w = this.getPanes().eq(0).width(); }
		
		// set current pane's width to zero
		this.getCurrentPane().animate({width: 0}, function() { $(this).hide(); });
		
		// grow opened pane to it's original width
		this.getPanes().eq(i).animate({width: w}, function() { 
			$(this).show();
			done.call();
		});
		
	});	

	
	function Tabs(tabs, panes, conf) { 
		
		var self = this, 
			 $self = $(this),
			 root = panes.parent(),			 
			 current,
			 
			 // lazyload related
			 loadables,
			 lazyconf = conf.lazyload;
			 
		// initialize lazyload
		if (lazyconf) {
			
			if (!$.tools.toolbox.lazyload) { throw "jQuery Tabs: lazyload tool not included"; }
			
			if (typeof lazyconf == 'string') {
				loadables = root.find(lazyconf);
				lazyconf = {select: lazyconf};
				
			} else if (typeof lazyconf == 'boolean') {
				loadables = panes;
				lazyconf = {};
				
			} else {
				loadables = root.find(lazyconf.select);	
			}
			
			if (lazyconf.effect == 'grow') {
				lazyconf.grow = lazyconf.grow || root;
			}			
			
			loadables.lazyload(lazyconf);
		}


		// bind all callbacks from configuration
		$.each(conf, function(name, fn) {
			if ($.isFunction(fn)) { $self.bind(name, fn); }
		});
		
		
		// public methods
		$.extend(this, {				
			click: function(i, e) {
				
				var pane = self.getCurrentPane(),
					 tab = tabs.eq(i);												 
				
				if (typeof i == 'string' && i.replace("#", "")) {
					tab = tabs.filter("[href*=" + i.replace("#", "") + "]");
					i = Math.max(tabs.index(tab), 0);
				}
								
				if (conf.rotate) {
					var last = tabs.length -1; 
					if (i < 0) { return self.click(last, e); }
					if (i > last) { return self.click(0, e); }						
				}
				
				if (!tab.length) { 
					if (current >= 0) { return self; }
					i = conf.initialIndex;
					tab = tabs.eq(i);
				}				
				
				// current tab is being clicked
				if (i === current) { return self; }
				
				// possibility to cancel click action				
				e = e || $.Event();
				e.type = "onBeforeClick";
				$self.trigger(e, [i]);				
				if (e.isDefaultPrevented()) { return; }
				
				// perform lazyload
				if (loadables) {
					loadables.lazyload().load(panes.eq(i).find(lazyconf.select).andSelf());		
				}				
				
				// call the effect
				effects[conf.effect].call(self, i, function() {

					// onClick callback
					e.type = "onClick";
					$self.trigger(e, [i]);					
				});			
				
				// default behaviour
				current = i;
				tabs.removeClass(conf.current);	
				tab.addClass(conf.current);				
				
				return self;
			},
			
			getConf: function() {
				return conf;	
			},

			getTabs: function() {
				return tabs;	
			},
			
			getPanes: function() {
				return panes;	
			},
			
			getCurrentPane: function() {
				return panes.eq(current);	
			},
			
			getCurrentTab: function() {
				return tabs.eq(current);	
			},
			
			getLoader: function() {
				return loadables.lazyload();	
			},
			
			getIndex: function() {
				return current;	
			}, 
			
			next: function() {
				return self.click(current + 1);
			},
			
			prev: function() {
				return self.click(current - 1);	
			}, 
			
			
			bind: function(name, fn) {
				$self.bind(name, fn);
				return self;	
			},	
			
			onBeforeClick: function(fn) {
				return this.bind("onBeforeClick", fn);
			},
			
			onClick: function(fn) {
				return this.bind("onClick", fn);
			},
			
			unbind: function(name) {
				$self.unbind(name);
				return self;	
			}			
		
		});
		
		
		// setup click actions for each tab
		tabs.each(function(i) { 
			$(this).bind(conf.event, function(e) {
				self.click(i, e);
				return false;
			});			
		});

		// if no pane is visible --> click on the first tab
		if (location.hash) {
			self.click(location.hash);
		} else {
			if (conf.initialIndex === 0 || conf.initialIndex > 0) {
				self.click(conf.initialIndex);
			}
		}		
		
		// cross tab anchor link
		panes.find("a[href^=#]").click(function(e) {
			self.click($(this).attr("href"), e);		
		}); 


		// history support
		if (conf.history && $.fn.history) {
			
			// enable history support
			tabs.history(function(evt, hash) {
				if (!hash || hash == '#') { hash = conf.initialIndex; }
				self.click(hash);		
			});	  
 			
			// tab clicks perform their original action
			tabs.click(function(e) {
				location.hash = $(this).attr("href").replace("#", "");	
			});		 
		}
		
	}
	
	
	// jQuery plugin implementation
	$.fn.tabs = function(query, conf) {
		
		// return existing instance
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("tabs");
		if (el) { return el; }

		if ($.isFunction(conf)) {
			conf = {onBeforeClick: conf};
		}
		
		// setup options
		var globals = $.extend({}, $.tools.tabs.conf), len = this.length;
		conf = $.extend(globals, conf);		

		
		// install tabs for each items in jQuery		
		this.each(function(i) {				
			var root = $(this); 
			
			// find tabs
			var els = root.find(conf.tabs);
			
			if (!els.length) {
				els = root.children();	
			}
			
			// find panes
			var panes = query.jquery ? query : root.children(query);
			
			if (!panes.length) {
				panes = len == 1 ? $(query) : root.parent().find(query);
			}			
			
			el = new Tabs(els, panes, conf);
			root.data("tabs", el);
			
		});		
		
		return conf.api ? el: this;		
	};		
		
}) (jQuery); 


