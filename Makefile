VERSION=1.2.6
DATE=$(git log -1 --pretty=format:%ad)
META = sed "s/@VERSION/${VERSION}/;s/@DATE/${DATE}/;"

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
			src/validator/validator.js | ${META}  > build/jquery.tools.js

concat_tiny:
	mkdir -p build
	cat   src/overlay/overlay.js\
			src/scrollable/scrollable.js\
			src/tabs/tabs.js\
			src/tooltip/tooltip.js | ${META}  > build/jquery.tools.tiny.js


concat_form:
	mkdir -p build
	cat   src/dateinput/dateinput.js\
			src/rangeinput/rangeinput.js\
			src/validator/validator.js | ${META}  > build/jquery.tools.form.js


concat_ui: concat_tiny
	cat  lib/jquery-1.6.4.min.js\
			build/jquery.tools.tiny.js > build/jquery.tools.ui.js

concat_full: concat
	cat  lib/jquery-1.6.4.min.js\
			build/jquery.tools.js > build/jquery.tools.full.js

closure: concat
	java -jar lib/compiler.jar --js build/jquery.tools.js --js_output_file jquery.tools.min.js

uglify: concat
	mkdir -p build/all
	uglifyjs -nc build/jquery.tools.js > build/all/jquery.tools.min.js

uglify_full: concat_full
	mkdir -p build/full
	uglifyjs -nc build/jquery.tools.full.js > build/full/jquery.tools.min.js

uglify_tiny: concat_tiny
	mkdir -p build/tiny
	uglifyjs -nc build/jquery.tools.tiny.js > build/tiny/jquery.tools.min.js

uglify_form: concat_form
	mkdir -p build/form
	uglifyjs -nc build/jquery.tools.form.js > build/form/jquery.tools.min.js

uglify_ui: concat_ui
	mkdir -p build/ui
	uglifyjs -nc build/jquery.tools.ui.js > build/ui/jquery.tools.min.js

uglify_release: uglify_tiny uglify_form uglify uglify_ui uglify_full