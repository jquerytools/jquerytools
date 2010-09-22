(function($) {
		
	$.tools = {
		version: '@VERSION',
		
		create: function(root, fn, globals, conf) {
						
			var args = arguments,
				 name = fn.name.toLowerCase(),
				 api = root.data(name);
				 
			if (api) { 
				api.destroy();
				
			} else {
				
				if (!globals.conf) { globals = { conf: globals }; }
				
				$.tools[name] = globals;
				
				conf = $.extend(true, {}, globals.conf, conf);
				
				$.extend(fn.prototype,  {
					getConf: function()  {
						return conf;	
					}
				});
			}
			
			return root.each(function() {				
				api = new fn($(this), conf);
				$(this).data(name, api); 
			});						
		}
	};
	
})(jQuery);
