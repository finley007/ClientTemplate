"use strict";
var app = app || {};
/** @namespace */
app.authService = app.authService || {};
(function($) {
    app.authService = {
        userInfo: {},
        /**
         * 登录服务
         * @return {promise}
         */
        login: function(username, password) {
            var deferred = jQuery.Deferred();
            app.util.showSpinner();
            jQuery.ajax({
                    url: "http://" + ENV.constant.server + "/myApp/api/register.json",
                    dataType: "json",
                    timeout: 30000,
                    cache: false
                })
                .done(function(data) {
                    console.log(JSON.stringify(data));
                    if (data.user && data.user !== 'Unauthenticated') {
                        deferred.resolve({ isLoggedin: true });
                    } else {
                        deferred.resolve({ isLoggedin: false });
                    }
                    // app.util.hideSpinner();
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    if (textStatus.statuscode) {
                        var FCode = textStatus.statuscode;
                    } else {
                        var FCode = "000";
                    }
                    deferred.reject({ isLoggedin: false, result: "error", errorCode: FCode });
                });
            return deferred.promise();
        }
    }
})(jQuery);