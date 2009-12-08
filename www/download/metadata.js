
// meta information for the download page
{
	name: 'jquery',
	title: 'jQuery library',
	description: 'All tools except flashembed are dependent on this library. Can alternatively be included from googleapis (see below)',
	file: '/js/jquery',
	www: 'http://jquery.com'
},

{
	name: 'tabs',
	title: 'Tabs',
	description: 'The most important UI widget on the web',
	file: '/js/tools/tools.tabs',
	www: '/tools/tabs.html',
	requires: 'jQuery'
},

	{
		name: 'tabs.slideshow',
		title: 'Slideshow plugin',
		plugin: true,
		description: 'Transforms tabs into a working slideshow',
		file: '/js/tools/tools.tabs.slideshow',
		www: '/tools/tabs.html#slideshow',
		requires: 'Tabs'
	},

	{
		name: 'tabs.history',
		title: 'History plugin',
		plugin: true,
		description: 'The ability to navigate through tabs with the browser\'s back and forward buttons',
		file: '/js/tools/tools.tabs.history',
		www: '/tools/tabs.html#history',
		requires: 'Tabs'
	},



{
	name: 'tooltip',
	title: 'Tooltip',
	description: 'The second most important UI widget on the web. You are looking at one right now.',
	file: '/js/tools/tools.tooltip',
	www: '/tools/tooltip.html',
	requires: 'jQuery'
},

	{
		name: 'tooltip.slide',
		title: 'Slide effect',
		plugin: true,
		description: 'A sliding tooltip effect with customized sliding directions, dimensions and speeds',
		file: '/js/tools/tools.tooltip.slide',
		www: '/tools/tooltip.html#slide',
		requires: 'Tooltip'
	},
	
	{
		name: 'tooltip.dynamic',
		title: 'Dynamic positioning plugin',
		plugin: true,
		description: 'Dynamic positioning of the tooltip so that it always stays in the viewport',
		file: '/js/tools/tools.tooltip.dynamic',
		www: '/tools/tooltip.html#dynamic',
		requires: 'Tooltip'
	},


{
	name: 'scrollable',
	title: 'Scrollable',
	description: 'A generic HTML scrolling widget',
	file: '/js/tools/tools.scrollable',
	www: '/tools/scrollable.html',
	requires: 'jQuery'
},


	{
		name: 'scrollable.circular',
		title: 'Circular plugin',
		plugin: true,
		description: 'Makes an infinite loop from the scrollable items so that there is no beginning or end',
		file: '/js/tools/tools.scrollable.circular',
		www: '/tools/overlay.html#circular',
		requires: 'Scrollable'
	},

	{
		name: 'scrollable.autoscroll',
		title: 'Autoscroll plugin',
		plugin: true,
		description: 'Makes the scrolling behaviour automatic. highly configurable',
		file: '/js/tools/tools.scrollable.autoscroll',
		www: '/tools/overlay.html#autoscroll',
		requires: 'Scrollable'
	},

	{
		name: 'scrollable.navigator',
		title: 'Navigator plugin',
		plugin: true,
		description: 'Provides navigation buttons for switching between pages in scrollable',
		file: '/js/tools/tools.scrollable.navigator',
		www: '/tools/overlay.html#navigator',
		requires: 'Scrollable'
	},

	{
		name: 'scrollable.mousewheel',
		title: 'Mousewheel plugin',
		plugin: true,
		description: 'Enables mousewheel support for scrollable',
		file: '/js/tools/tools.scrollable.mousewheel',
		www: '/tools/overlay.html#mousewheel',
		requires: 'Scrollable'
	},


{
	name: 'overlay',
	title: 'Overlay',
	description: 'A generic HTML overlaying widget',
	file: '/js/tools/tools.overlay',
	www: '/tools/overlay.html',
	requires: 'jQuery'
},

	{
		name: 'overlay.gallery',
		title: 'Gallery plugin',
		plugin: true,
		description: 'A plugin for creating "lightbox" style image galleries',
		file: '/js/tools/tools.overlay.gallery',
		www: '/tools/overlay.html#gallery',
		requires: 'Overlay'
	},

	{
		name: 'overlay.apple',
		title: 'Apple effect',
		plugin: true,
		description: 'An overlay effect that you have seen on apple.com',
		file: '/js/tools/tools.overlay.apple',
		www: '/tools/overlay.html#apple',
		requires: 'Overlay'
	},

{
	name: 'expose',
	title: 'Expose',
	description: 'Makes your HTML stand out from its surroundings',
	file: '/js/tools/tools.expose',
	www: '/tools/expose.html',
	requires: 'jQuery'
},

{
	name: 'flashembed',
	title: 'Flashembed',
	description: 'The future of Flash embedding. Works as a standalone tool and jQuery is not required. flowplayer.js <em>contains</em> this script.',
	file: '/js/tools/tools.flashembed',
	www: '/tools/flashembed.html'
},

{
	name: 'js_core',
	title: 'Flowplayer.js',
	description: 'The JavaScript component of Flowplayer - the Video player for the Web',
	file: '/js/flowplayer',
	www: '/documentation/api/index.html'
},

	{
		name: 'js_controls',
		title: 'Controlbar plugin',
		plugin: true,
		description: 'Generate video controls with HTML and CSS',
		file: '/js/flowplayer.controls',
		www: '/plugins/javascript/controlbar.html',
		requires: 'flowplayer.js'
	},

	{
		name: 'js_playlist',
		title: 'Playlist plugin',
		plugin: true,
		description: 'Generate video playlists with HTML and CSS',
		file: '/js/flowplayer.playlist',
		www: '/plugins/javascript/playlist.html',
		requires: 'flowplayer.js'
	},

	{
		name: 'js_embed',
		title: 'Embedding plugin',
		plugin: true,
		description: 'Generates embedding codes for Flowplayer',
		file: '/js/flowplayer.embed',
		www: '/plugins/javascript/embed.html',
		requires: 'flowplayer.js'
	}

