module.exports = function( grunt ) {
    "use strict";

    var srcHintOptions = grunt.file.readJSON( "src/.jshintrc" );

    grunt.initConfig({
        jshint: {
            all: {
                src: [
                    "src/**/*.js", "Gruntfile.js"
                ],
                options: {
                    jshintrc: true
                }
            },
            dist: {
                src: "dist/jquery.tools.js",
                options: srcHintOptions
            }
        },
        build: {
            all: {
                dest: "dist/jquery.tools.js",
                src: [
                    "src/**/*.js"
                ],
            }
        },
        clean: {
            all: {
                src: "dist/*.js"
            }
        },
        uglify: {
            all: {
                files: {
                    "dist/jquery.tools.min.js": [ "dist/jquery.tools.js" ]
                },
                options: {
                    preserveComments: false,
                    sourceMap: "dist/jquery.tools.min.map",
                    sourceMappingURL: "jquery.tools.min.map",
                    report: "min",
                    beautify: {
                        ascii_only: true
                    },
                    compress: {
                        hoist_funs: false,
                        loops: false,
                        unused: false
                    }
                }
            }
        }
    });

    grunt.registerMultiTask("clean", "Removed Concatenated source files", function() {
        this.filesSrc.forEach(function(filename){
            grunt.file.delete(filename);
        });
    });

    grunt.registerMultiTask("build", "Concatenate source files", function() {
        var out = [];
        this.filesSrc.forEach(function(filename){
            out.push(grunt.file.read(filename));
        });
        grunt.file.write(this.data.dest, out.join('\n'));
    });

    require( "load-grunt-tasks" )( grunt );
    grunt.registerTask( "default", [ "clean", "build", "jshint", "uglify" ] );
};
