/* 
	TODO
		- :file input replaceWith(wrap)
		- progress indicator (find or create)
		# autoStart
		# queueSizeLimit
*/
(function() {

	$.tools = $.tools || {};
	
	var tool = $.tools.upload = {
		
		version: '@VERSION',
		
		conf: {
			pagepath: '/setup/upload/',
			buttonText: 'Select file',
			script: '/setup/actions/uploadMedia',
			folder: '',
			method: 'POST',
			
			queueSizeLimit: 1,
			simUploadLimit: 1,
			
			sizeLimit: 6000,
			fileDataName: 'Filedata', 
			
			// JQT stuff
			autoStart: false,
			progress: null,
			
			css: {
				root: 'uploadRoot',
				progress: 'uploadProgress',
				items: 'uploadItems',
				item: 'uploadItem',
				active: 'active'
			},
			
			swf: {
				width: 110,
				height: 30,
				src: null,
				version: [9, 24]				
			}
		} 
	};
	
	
	function prettyPrint(file) {
		var name = file.name, size = file.size / 1024;

		if (name.length > 20) { name = file.name.substring(0, 20) + " &hellip;"; }				
		size = size > 1000 ? Math.round(size / 10) * .01 + " Mb" : Math.round(size) + " kb";
		
		return "<strong>" + name + "</strong> (" + size + ")";
	}

	
	function Upload(input, conf, index) {

		var self = this, 
			 swfWrap = $("<div/>"), 
			 css = conf.css;

		// id attribute required for input field
		conf.uploadifyID = input.attr("id") || "upload";		
		input.attr("id", conf.uploadifyID).after(swfWrap).hide();		
		
		conf.script += "?name=" + input.attr("name");
		conf.swf.id = conf.swf.id || 'foo';
		
		
		// progress bar
		var progress = css.progress.substring(0, 1) == '#' ? 
			$(css.progress) : swfWrap.next("." + css.progress);

		if (!progress.length) {
			progress = $("<div/>").addClass(css.progress);
			swfWrap.after(progress);
		}
		
		
		// install SWF component
		var api = flashembed(swfWrap.get(0), conf.swf, conf).getApi();
		
	
		// The Upload API
		$.extend(self, {
			
			getConf: function() {
				return conf;	
			},				
			
			getRoot: function() {
				return swfWrap;	
			},
			
			getProgress: function() {
				return progress;	
			}, 
			
			getProgressItems: function() {
				return progress.find("." + css.items);	
			},
				
			start: function()  {
				var e = new $.Event("uploadifyBeforeStart");
				input.trigger(e);
				
				if (!e.isDefaultPrevented()) {
					input.trigger("uploadifyStart");
					api.startFileUpload(undefined, true);
				} 
			},
			
			// bind / unbind
			bind: function(name, fn) {
				input.bind(name.replace("on", "uploadify"), function()  {
					fn.apply(self, arguments);		
				});
				return self;	
			},	
			
			unbind: function(name) {
				input.unbind(name.replace("on", "uploadify"));
				return self;	
			}
				
		});
		
		
		// define callbacks	
		$.each("Select,BeforeStart,Start,Cancel,Error,Progress,Complete,AllComplete".split(","), function(i, name) {
			
			name = "on" + name;
			
			// configuration
			if ($.isFunction(conf[name])) {
				self.bind(name, conf[name]);	
			}			
				
			// API method	
			self[name] = function(fn) {
				return self.bind(name, fn);	
			};
			
		});
		
		
		// assign callbacks (to the end of queue)
		self.onSelect(function(event, fileId, file) {
			
			// root for the items
			var items = self.getProgressItems();
			
			if (!items.length) {
				items = $("<div/>").addClass(css.items);
				progress.append(items);
			}
			
			// single item
			var item = $("#" + fileId), am = items.find("." + css.item).length;

			
			// queue is full
			if (am == conf.queueSizeLimit) {
				var old = items.children(":first");
				api.cancelFileUpload(old.attr("id"), true, true);
				old.remove();	
			}
			
			// add to queue
			if (!item.length) {
				item = $("<div><small/><span/></div>").attr("id", fileId).addClass(css.item);
				item.find("small").html(prettyPrint(file));
				items.append(item);	
			}
			
			if (conf.autoStart) {
				self.start();	
			}
			
		});

		
		self.onStart(function() {
			progress.addClass(css.active);
		});
		
		self.onComplete(function() {
			progress.removeClass(css.active);
			api.clearFileUploadQueue(false);			
		});
		
		self.onProgress(function(event, fileId, file, data) {				
			var item = $("#" + fileId);	
			item.find("span").css({display: 'block', width: data.percentage + "%"});
		});
		
	}
		
	/* Flash API
		cancelFileUpload(key, true, true)
		startFileUpload(fileId || null, true)
		startFileUpload(null, true)
		updateSettings(settingName, settingValue)
		startFileUpload(ID, false)
		cancelFileUpload(ID, true, false)
		clearFileUploadQueue(false)
 	*/
	
	// jQuery plugin implementation
	$.fn.upload = function(conf) { 
			
		// already constructed --> return API
		var el = this.eq(typeof conf == 'number' ? conf : 0).data("upload");
		if (el) { return el; }		  
		
		conf = $.extend(true, $.extend({}, tool.conf), conf);
		
		this.each(function(index) {			
			el = new Upload($(this), conf);
			$(this).data("upload", el, index);	
		});
		
		return conf.api ? el: this; 
		
	}; 
	
})();

	




