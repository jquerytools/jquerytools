/**
 * @license 
 * jQuery Tools @VERSION Tooltip - Basics of UI design
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/tooltip/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since: November 2008
 * Date: @DATE 
 */
(function($) { 

	var instances = [];
	
	// static constructs
	$.tools = $.tools || {version: '@VERSION'};
	
	$.tools.tooltip = {
		
		conf: { 
			
			// default effect variables
			effect: 'toggle',			
			fadeOutSpeed: "fast",
			tip: null,
			
			predelay: 0,
			delay: 30,
			opacity: 1,			
			lazy: undefined,
			
			// 'top', 'bottom', 'right', 'left', 'center'
			position: ['top', 'center'], 
			offset: [0, 0],			
			cancelDefault: true,
			relative: false,
			oneInstance: true,
			
			
			// type to event mapping 
			events: {
				def: 			"mouseenter,mouseleave",
				input: 		"focus,blur",
				widget:		"focus mouseenter,blur mouseleave",
				tooltip:		"mouseenter,mouseleave"
			},			
			
			api: false,
			
			// 1.2
			lazyload: false
		},
		
		addEffect: function(name, loadFn, hideFn) {
			effects[name] = [loadFn, hideFn];	
		} 
	};
	
	
	var effects = { 
		toggle: [ 
			function(done) { 
				var conf = this.getConf(), tip = this.getTip(), o = conf.opacity;
				if (o < 1) { tip.css({opacity: o}); }
				tip.show();
				done.call();
			},
			
			function(done) { 
				this.getTip().hide();
				done.call();
			} 
		],
		
		fade: [
			function(done) { this.getTip().fadeIn(this.getConf().fadeInSpeed, done); },  
			function(done) { this.getTip().fadeOut(this.getConf().fadeOutSpeed, done); } 
		]		
	};   

	function Tooltip(trigger, conf) {

		var self = this, 
			 fire = trigger.add(this),
			 tip = trigger.next();
		
		trigger.data("tooltip", self); 
		
		if (conf.tip) {
			
			tip = $(conf.tip);
			
			// multiple tip elements
			if (tip.length > 1) {
				
				// find sibling
				tip = trigger.nextAll(conf.tip).eq(0);	
				
				// find sibling from the parent element
				if (!tip.length) {
					tip = trigger.parent().nextAll(conf.tip).eq(0);
				}
			} 
		} 				
		
		/* calculate tip position relative to the trigger */  	
		function getPosition(e) {	
			
			// get origin top/left position 
			var top = conf.relative ? trigger.position().top : trigger.offset().top, 
				 left = conf.relative ? trigger.position().left : trigger.offset().left,
				 pos = conf.position[0];

			top  -= tip.outerHeight() - conf.offset[0];
			left += trigger.outerWidth() + conf.offset[1];
			
			// adjust Y		
			var height = tip.outerHeight() + trigger.outerHeight();
			if (pos == 'center') 	{ top += height / 2; }
			if (pos == 'bottom') 	{ top += height; }
			
			// adjust X
			pos = conf.position[1]; 	
			var width = tip.outerWidth() + trigger.outerWidth();
			if (pos == 'center') 	{ left -= width / 2; }
			if (pos == 'left')   	{ left -= width; }	 
			
			return {top: top, left: left};
		}		

		
		// event management
		var isInput = trigger.is(":input"), 
			 isWidget = isInput && trigger.is(":checkbox, :radio, select, :button"),			
			 type = trigger.attr("type"),
			 evt = conf.events[type] || conf.events[isInput ? (isWidget ? 'widget' : 'input') : 'def']; 
		
		evt = evt.split(/,\s*/); 
		if (evt.length != 2) { throw "Tooltip: bad events configuration for " + type; }
				
		trigger.bind(evt[0], function(e) {
			
			// close all instances
			if (conf.oneInstance) {
				$.each(instances, function()  {
					this.hide();		
				});
			}
				
			// see if the tip was launched by this trigger
			var t = tip.data("trigger");			
			if (t && t[0] != this) { tip.hide().stop(true, true); }			
			
			e.target = this;
			self.show(e); 
			
			// tooltip close events
			evt = conf.events.tooltip.split(/,\s*/);
			tip.bind(evt[0], function() { self.show(e); });
			if (evt[1]) { tip.bind(evt[1], function() { self.hide(e); }); }
			
		});
		
		trigger.bind(evt[1], function(e) {
			self.hide(e); 
		});
		
		// ensure that the tip really shows up. IE cannot catch up with this.
		if (!$.browser.msie && !isInput && !conf.predelay) {
			trigger.mousemove(function()  {					
				if (!self.isShown()) {
					trigger.triggerHandler("mouseenter");	
				}
			});
		}

		// avoid "black box" bug in IE with PNG background images
		if (conf.opacity < 1) {
			tip.css("opacity", conf.opacity);		
		}
		
		var pretimer = 0, title = trigger.attr("title");
		
		if (title && conf.cancelDefault) { 
			trigger.removeAttr("title");
			trigger.data("title", title);			
		}		
		
		$.extend(self, {
				
			show: function(e) {
				
				if (e) { trigger = $(e.target); }								
				
				clearTimeout(tip.data("timer"));					

				if (tip.is(":animated") || tip.is(":visible")) { return self; }
				
				function show() {
					
					// remember the trigger element for this tip
					tip.data("trigger", trigger);
					
					// get position
					var pos = getPosition(e);					
					
					// title attribute
					if (conf.tip && title) {
						tip.html(trigger.data("title") || title);
					} 				
					
					// onBeforeShow
					e = e || $.Event();
					e.type = "onBeforeShow";
					fire.trigger(e, [pos]);				
					if (e.isDefaultPrevented()) { return self; }
			
					
					// onBeforeShow may have altered the configuration
					pos = getPosition(e);
					
					// set position
					tip.css({position:'absolute', top: pos.top, left: pos.left});					
					
					// invoke effect
					var eff = effects[conf.effect];
					if (!eff) { throw "Nonexistent effect \"" + conf.effect + "\""; }
					
					eff[0].call(self, function() {
						e.type = "onShow";
						fire.trigger(e);			
					});					
					
				}
				
				if (conf.predelay) {
					clearTimeout(pretimer);
					pretimer = setTimeout(show, conf.predelay);	
					
				} else {
					show();	
				}
				
				return self;
			},
			
			hide: function(e) {

				clearTimeout(tip.data("timer"));
				clearTimeout(pretimer);
				
				if (!tip.is(":visible")) { return; }
				
				function hide() {
					
					// onBeforeHide
					e = e || $.Event();
					e.type = "onBeforeHide";
					fire.trigger(e);				
					if (e.isDefaultPrevented()) { return; }
					
					effects[conf.effect][1].call(self, function() {
						e.type = "onHide";
						fire.trigger(e);		
					});
				}
				 
				if (conf.delay && e) {
					tip.data("timer", setTimeout(hide, conf.delay));
					
				} else {
					hide();	
				}			
				
				return self;
			},
			
			isShown: function() {
				return tip.is(":visible, :animated");	
			},
				
			getConf: function() {
				return conf;	
			},
				
			getTip: function() {
				return tip;	
			},
			
			getTrigger: function() {
				return trigger;	
			}		

		});		

		// callbacks	
		$.each("onHide,onBeforeShow,onShow,onBeforeHide".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).bind(name, conf[name]); 
			}

			// API
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});

		
		// lazyload support. all logic is here.
		var lconf = $.tools.lazyload && conf.lazyload, loader;
			 
		if (lconf) {
			
			// lazyload configuration
			if (typeof lconf != 'object') { lconf = { select: lconf }; }
			if (typeof lconf.select != 'string') { lconf.select = "img, :backgroundImage"; }			
			$.extend(lconf, { growParent: tip, api: true }, lconf); 
			
			// initialize lazyload
			loader = tip.find(lconf.select).lazyload(lconf);
			
			// perform lazyload right before overlay is opened
			self.onBeforeShow(loader.load);
		}
		
	}
		
	
	// jQuery plugin implementation
	$.fn.tooltip = function(conf) {
		
		// return existing instance
		var api = this.data("tooltip");
		if (api) { return api; }
		
		// configuration		
		if ($.isFunction(conf)) {
			conf = {onBeforeShow: conf};
			
		} else if (typeof conf == 'string') {
			conf = {tip: conf};	
		}

		conf = $.extend(true, {}, $.tools.tooltip.conf, conf);
		
		// can also be given as string
		if (typeof conf.position == 'string') {
			conf.position = conf.position.split(/,?\s/);	
		}
		
		// assign tip's only when apiement is being mouseentered		
		if (conf.lazy !== false && (conf.lazy === true || this.length > 20)) {	
				
			this.one("mouseenter", function(e) {	
				api = new Tooltip($(this), conf);
				api.show(e);
				instances.push(api);
			}); 
			
		} else {
			
			// install tooltip for each entry in jQuery object
			this.each(function() {
				api = new Tooltip($(this), conf); 
				instances.push(api);
			});
		} 

		return conf.api ? api: this;		 
	};
		
}) (jQuery);

		

