
/* ACCORDION */
(function($) {
		
	var CONF = {
		easing: 'swing',
		event: 'click', // mouseenter		
		initialIndex: -1,
		small: 0,
		large: 300,
		panes: null,
		speed: 400,
		sticky: false,
		vertical: false
	};

	function Tool(root, conf)  {		
    		 	
      var panes = root.children(conf.panes),
      	 currentIndex = conf.initialIndex,
      	 self = this,
      	 totalSize, 
      	 vertical, 
      	 prop, 
      	 size;
      	 
		$.extend(self, {
				
			select: function(index, evt)  {
				
				// calculate dimensions
				if (!size) {
					vertical = conf.vertical || root.height() > root.width(); 
					prop = vertical ? 'height' : 'width';
					size = panes.eq(0)[prop]();
					totalSize = size * panes.length;
				}				
				
				var large = conf.large,
					 small = conf.small || (totalSize - large) / (panes.length - 1);				
				
				// same element clicked
				if (index === currentIndex && self.isOpened()) {
					large = small = size;								
				}
      	 
				var sizes = $.map(panes, function(el)  {
					return $(el)[prop]();		
				});
				
				$("<span/>").stop().animate({step: 1}, {
					duration: conf.speed,
					easing: conf.easing,
					
					step: function(step) {
						var large = totalSize;
						panes.each(function(i) {
							if (i !== index)  {
								var value = sizes[i] + Math.round(step * (small - sizes[i]));
								if (value < 0) { value = 0; }
								$(this)[prop](value);
								large -= value;		
							}
						});						
						panes.eq(index)[prop](large);
					}
				});
				
				currentIndex = index;				
			},
				
			getPanes: function() {
				return panes;	
			},
			
			getCurrentPane: function() {
				return panes.eq(index);	
			},
			
			getIndex: function() {
				return index;	
			}, 
			
			isOpened: function() {				
				return panes.eq(currentIndex)[prop]() > size;	
			},
			
			next: function() {
				return self.select(index + 1);
			},
			
			prev: function() {
				return self.select(index - 1);	
			}
			
		});
        
		panes.bind(conf.event, function(e) {
			self.select($(this).index(), e);
		});	
		
		if (!conf.sticky) {
			root.bind("mouseleave", function(e)  {
				if (self.isOpened()) { 
					self.select(currentIndex); 
				}		
			});
		}
	}
		
	$.fn.accordion = function(conf) {		
		return $.tools.create(this, "accordion", Tool, CONF, conf, "Select");			
	};

})(jQuery);
