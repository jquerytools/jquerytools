
(function($) {
  $.fn.accordion = function(options) {
    var DEFAULTS = {
      orientation: "vertical",
      min: 0,
      max: 200,
      sticky: false,
      event: "mouseenter",
      duration: 500,
      pane: ".pane",
      defaultPane: 0
    };
    
    options = $.extend(DEFAULTS, options);
  
    this.each(function() {
      var panes = $(options.pane, this);
      var currentPane;
      var dummy = document.createElement("span");
      
      if (panes.length) {
        if (options.orientation == "vertical") {
          var STYLE_PROPERTY = "height";
          var OFFSET_PROPERTY = "offsetHeight";
        } else {
          STYLE_PROPERTY = "width";
          OFFSET_PROPERTY = "offsetWidth";
          
          $(this).next().css({clear: "left"});
          var lastPane = panes.get(panes.length - 1);
          $(this).css({
            width:  lastPane.offsetLeft + lastPane.offsetWidth - panes[0].offsetLeft,
            height: lastPane.offsetHeight,
            overflow: "hidden"
          });
        }

        var size = panes[0][OFFSET_PROPERTY];
        
        panes.bind(options.event, function() {
          currentPane = this;
          animatePanes(options.max, options.min);
        });

        if (options.sticky) {
          currentPane = panes.get(options.defaultPane);
          animatePanes(options.max, options.min, 1);
        } else {
          $(this).mouseleave(function() {
            animatePanes(size);
          });
        }
      }

      function animatePanes(max, min, duration) {
        if (!currentPane) return;

        if (duration == null) duration = options.duration;

        var totalSize = size * panes.length;

        var sizes = [];
        panes.each(function(i) {
          sizes[i] = this[OFFSET_PROPERTY];
        });

        var collapsedSize = min || Math.round((totalSize - max) / (panes.length - 1));
        
        $(dummy).stop();
        dummy.style.step = 0;
        $(dummy).animate({step: 1}, {
          duration: duration,
          easing: options.easing,
          step: function(step) {
            var expandedSize = totalSize;
            for (var i = 0, pane; pane = panes[i]; i++) {
              if (pane != currentPane) {
                var value = sizes[i] + Math.round(step * (collapsedSize - sizes[i]));
                if (value < 0) value = 0;
                pane.style[STYLE_PROPERTY] = value + "px";
                expandedSize -= value;
              }
            }
            currentPane.style[STYLE_PROPERTY] = expandedSize + "px";
          }
        });
      };
    });
  };
})(jQuery);
