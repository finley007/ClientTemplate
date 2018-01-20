'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-connect-apimock');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    var handlebars = require('handlebars');

    var config = {
        // configurable paths
        src: 'src/web-template',
        dev: 'dev/web-template',
        dist: 'dist/web-template',
        lib: 'lib'
    };

    grunt.initConfig({
        config: config,

        concat: {
            options: {
                stripBanners: true,
                banner: '/*! Comment for app */'
            },
            dev: {
                src: ['<%= config.src %>/**/*.js'],
                dest: 'dev/web-template/js/app.js'
            }
        },

        uglify: {
            dev: {
                options: {
                    mangle: false, //混淆变量名
                    preserveComments: 'false' //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
                },
                src: 'dev/web-template/js/app.js',
                dest: 'dev/web-template/js/app.min.js'
            }
        },

        connect: {
            options: {
                port: 8000,
                hostname: 'localhost',
                middleware: function(connect) {
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
            lib: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.lib %>/js',
                    dest: '<%= config.dev %>/js/lib',
                    src: [
                        './**/*'
                    ]
                }]
            },
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.src %>',
                    dest: '<%= config.dev %>',
                    src: [
                        './**/*.html',
                        './**/*.css',
                        './**/*.jpg'
                    ]
                }]
            }
        },

        clean: ['dev', 'dest']
    });

    grunt.registerTask('mock', [
        'configureApimock',
        'connect',
        'watch'
    ]);

    grunt.registerTask('dev', [
        'clean',
        'concat',
        'uglify',
        'copy',
        'serve'
    ]);

    grunt.registerTask('dist', [

    ]);

    grunt.registerTask('default', ['dev']);

};