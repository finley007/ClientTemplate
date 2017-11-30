//The build will inline common dependencies into this file.

//For any third party dependencies, like jQuery, place them in the lib folder.

//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    baseUrl: 'js/lib',
    paths: {
        jquery: 'jquery-3.2.1.min',
        bootstrap: 'bootstrap.min',
        underscore: 'underscore-min'
    }
});
