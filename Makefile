VERSION=1.2.6
DATE=$(git log -1 --pretty=format:%ad)
VER = sed "s/@VERSION/${VERSION}/"

concat:
	mkdir -p build
	cat   src/dateinput/dateinput.js\
			src/overlay/overlay.js\
			src/overlay/overlay.apple.js\
			src/rangeinput/rangeinput.js\
			src/scrollable/scrollable.js\
			src/scrollable/scrollable.autoscroll.js\
			src/scrollable/scrollable.navigator.js\
			src/tabs/tabs.js\
			src/tabs/tabs.slideshow.js\
			src/toolbox/toolbox.expose.js\
			src/toolbox/toolbox.flashembed.js\
			src/toolbox/toolbox.history.js\
			src/toolbox/toolbox.mousewheel.js\
			src/tooltip/tooltip.js\
			src/tooltip/tooltip.dynamic.js\
			src/tooltip/tooltip.slide.js\
			src/validator/validator.js | ${VER}  > build/jquery.tools.js

closure: concat
	java -jar lib/compiler.jar --js build/jquery.tools.js --js_output_file jquery.tools.min.js

uglify: concat
	uglifyjs -nc build/jquery.tools.js > build/jquery.tools.min.js