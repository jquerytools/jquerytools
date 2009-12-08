
/* 
	Features
	- progressive enhancement
	- disabled flag (no autoupdate)
	- programmable access
	- http://www.appelsiini.net/projects/filestyle/jquery.filestyle.js
	- http://css-tricks.com/better-password-inputs-iphone-style/
*/

(function($) { 
	
	$.tools = $.tools || {};	
	$.tools.form = $.tools.form || {};
	
	var tool = $.tools.form.styleable = {
		
		version: '@VERSION', 
		conf: { 
			inputClass: null,
			checkedClass: 'checked',
			disabledClass: 'disabled',
			hoverClass: 'hover',
			focusClass: 'focus',
			fileWrap: 'filewrap', 
			filter: 'select, :radio, :checkbox, :file'
		}
		
	};	 

	function Styleable(input, conf) {
		
		var type = input.attr("type"), a = $("<a/>");
		input.before(a);
		
		if (type == 'select-one') {
			input.css({opacity: 0});
			
			input.change(function() {
				a.text(input.find("option:selected").html());					
			});
			
			a.addClass("select").text(input.find("option:selected").html());
			
		// :file
		} else if (type == 'file') {

			var wrap = $("<span/>").addClass(conf.fileWrap);
			var textInput = $("<input/>").addClass(input.attr("className")).attr("disabled", true);
			
			input.before(textInput);			
			input.wrap(wrap);			
			input.after("<a>" + input.attr("title") + "</a>").css({opacity: 0});
			
			wrap = input.parent();			
			
			input.bind("mouseenter mouseleave mousedown", function(e) {
				wrap.toggleClass(conf.hoverClass, e.type == 'mouseenter');
				wrap.toggleClass(conf.focusClass, e.type == 'mousedown');
			});
			
	
			input.change(function() {
				textInput.val($(this).val());
			});

			
		// :radio, :checkbox
		} else {			
			a.addClass(type);
			input.hide();
			
			if (conf.inputClass) {
				a.addClass(conf.inputClass);
			}
			
			var els = type == 'radio' ? $(":radio[name=" + input.attr("name") + "]") : null, 
				 cls = conf.checkedClass;
			
			input.click(function() {
				if (els) { els.prev().removeClass(cls); }
				setTimeout(function() {
					a.toggleClass(cls, this.checked);
				}, 5);
			});			
			
			if (!input.parent().is("label")	)  {				
				a.click(function() {
					input.click();
				});					
			}
			
			if (input.get(0).checked) {
				a.addClass(cls);	
			}			
		}
		
		if (input.is(":disabled")) {
			a.addClass(conf.disabledClass);	
		}
		
	}
	
	$.fn.styleable = function(conf) {   
		
		// return existing instance
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("styleable"), els;
		if (el) { return el; } 
		
		// configuration
		var globals = $.extend({}, tool.conf); 
		conf = $.extend(globals, conf);				
		
				
		if (this.is("form")) {
			els = this.find(conf.filter);			
			this.nextAll().each(function()  {
				els.add($(this).find(conf.filter));
			});
				
		} else {			
			els = this.filter(conf.filter);	
		}
		
		
		els.each(function() {									
			el = new Styleable($(this), conf);				
			$(this).data("styleable", el);
		});		
		
		return conf.api ? el: this;		
	};   
		
})(jQuery);
