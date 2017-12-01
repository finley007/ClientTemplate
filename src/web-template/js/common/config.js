"use strict";
// 配置类
define(function() {

    function Config(env = 'default') {
        this.env = env;
    }

    var constants = {
        default: {
            server: 'http://localhost',
        },
        development: {
            server: '',
        },
        test: {
            server: '',
        },
        production: {
            server: '',
        }
    };

    Config.prototype = {
        getConfig: function(key) {
            if (!this.env) {
                this.env = 'default';
            }
            return constants[this.env][key];
        },

        getLoginURL: function() {
            return this.getConfig('server') + '/login';
        }
    }

    return Config;
});