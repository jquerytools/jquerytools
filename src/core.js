(function($) {
		
	$.tools = {
		version: '@VERSION',
		
		create: function(elem, name, fn, globals, conf, events, isInput) {
						
			var api = elem.data(name);
				 
			if (api) { 
				api.destroy();
				
			} else {
				// configuration
				if (!globals.conf) { globals = { conf: globals }; }				
				$.tools[name] = globals;				
				conf = $.extend(true, {}, globals.conf, conf);

				// :overlay, :date
				$.expr[':'][name] = $.expr[':'][name] || function(el) {					
					return !!$(el).data(name);
				};				
			}
			
			var ret;
			
			elem.each(function() {
					
				api = new fn($(this), conf);
				
				$.extend(api, {
					getConf: function()  {
						return conf;	
					}
				});			

				// events	
				$.each(events.split(","), function(i, name) {
						
					if (name != 'change') { name = "on" + name; }
					
					// configuration
					if ($.isFunction(conf[name])) {
						$(api).bind(name, conf[name]); 
					}
		
					// API
					api[name] = function(fn) {
						if (fn) { $(api).bind(name, fn); }
						return api;	
					};
				});				
				
				$(this).data(name, api).data("api", api); 
				
				if (isInput) {
					var input = api.getInput().data(name, api).data("api", api);
					ret = ret ? ret.add(input) : input;
				}
			});	
			
			return ret ? ret : elem;
		}
	};

	// jQuery.tool(":overlay").load();
	$.tool = function(query) {
		return $(query).data("api");	
	};
	
})(jQuery);
