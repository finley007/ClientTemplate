'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-connect-apimock');

    var handlebars = require('handlebars');

    var config = {
        // configurable paths
        src: 'src/web-template',
        dev: 'dev/web-template',
        dist: 'dist/web-template'
    };

    grunt.initConfig({
        connect: {
          options: {
                port: 8000,
                hostname: 'localhost',
                middleware: function (connect) {
                    var middlewares = [];
                    //add the apimock middleware to connect 
                    middlewares.push(require('grunt-connect-apimock/lib/apimock').mockRequest);
                    return middlewares;
                }
          },
          apimock: {
            //apimock configuration 
            url: '/myApp/api/',
            dir: 'mock'
          }
        },

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

    grunt.registerTask('mock', ['configureApimock', 'connect', 'watch']);
};