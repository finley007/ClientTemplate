'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var handlebars = require('handlebars');

    var config = {
        // configurable paths
        src: 'src/web-template',
        dev: 'dev/web-template',
        dist: 'dist/web-template'
    };

    grunt.initConfig({
        config: config,
        serve: {
            options: {
                port: 8080,
                serve: {
                    path: './dev/web-template/'
                }
            }
        },

        watch: {
            options: {
                // these two options significantly decrease execution time
                spawn: false,
                interrupt: true
            },

            deploy: {
                files: ['<%= config.src %>/**/*'],
                tasks: ['copy:dev']
            }
        },

        copy: {
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.src %>',
                    dest: '<%= config.dev %>',
                    src: [
                        './**/*'
                    ]
                }]
            },

            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.src %>',
                    dest: '<%= config.dist %>',
                    src: [
                        './**/*'
                    ]
                }]
            }
        },

        clean: ['dev', 'dest']
    });

    grunt.registerTask('dev', [
        'clean',
        'copy:dev',
        'serve'
    ]);

    grunt.registerTask('dist', [

    ]);

    grunt.registerTask('default', ['dev']);
};