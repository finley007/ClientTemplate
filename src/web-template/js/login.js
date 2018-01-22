var app = app || {};
/**
 * mailCtrl
 * @namespace urx.mailCtrl
 */
app.login = app.login || {};
(function($) {
    app.login = {

        emailRegx: new RegExp(/email/),
        pwdRegx: new RegExp(/pwd/),

        init: function() {
            $('#login-form').submit(app.login.login);
            $('#username').bind('input', function() {
                $('#username-error').text('').addClass('hide');
            });
            $('#password').bind('input', function() {
                $('#pwd-error').text('').addClass('hide');
            });
        },

        login: function() {
            var username = $('#username').val();
            var password = $('#password').val();
            if (username === '') {
                $('#username-error').removeClass('hide').text('请输入邮箱');
                return false;
            } else if (!app.login.emailRegx.test(username)) {
                $('#username-error').removeClass('hide').text('邮箱格式不正确');
                return false;
            }
            if (password === '') {
                $('#pwd-error').removeClass('hide').text('请输入密码');
                return false;
            } else if (!app.login.pwdRegx.test(password)) {
                $('#pwd-error').removeClass('hide').text('密码格式不合要求');
                return false;
            }
            $.when(app.authService.login(username, password)).then(
                function(res) {
                    console.log(res);
                    console.log('ok');
                },
                function(err) {
                    console.log('err');
                }
            );
            return false;
        }

    }

    app.login.init();
})(jQuery);