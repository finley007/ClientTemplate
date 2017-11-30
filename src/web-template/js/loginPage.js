//Load common code that includes config, then load the app logic for this page.
requirejs(['./common'], function(common) {
    require.config({
        paths: {
            loginModule: '../app/login'
        }　　
    });
    require(['loginModule'], function(loginModule) {
        loginModule.initPage();　　
    });
});