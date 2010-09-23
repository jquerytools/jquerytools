/**
 * @license 
 * jQuery Tools @VERSION Tabs- The basics of UI design.
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/tabs/
 *
 * Since: November 2008
 * Date: @DATE 
 */  
(function($) {
		
	var GLOBALS = {
		
		conf: {
			tabs: 'a',
			current: 'current',
			onBeforeClick: null,
			onClick: null, 
			effect: 'default',
			initialIndex: 0,			
			event: 'click',
			rotate: false,
			history: false
		},
		
		addEffect: function(name, fn) {
			effects[name] = fn;
		}
		
	};
	
	var effects = {
		
		// toggle
		'default': function(i, done) { 
			this.getPanes().hide().eq(i).show();
			done.call();
		}, 

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

		ajax: function(i, done)  {			
			this.getPanes().eq(0).load(this.getTabs().eq(i).attr("href"), done);	
		}		
	};   	

	
	function Tabs(root, conf) {
		
		var self = this, 
			 trigger = root.add(this),
			 tabs = root.find(conf.tabs),
			 paneSelector = conf.select,
			 panes = paneSelector.jquery ? paneSelector : root.children(paneSelector),			 
			 current;
			 
		
		// make sure tabs and panes are found
		if (!tabs.length)  { tabs = root.children(); }
		if (!panes.length) { panes = root.parent().find(paneSelector); }
		if (!panes.length) { panes = $(paneSelector); }
		
		
		// public methods
		$.extend(this, {
			click: function(i, e) {
				
				var tab = tabs.eq(i);												 
				
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
				trigger.trigger(e, [i]);				
				if (e.isDefaultPrevented()) { return; }

				// call the effect
				effects[conf.effect].call(self, i, function() {

					// onClick callback
					e.type = "onClick";
					trigger.trigger(e, [i]);					
				});			
				
				// default behaviour
				current = i;
				tabs.removeClass(conf.current);	
				tab.addClass(conf.current);				
				
				return self;
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
			
			getIndex: function() {
				return current;	
			}, 
			
			next: function() {
				return self.click(current + 1);
			},
			
			prev: function() {
				return self.click(current - 1);	
			},
			
			destroy: function() {
				tabs.unbind(conf.event).removeClass(conf.current);
				panes.find("a[href^=#]").unbind("click.T"); 
				return self;
			}
		
		});

		
		if (conf.history && $.fn.history) {
			$.tools.history.init(tabs);
			conf.event = 'history';
		}	
		
		// setup click actions for each tab
		tabs.each(function(i) { 				
			$(this).bind(conf.event, function(e) {
				self.click(i, e);
				return e.preventDefault();
			});			
		});
		
		// cross tab anchor link
		panes.find("a[href^=#]").bind("click.T", function(e) {
			self.click($(this).attr("href"), e);		
		}); 
		
		// open initial tab
		if (location.hash && conf.tabs == "a" && root.find("[href=" +location.hash+ "]").length) {
			self.click(location.hash);

		} else {
			if (conf.initialIndex === 0 || conf.initialIndex > 0) {
				self.click(conf.initialIndex);
			}
		}		
	}
	
	
	// jQuery plugin implementation
	$.fn.tabs = function(paneSelector, conf) {

		conf = conf || {};
		
		if ($.isFunction(conf)) {
			conf = {onBeforeClick: conf};
		}
		
		conf.select = paneSelector;
	
		return $.tools.create(this, "tabs", Tabs, GLOBALS, conf, "BeforeClick,Click");		
	};		
		
}) (jQuery); 


