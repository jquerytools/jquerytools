/**
 * @license 
 * jQuery Tools @VERSION / Flashembed - New wave Flash embedding
 * 
 * COPRYRIGHT IS FOR LOSERS (do whatever you want)
 * 
 * http://flowplayer.org/tools/toolbox/flashembed.html
 *
 * Since : March 2008
 * Date  : @DATE 
 */ 
(function() {  
		
//{{{ utility functions 
		
var jQ = typeof jQuery == 'function';

var options = {
	
	// very common opts
	width: '100%',
	height: '100%',		
	
	// flashembed defaults
	allowfullscreen: true,
	allowscriptaccess: 'always',
	quality: 'high',	
	
	// flashembed specific options
	version: null,
	onFail: null,
	expressInstall: null, 
	w3c: false,
	cachebusting: false 
};

if (jQ) {
		
	// tools version number
	jQuery.tools = jQuery.tools || {version: '@VERSION'};
	
	jQuery.tools.flashembed = {  
		conf: options
	};		
}


// from "Pro JavaScript techniques" by John Resig
function isDomReady() {
	
	if (domReady.done)  { return false; }
	
	var d = document;
	if (d && d.getElementsByTagName && d.getElementById && d.body) {
		clearInterval(domReady.timer);
		domReady.timer = null;
		
		for (var i = 0; i < domReady.ready.length; i++) {
			domReady.ready[i].call();	
		}
		
		domReady.ready = null;
		domReady.done = true;
	} 
}

// if jQuery is present, use it's more effective domReady method
var domReady = jQ ? jQuery : function(f) {
	
	if (domReady.done) {
		return f();	
	}
	
	if (domReady.timer) {
		domReady.ready.push(f);	
		
	} else {
		domReady.ready = [f];
		domReady.timer = setInterval(isDomReady, 13);
	} 
};	


// override extend opts function 
function extend(to, from) {
	if (from) {
		for (key in from) {
			if (from.hasOwnProperty(key)) {
				to[key] = from[key];
			}
		}
	}
	
	return to;
}	


// JSON.asString() function
function asString(obj) {
	 
	switch (typeOf(obj)){
		case 'string':
			obj = obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1');
			
			// flash does not handle %- characters well. transforms "50%" to "50pct" (a dirty hack, I admit)
			obj = obj.replace(/^\s?(\d+\.?\d+)%/, "$1pct");
			return '"' +obj+ '"';
			
		case 'array':
			return '['+ map(obj, function(el) {
				return asString(el);
			}).join(',') +']'; 
			
		case 'function':
			return '"function()"';
			
		case 'object':
			var str = [];
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					str.push('"'+prop+'":'+ asString(obj[prop]));
				}
			}
			return '{'+str.join(',')+'}';
	}
	
	// replace ' --> "  and remove spaces
	return String(obj).replace(/\s/g, " ").replace(/\'/g, "\"");
}


// private functions
function typeOf(obj) {
	if (obj === null || obj === undefined) { return false; }
	var type = typeof obj;
	return (type == 'object' && obj.push) ? 'array' : type;
}


// version 9 bugfix: (http://blog.deconcept.com/2006/07/28/swfobject-143-released/)
if (window.attachEvent) {
	window.attachEvent("onbeforeunload", function() {
		__flash_unloadHandler = function() {};
		__flash_savedUnloadHandler = function() {};
	});
}

function map(arr, func) {
	var newArr = []; 
	for (var i in arr) {
		if (arr.hasOwnProperty(i)) {
			newArr[i] = func(arr[i]);
		}
	}
	return newArr;
}
	
function getHTML(p, c) {
		
	var e = extend({}, p);	 
	var ie = document.all;	
	var html = '<object width="' +e.width+ '" height="' +e.height+ '"';
	
	// force id for IE or Flash API cannot be returned
	if (ie && !e.id) {
		e.id = "_" + ("" + Math.random()).slice(9);
	}
	
	if (e.id) {	
		html += ' id="' + e.id + '"';	
	}
	
	// prevent possible caching problems
	if (e.cachebusting) {
		e.src += ((e.src.indexOf("?") != -1 ? "&" : "?") + Math.random());		
	}			
	
	if (e.w3c || !ie) {
		html += ' data="' +e.src+ '" type="application/x-shockwave-flash"';		
	} else {
		html += ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"';	
	}
	
	html += '>'; 
	
	if (e.w3c || ie) {
		html += '<param name="movie" value="' +e.src+ '" />'; 	
	}

	// parameters
	e.width = e.height = e.id = e.w3c = e.src = null;
	
	for (var k in e) {
		if (e[k] !== null) {
			html += '<param name="'+ k +'" value="'+ e[k] +'" />';
		}
	}	

	// flashvars
	var vars = "";
	
	if (c) {
		for (var key in c) {
			if (c[key] !== null) {
				vars += key +'='+ (typeof c[key] == 'object' ? asString(c[key]) : c[key]) + '&';
			}
		}
		vars = vars.slice(0, -1);
		html += '<param name="flashvars" value=\'' + vars + '\' />';
	}
	
	html += "</object>";	
	
	return html;

}

//}}}


function Flash(root, opts, flashvars) {
	
	var version = flashembed.getVersion(); 
	
	// API methods for callback
	extend(this, {
			
		getContainer: function() {
			return root;	
		},
		
		getConf: function() {
			return opts;	
		},
	
		getVersion: function() {
			return version;	
		},	
		
		getFlashvars: function() {
			return flashvars;	
		}, 
		
		getApi: function() {
			return root.firstChild;	
		}, 
		
		getHTML: function() {
			return getHTML(opts, flashvars);	
		}
		
	});

	// variables	
	var required = opts.version; 
	var express = opts.expressInstall;
	
	
	// everything ok -> generate OBJECT tag 
	var ok = !required || flashembed.isSupported(required);
	
	if (ok) {
		opts.onFail = opts.version = opts.expressInstall = null;
		root.innerHTML = getHTML(opts, flashvars);
		
	// fail #1. express install
	} else if (required && express && flashembed.isSupported([6,65])) {
		
		extend(opts, {src: express});
		
		flashvars = {
			MMredirectURL: location.href,
			MMplayerType: 'PlugIn',
			MMdoctitle: document.title
		};
		
		root.innerHTML = getHTML(opts, flashvars);	
		
	// fail #2. 
	} else { 
	
		// fail #2.1 custom content inside container
		if (root.innerHTML.replace(/\s/g, '') !== '') {
			// minor bug fixed here 08.04.2008 (thanks JRodman)			
		
		// fail #2.2 default content
		} else {			
			root.innerHTML = 
				"<h2>Flash version " + required + " or greater is required</h2>" + 
				"<h3>" + 
					(version[0] > 0 ? "Your version is " + version : "You have no flash plugin installed") +
				"</h3>" + 
				
				(root.tagName == 'A' ? "<p>Click here to download latest version</p>" : 
					"<p>Download latest version from <a href='http://www.adobe.com/go/getflashplayer'>here</a></p>");
				
			if (root.tagName == 'A') {	
				root.onclick = function() {
					location.href= 'http://www.adobe.com/go/getflashplayer';
				};
			}				
		}
	}
	
	// onFail
	if (!ok && opts.onFail) {
		var ret = opts.onFail.call(this);
		if (typeof ret == 'string') { root.innerHTML = ret; }	
	}
	
	// http://flowplayer.org/forum/8/18186#post-18593
	if (document.all) {
		window[opts.id] = document.getElementById(opts.id);
	} 
	
}

window.flashembed = function(root, conf, flashvars) {   
	
//{{{ construction
	
	// root must be found / loaded	
	if (typeof root == 'string') {
		var el = document.getElementById(root);
		if (el) {
			root = el;	
		} else {
			domReady(function() {
				flashembed(root, conf, flashvars);
			});
			return; 		
		} 
	}
	
	// not found
	if (!root) { return; }
	
	if (typeof conf == 'string') {
		conf = {src: conf};	
	}
	
	var opts = extend({}, options);
	extend(opts, conf);		
	
	return new Flash(root, opts, flashvars);
	
//}}}
	
	
};


//{{{ static methods

extend(window.flashembed, {

	// returns arr[major, fix]
	getVersion: function() {
	
		var version = [0, 0];
		
		if (navigator.plugins && typeof navigator.plugins["Shockwave Flash"] == "object") {
			var _d = navigator.plugins["Shockwave Flash"].description;
			if (typeof _d != "undefined") {
				_d = _d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				var _m = parseInt(_d.replace(/^(.*)\..*$/, "$1"), 10);
				var _r = /r/.test(_d) ? parseInt(_d.replace(/^.*r(.*)$/, "$1"), 10) : 0;
				version = [_m, _r];
			}
			
		} else if (window.ActiveXObject) {

			try { // avoid fp 6 crashes
				var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
				
			} catch(e) {
				
				try { 
					_a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
					version = [6, 0];
					_a.AllowScriptAccess = "always"; // throws if fp < 6.47 
					
				} catch(ee) {
					if (version[0] == 6) { return version; }
				}
				try {
					_a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				} catch(eee) {
				
				}
				
			}
			
			if (typeof _a == "object") {
				_d = _a.GetVariable("$version"); // bugs in fp 6.21 / 6.23
				if (typeof _d != "undefined") {
					_d = _d.replace(/^\S+\s+(.*)$/, "$1").split(",");
					version = [parseInt(_d[0], 10), parseInt(_d[2], 10)];
				}
			}
		} 
		
		return version;
	},
	
	isSupported: function(version) {
		var now = flashembed.getVersion();
		var ret = (now[0] > version[0]) || (now[0] == version[0] && now[1] >= version[1]);			
		return ret;
	},
	
	domReady: domReady,
	
	// returns a String representation from JSON object 
	asString: asString,
	
	
	getHTML: getHTML
	
});

//}}}


// setup jquery support
if (jQ) {
	
	jQuery.fn.flashembed = function(conf, flashvars) {
		
		var el = null;
		
		this.each(function() { 
			el = flashembed(this, conf, flashvars);
		});
		
		return conf.api === false ? this : el;		
	};

}

})();
