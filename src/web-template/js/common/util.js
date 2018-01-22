var app = app || {};
/** @namespace */
app.util = app.util || {};
(function($) {
    "use strict";
    app.util = {
        /**
         * version name
         * @type {String}
         */
        version: "v2",
        /**
         * locale active default locale
         * @type {String}
         */
        locale: "us-en",
        /**
         * Trigger Initial methods when js get loaded.
         */
        init: function() {

        },

        showSpinner: function() {
            if ( $("#spinner").length > 0) {
                $('#spinner').removeClass('hide');
            } else {
                $('body').append('<div id="spinner"></div>');
            } 
        },

        hideSpinner: function() {
            if ( $("#spinner").length > 0) {
                $('#spinner').addClass('hide');
            }
        }

    };

    app.util.init();

})(jQuery);