"use strict";
// 登录的相关逻辑在该模块中实现
define(function(require) {

    var $ = require('jquery');

    var loginModule = {
        //初始化界面
        initPage: function() {
            console.log("Init login page");
            $('#submit').click(function(event) {
                if (!loginModule.login()) {
                    event.preventDefault();
                }
            });

        },

        //监听事件
        //submit监听
        login: function() {
            var uname = $('#username').val(),
                pwd = $('#password').val();
            if (uname === "") {
                loginModule.invalidUsernameHint();
                return false;
            }
            if (pwd === "") {
                loginModule.invalidUserHint();
                return false;
            }
            return true;
        },


        //错误提示
        //用户名
        invalidUsernameHint: function() {
            alert("用户名不能为空");
        },

        //密码
        invalidUserHint: function() {
            alert("密码不能为空");
        }
    };

    return loginModule;
});