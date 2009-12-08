/*!
 * tools.tooltip "Dynamic Plugin" @VERSION
 * 
 * Copyright (c) 2009 Tero Piirainen
 * http://flowplayer.org/tools/tooltip.html#dynamic
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 *
 * Since  : July 2009
 * Date: @DATE
 * Revision: @REVISION 
 */
(function($) { 

	// version number
	var t = $.tools.tooltip;
	t.plugins = t.plugins || {};
	
	t.plugins.dynamic = {
		version: '@VERSION',
	
		conf: {
			api: false,
			classNames: "top right bottom left"
		}
	};
		
	/* 
	 * See if element is on the viewport. Returns an boolean array specifying which
	 * edges are hidden. Edges are in following order:
	 * 
	 * [top, right, bottom, left]
	 * 
	 * For example following return value means that top and right edges are hidden
	 * 
	 * [true, true, false, false]
	 * 
	 */
	function getCropping(el) {
		
		var w = $(window); 
		var right = w.width() + w.scrollLeft();
		var bottom = w.height() + w.scrollTop();		
		
		return [
			el.offset().top <= w.scrollTop(), 						// top
			right <= el.offset().left + el.width(),				// right
			bottom <= el.offset().top + el.height(),			// bottom
			w.scrollLeft() >= el.offset().left 					// left
		]; 
	}
	
	/*
		Returns true if all edges of an element are on viewport. false if not
		
		@param crop the cropping array returned by getCropping function
	 */
	function isVisible(crop) {
		var i = crop.length;
		while (i--) {
			if (crop[i]) { return false; }	
		}
		return true;
	}
	
	// scrollable mousewheel implementation
	$.fn.dynamic = function(conf) {
		
		var globals = $.extend({}, t.plugins.dynamic.conf), ret;
		if (typeof conf == 'number') { conf = {speed: conf}; }
		conf = $.extend(globals, conf);
		
		var cls = conf.classNames.split(/\s/), orig;	
			
		this.each(function() {		
				
			if ($(this).tooltip().jquery)  {
				throw "Lazy feature not supported by dynamic plugin. set lazy: false for tooltip";	
			}
				
			var api = $(this).tooltip().onBeforeShow(function(e, pos) {				

				// get nessessary variables
				var tip = this.getTip(), tipConf = this.getConf();  

				/*
					We store the original configuration and use it to restore back to the original state.
				*/					
				if (!orig) {
					orig = [
						tipConf.position[0], 
						tipConf.position[1], 
						tipConf.offset[0], 
						tipConf.offset[1], 
						$.extend({}, tipConf)
					];
				}
				
				/*
					display tip in it's default position and by setting visibility to hidden.
					this way we can check whether it will be on the viewport
				*/
				$.extend(tipConf, orig[4]);
				tipConf.position = [orig[0], orig[1]];
				tipConf.offset = [orig[2], orig[3]];
				
				tip.css({
					visibility: 'hidden',
					position: 'absolute',
					top: pos.top,
					left: pos.left
					
				}).show(); 
				
				// now let's see for hidden edges
				var crop = getCropping(tip);		
								
				// possibly alter the configuration
				if (!isVisible(crop)) {
					
					// change the position and add class
					if (crop[2]) { $.extend(tipConf, conf.top);		tipConf.position[0] = 'top'; 		tip.addClass(cls[0]); }
					if (crop[3]) { $.extend(tipConf, conf.right);	tipConf.position[1] = 'right'; 	tip.addClass(cls[1]); }					
					if (crop[0]) { $.extend(tipConf, conf.bottom); 	tipConf.position[0] = 'bottom';	tip.addClass(cls[2]); } 
					if (crop[1]) { $.extend(tipConf, conf.left);		tipConf.position[1] = 'left'; 	tip.addClass(cls[3]); }					
					
					// vertical offset
					if (crop[0] || crop[2]) { tipConf.offset[0] *= -1; }
					
					// horizontal offset
					if (crop[1] || crop[3]) { tipConf.offset[1] *= -1; }
				}  
				
				tip.css({visibility: 'visible'}).hide();
		
			});
			
			// restore positioning
			api.onShow(function() {
				var c = this.getConf(), tip = this.getTip();				
				c.position = [orig[0], orig[1]];
				c.offset = [orig[2], orig[3]];				
			});
			
			// remove custom class names and restore original effect
			api.onHide(function() {
				var tip = this.getTip(); 
				tip.removeClass(conf.classNames);
			});
				
			ret = api;
			
		});
		
		return conf.api ? ret : this;
	};	
	
}) (jQuery);
