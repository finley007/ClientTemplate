var app = app || {};
/** @namespace */
app.Util = app.Util || {};
(function($) {
    "use strict";
    urx.Util = {
      /**
       * version name
       * @type {String}
       */
        version: "v2",
        /**
         * locale active default locale
         * @type {String}
         */
        locale:"us-en",
        /**
         * Trigger Initial methods when js get loaded.
         */
        init: function(){
            urx.jsDir = urx.Util.getUrxScript();
            urx.jsDir = urx.jsDir.substring(0, urx.jsDir.lastIndexOf('/'));
            urx.Util.loadCss();
            urx.Util.loadInitialAssets();
            urx.Util.getClientInfo();
            urx.Util.tracklinkMouseDown();
            urx.Util.updateTClink();
            urx.Util.loadPlugins();
            urx.Observer('modalrendered').subscribe(function(){
              urx.Util.cacheElementObjects();
              urx.Util.loadCaptcha();
              if(window.urxData && urxData.segmentKey) {
                // Bluemix related forms identified as bluemix staging/production ('bms' or 'bmp') will use bluemixAnalytics
                if (urx.Util.isBluemix()) {
                    urx.Util.loadBmxAnalytics();
                } else {
                    urx.Observer("readyToCallCampaign").publish();
                    urx.Util.loadSegment();
                }
              }else if(window.urxData){
                    urx.Observer("readyToCallCampaign").publish();
              }
            });
        },
        /**
         * trigger methods to load constant file, error messages and locale info
         * @return {promise}
         */
        loadInitialAssets: function(){
          $.when(urx.Util.loadConstant()).done(function(){
            $.when(
              urx.localeService.loadLocaleFile(),
              $.Deferred(function( deferred ){
              $( deferred.resolve );
            })
            ).done(function(){
                console.log("urx.ENV",ENV);
                console.warn("AppReady");
                urx.Observer("AppReady").publish();
            });
          });
        },
        /**
         * cache update account form object
         */
        cacheElementObjects: function(){
            urx.updateFormObj = $('#updateAccount-form');
        },
        /**
         * set data provider details, demandbase or userinput or social
         */
        setProvidersDetails : function() {
            var fields = [];
            urx.countryProvider = "userinput";
            urx.companyProvider = "userinput";
            urx.stateProvider = "userinput";
            urx.industryProvider = "userinput";
            urx.isStudentRequired = false;
            urx.isFirstTimeUserRequired = false;
            urx.isPhoneRequired = false;

            var steps = urx.modalState ? urx.modalState.state.steps : [];

            jQuery.each(steps, function(i, page) {
            	jQuery.each(page, function(i, field) {
            		fields = fields.concat(field);
            	});
            });

            if (jQuery.inArray("country", fields) == -1) {
            	urx.countryProvider = "demandBase";
                urx.stateProvider = "demandBase";
            }
            if (jQuery.inArray("company", fields) == -1) {
            	urx.companyProvider = "demandBase";
            }
            if (jQuery.inArray("industry", fields) == -1) {
            	urx.industryProvider = "demandBase";
            }

            if (jQuery.inArray("isStudent", fields) > 0) {
            	urx.isStudentRequired = true;
            }
            if (jQuery.inArray("isFirstTimeUser", fields) > 0) {
            	urx.isFirstTimeUserRequired = true;
            }
            if (jQuery.inArray("phone", fields) > 0) {
            	urx.isPhoneRequired = true;
            } 
        },
        /**
         * determine urx js url
         * @return {string}
         */
        getUrxScript:function() {
            if (document.currentScript) { // support defer & async (mozilla only)
                return document.currentScript.src;
            } else {
                var scripts = document.getElementsByTagName('script');

                for (var i = scripts.length - 1; i >= 0; --i) {
                  var src = scripts[i].src;
                  var l = src.length;

                  var name = 'urx.modal.min.js';
                  var length = name.length;
                  if (src.substr(l - length) == name) {
                    // set a global propery here
                    return src.substr(0, l - length);
                  }
                  name = 'urx.verifyemail.min.js';
                  length = name.length;
                  if (src.substr(l - length) == name) {
                    return src.substr(0, l - length);
                  }
                  name = 'util.js';
                  length = name.length;
                  if (src.substr(l - length) == name) {
                    return src.substr(0, l - length);
                  }
                }
            }
            return '/js/';
        },
        /**
         * load dependend files - jquery.mask.min.js forms.js (if not included to PDP)
         */
        loadPlugins: function(){
            var script_arr = [];
            if(!$().mask){
            	 script_arr.push(urx.jsDir + '/lib/' + 'jquery.mask.min.js');
            }
            if(!IBMCore.common.widget.forms){
               script_arr.push('//1.www.s81c.com/common/v18/js/forms.js');
            }
            urx.Util.getMultiScripts(script_arr).done(function() {
           });
         },
         /**
          * load notice & choice javascript and generate HTML with project terms/privacy link
          */
        loadNoticeChoiceJs: function(){
            if(!$('.urx-form-country').length){
                    $('#register-form').append('<input id="urxCountryInput" class="urx-form-country" value="US" type="hidden"  name="country" />');
            }
            if(urx.Util.demandBaseData.country && urx.Util.demandBaseData.country !== "")
                $('.urx-form-country').val(urx.Util.demandBaseData.country).trigger("change");
            if($('#privacyid').length){
              var tc = window.urxData.licenseAgreementURL || "http://www.ibm.com/legal/us/en/";
                IBMCore.common.meta.page.pageInfo.nc = {
                        id: {
                            form: "register-form",
                            email: "emailAddressLabelLong",
                            privacyDiv: "privacyid",
                            country:"urxCountryInput"
                        },
                        questionType: "AllMedia",
                        questionChoice: "",
                        pageDesc: "Contact IBM form to send email feedback or questions to IBM in the United States", // adopter will provide that
                        offerCode: "",
                        dcSubject: "IM520",
                        granula: "off",
                        footer: "off",
                        trial:  tc,
                        Submit: "false",
                        SaveToGECS: "true",
                        isWidget: "true"
                        };
                if(urx.Util.locale){
                    console.log("change IBMCore.common.meta.page.pageInfo.ibm.cc lc forcefully");
                    var urxLocale = urx.Util.locale.split('-');
                    IBMCore.common.meta.page.pageInfo.ibm.cc = urxLocale[0];
                    IBMCore.common.meta.page.pageInfo.ibm.lc = urxLocale[1];
                }
                var ncUrl = IBMCore.common.util.config.get("jsFilesUrlNC") + "notice-choice.js";
                jQuery.getScript(ncUrl)
                .done(function(){
                  var alcUpdated=false;
                  var attempts=0;
                  var afterLoadContent = function(){
                      var iCheck = $('#privacyid .ibm-styled-checkbox');
                      var checkBox= $('#privacyid input[name=NC_CHECK_AllMedia]');
                      if(iCheck.length && !alcUpdated){
                        urx.Util.addIAgreeCheckBox();
                        $('#urx-permission').find('input[type=checkbox],a').attr('tabindex','1');  
                        alcUpdated=true;
                      }else{
                        console.log('not updated yet');
                            setTimeout(
                              function () {
                              console.log('retry:',attempts);
                                  attempts++;  
                                  if(attempts < 10 && !alcUpdated){

                                    afterLoadContent();
                                  }                                    
                            },800);
                      }
                  };
                  afterLoadContent();
                })
                .fail(function(){
                  $('#privacyid').hide();
                });
            }
        },
        addIAgreeCheckBox: function(){
            if(urx.Util.regType && urx.Util.regType === 'dwn'){
                var acceptCheckbox =  $('<input />', { type: 'checkbox', name:'termsAndCondition',id:'iaccept', 'class':'ibm-styled-checkbox urx-valid' });
                var termsDiv = $('#privacyid').find('p')[1];
                var termsConHtml = $(termsDiv).html();
                $(termsDiv).html('');
                $('<label />', { 'for': 'iaccept', html: termsConHtml, 'class':'ibm-field-label' }).prependTo(termsDiv);
                acceptCheckbox.prependTo(termsDiv);
            }
        },
        /**
         * subscribe to update terms/condition link when modalrender published
         */
        updateTClink: function(){
            urx.Observer('modalrendered').subscribe(urx.Util.showHideLicenceAndPrivacy);
        },
        /**
         * load constant file, publish event to process further actions by other methods or controllers
         */
        loadConstant: function(){
            var rootDir = urx.jsDir.replace('/js','');
            return $.getScript(rootDir+ '/constants.js').done(function( script, textStatus ) {
                var apiPath = ENV.constant.apiPath;
                ENV.constant.cloudantPath = apiPath.replace(/\ibmid+$/, 'urx/form');
                console.log('constant loaded');
                urx.Observer('constantLoaded').publish();
            });
        },
        /**
         * load urx stylesheet
         */
        loadCss: function(){
            var cssDir = urx.jsDir.replace(/js|js/gi,'css');

            $('<link>').attr('rel','stylesheet')
            .attr('type','text/css')
            .attr('href', cssDir +'/urx.modal.css')
            .appendTo('head');
        },
        /**
         * load segment Library file
         */
        loadSegment: function(){
            // unload bmxsegment incase it was loaded from a previous form
            urx.bmxsegment = null;

            if(typeof analytics !='undefined' && typeof analytics.user() !='undefined' && typeof analytics.user().anonymousId() !='undefined'){
                urx.aid=urx.aid || analytics.user().anonymousId();
                urx.Util.initSegmentScript('segment.js');
            }else if(urxData.segmentKey){
                $.getScript('https://cdn.segment.com/analytics.js/v1/'+ urxData.segmentKey +'/analytics.min.js')
                .done(function( script, textStatus ) {
                   urx.aid=urx.aid || analytics.user().anonymousId();
                   urx.Util.initSegmentScript('segment.js');
                })
                .fail(function( jqxhr, settings, exception ) {
                    console.log('error loading analytics.min.js');
                });
            }else{
                console.log('segmentKey not exists');
            }
        },
        /**
         * load bluemix analytics library, which will also pull in the segment library
         */
        loadBmxAnalytics: function(){
            // unload the default segment events and init the bluemix events
            urx.segment = null;

            if(typeof bluemixAnalytics !='undefined' && typeof bluemixAnalytics.getAnonymousId() !='undefined'){
                bluemixAnalytics.getAnonymousId()
                .then(function(anonymousId) {
                    urx.aid = anonymousId;
                    urx.Util.initSegmentScript('bmxAnalytics.js');
                });
                urx.Observer("readyToCallCampaign").publish();
            }else if(urxData.segmentKey){
                // the segment key is specified via _analytics.segment_key for the library
                window._analytics = window._analytics || {};
                window._analytics.segment_key = urxData.segmentKey;
                // the library will perform an identifyWithIUI automatically. skip it.
                window._analytics.skipIdentify = true;
                // tell the library to not load coremetrics. it's already loaded by urx.
                window._analytics.coremetrics = false;
                $.getScript(ENV.constant.analyticsDomain+'/analytics/build/bluemix-analytics.min.js')
                .done(function(script, textStatus) {
                    bluemixAnalytics.getAnonymousId()
                    .then(function(anonymousId) {
                       urx.Observer("readyToCallCampaign").publish();
                       urx.aid = anonymousId;
                       urx.Util.initSegmentScript('bmxAnalytics.js');
                    });
                })
                .fail(function(jqxhr, settings, exception) {
                    console.log('error loading bluemix-analytics.min.js');
                });
            }else{
                urx.Observer("readyToCallCampaign").publish();
                console.log('segmentKey not exists');
            }
        },
        /**
         * load segment controller file and registerEvents for segment 
         */
        initSegmentScript: function(addon){
            if(urx.aid !=='' && window.urxData && window.urxData.targetURL){
                window.urxData.targetURL = urx.Util.updateQueryStringParameter(window.urxData.targetURL,'ajs_aid',urx.aid);
            }
            var segmentFile = urx.jsDir + '/addon/' + addon;
            $.getScript(segmentFile)
              .done(function( script, textStatus ) {
                 if (urx.Util.isBluemix()) {
                     if (urx.bmxsegment) {
                         urx.bmxsegment.registerEvents();
                     }
                 } else {
                     analytics.page();
                     if (urx.segment) {
                         urx.segment.registerEvents();
                     }
                 }
              })
              .fail(function( jqxhr, settings, exception ) {
                  console.log('error loading Custom Segment Event file.');
              });
        },
        /**
         * load the captcha service
         */
        loadCaptcha: function(){
            var captchaFile = ENV.constant.captchaURL;

            if(urx.Util.demandBaseData.country && urx.Util.demandBaseData.country === "CN"){
                console.log("Skip loading segment.");
            }else if(!window.grecaptcha){
                $.getScript(captchaFile)
                .fail(function(jqxhr, settings, exception ) {
                    console.log('error loading captcha file');
                });
            }
        },
        /**
         * updateQueryStringParameter
         * @param   {string}   uri   url to change
         * @param   {string} key   query param key
         * @param   {string} value value of provided query param
         * @returns {string} new updated url
         */
        updateQueryStringParameter: function(uri, key, value) {
          var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
          var separator = uri.indexOf('?') !== -1 ? "&" : "?";
          if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
          }
          else {
            return uri + separator + key + "=" + value;
          }
        },
        /**
         * load Signup Modal dependecy files
         */
        loadRegJsFiles : function(){
             var script_arr = [];
             if(typeof zxcvbn != 'function'){
                 script_arr.push(urx.jsDir + '/lib/' + 'zxcvbn.js');
             }
             if(!$().PasswordStrengthManager) {
                 script_arr.push(urx.jsDir + '/lib/' + 'jquery.password.strength.js');
             }
            urx.Util.getMultiScripts(script_arr).done(function() {
            });
        },
        /**
         * get users details
         */
        getClientInfo: function() {
          urx.Util.getClientAgent();
          urx.Util.checkMobile();
        },
        /**
         * get users browsers details
         */
        getClientAgent: function() {
          urx.Util.clientAgent = "unknown";
          var userAgent = navigator.userAgent || navigator.vendor || window.opera;
          // Windows Phone must come first because its UA also contains "Android"
          if (/windows phone/i.test(userAgent)) {
              urx.Util.clientAgent = "Windows Phone";
          }
          if (/android/i.test(userAgent)) {
              urx.Util.clientAgent = "Android";
          }
          // iOS detection from: http://stackoverflow.com/a/9039885/177710
          if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
              urx.Util.clientAgent = "iOS";
          }
        },
        /**
         * check if user is using mobile
         */
        checkMobile: function() {
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) urx.Util.isMobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
        },
        /**
         * load multiple js files
         * @param   {Array}   arr  array if multiple file paths
         * @param   {string}  path common directory path, Optional
         * @returns {promise} return promise on success or error.
         */
        getMultiScripts: function(arr, path) {
            var _arr = $.map(arr, function(scr) {
                return $.getScript( (path||"") + scr );
            });

            _arr.push($.Deferred(function( deferred ){
                $( deferred.resolve );
            }));

            return $.when.apply($, _arr);
        },
        /**
         * extract error code from response string
         * @param   {object}   data object with message key
         * @returns {string} F series error code
         */
        handleErrorCode: function(data){
            var msg=data.message || "";
            var FCode = "";
            console.log(msg);
            if(msg!=="")
            {
                FCode=msg.split(" ")[0];
                console.log(FCode);

            }else{
                FCode="000";
            }
        return FCode;
        },
        /**
         * @param  {string} countrCode
         * @return {promise}
         */
        getStateList: function(countryCode){
            var deferred = jQuery.Deferred();
            var locale = urx.Util.locale.replace(/[-]/g, "_");
            var lang = locale.split("_")[1] + "_" + locale.split("_")[0];
            jQuery.ajax({
                url:  ENV.constant.statesApi + "?countryCode=" + countryCode + "&lang=" + lang,
                dataType: "json",
                cache:true
            })
            .done(function( data ) {
                deferred.resolve(data.states);
            })
            .fail(function(jqXHR, textStatus, errorThrown){
                deferred.reject({result:"error"});
            });
          return deferred.promise();
        },
        /**
         * validate input field value. display error message/hide accordingly
         * @param   {object} field jquery object
         * @returns {boolean}  true of valid, false if invalid
         */
        validateField: function(field,showError){
            var error= urx.Validate.isInvalid(field);
            var errElm = field;
            var fieldType = $(field).attr('type');
            if(fieldType === 'checkbox'){
                errElm = $(field).next();
            }else if($(field).is("select") && $(field).next().hasClass('select2')){
              errElm = $(field).next();
            }
            console.log(error);
                if(error){
                    if(showError){
                         urx.Util.displayError(errElm, error);
                         urx.Observer("validationError").publish($(field).attr('name'),error);
                    }

                    return false;
                }else{
                    if($(field).val().trim() !== '' && urx.signupCtrl && urx.signupCtrl.idsourceCheckedEmail === $(field).val() && urx.signupCtrl.idsourceError){
                        return false;
                    }else{
                        console.log('remove...');
                        urx.Util.removeError(errElm);
                        return true;
                    }
                }
        },
        /**
         * display error message after input field
         * @param {object} element jquey object
         * @param {string} errMsg  error msg
         */
        displayError: function(element, errMsg, position){
                if($(element).hasClass('urx-radio-wrapper')) {
                  $(element).find('.ibm-styled-radio').addClass("ibm-field-error");
                } else if(!$(element).hasClass('ibm-field-label')){
                  $(element).addClass("ibm-field-error");
                }
                if($(element).next().hasClass("error")){
                  console.log($(element).next().html());
                    $(element).next().html(errMsg).fadeIn();
                }else{
                  console.log($(element).html());
                   var errElm= $('<span class="error ibm-textcolor-red-50 ibm-small"></span>');
                    errElm.html(errMsg);                    
                    if(position){
                      if(position=="append")
                        $(element).append(errElm);
                      else if('before'){
                         $(element).before(errElm);
                      }else{
                        $(element).after(errElm);
                      }
                    }else{
                      $(element).after(errElm);
                    }
                }
        },
        /**
         * @param  {object} element jquery object
         * @param  {string} errMsg message
         */
        displayException : function(element, errMsg){
                /* event triggered */
                urx.Observer("displayException").publish(element, errMsg);

                if($(element).prev().hasClass("urx-exception")){
                    $(element).prev().html(errMsg).fadeIn();
                }else{
                   var errElm= $('<span class="urx-exception ibm-textcolor-red-50 ibm-small" />');
                    errElm.html(errMsg);
                    $(element).before(errElm);

                }
        },
        hideException : function(element){

                if($(element).prev().hasClass("urx-exception")){
                    $(element).prev().html('');
                    $(element).prev().hide();
                }
        },
        /**
         * remove error message after input field
         * @param {object} element jquey object
         *
         */
        removeError: function(element){
                if($(element).hasClass('urx-radio-wrapper')) {
                  $(element).find('.ibm-styled-radio').addClass("ibm-field-error");
                  if($(element).find('.ibm-styled-radio').hasClass("ibm-field-error")){
                      $(element).find('.ibm-styled-radio').removeClass("ibm-field-error");
                  }
                } else {
                  if($(element).hasClass("ibm-field-error")){
                      $(element).removeClass("ibm-field-error");
                  }
                }
                if($(element).next().hasClass("error")){
                  $(element).next().hide();
                }
        },
        /**
         * Bluemix forms are identified as having a .prov value of bms (bluemix staging) or bmp (bluemix production)
         * returns true for bluemix provisioning forms, false otherwise.
         */
        isBluemix: function(){
            return (window.urxData && window.urxData.prov && (window.urxData.prov==="bms" || window.urxData.prov==="bmp")) || false;
        },
        /**
         * return registration type depending upon defined urxData object
         * @returns {string} sbs/mrs/ibmid
         */
        getRegistrationType: function(){
            if(window.urxData)
                window.urxData.prodType = urx.Util.isBluemix()?"bluemix":"others";
            if(window.urxData && window.urxData.trial === 'yes' && (urx.Util.isBluemix() || (window.urxData.partNumber && window.urxData.prov && window.urxData.prov!==""))){
                return "provision";
            } else if(window.urxData && window.urxData.trial === 'yes' && window.urxData.assetType ==="sw-download" ){
                return 'dwn';
            } 
            else if(window.urxData && window.urxData.assetType && window.urxData.assetType === "auth-only"){
                window.urxData.productName = "My IBM";
                return 'auth-only';
            }
            else if(window.urxData && window.urxData.assetType && (window.urxData.assetType === "urx-mkt-asset" || window.urxData.assetType === "regular-mkt-asset")){
                return 'mkt-asset';
            }
            else if(window.urxData && (window.urxData.trial === 'no' && window.urxData.package && window.urxData.source) || (window.urxData && window.urxData.trial === 'yes' && window.urxData.prov === "")){
                return 'mrs';
            }
            else{
                return 'auth-only';
            }
        },
        getAssetType: function(){
            return window.urxData.assetType;
        },
        getProvisioningType: function(){
            return window.urxData.prov;
        },
        /**
         * close all modal and open defarated modal
         * @param {string} redirectUrl url
         * @param {string} orgName     organization name
         */
        switchToFederatedView: function(redirectUrl,orgName){

          if(urx.activeModal !== "signinfederated"){
            IBMCore.common.widget.overlay.hideAllOverlays();
            IBMCore.common.widget.overlay.show('signinfederated');
            urx.activeModal = 'signinfederated';
          }
            $('#signinfederated').find('#dyn-org').text(orgName);
            $('#signinfederated').find('a#continueFederated').attr('href',redirectUrl);
        },
        /**
         * check urs if #federated exists and then check if session exist. call subscribe accordingly.
         */
        checkFedUserStatus: function(){
            var hash = location.hash.substr(1);
            if(hash && hash.indexOf('federated') > -1){
                if(urx.Util.regType === "auth-only" || (urx.isProvisioned === true && !urx.isMobileRequired) || urxData.noProvisioning === true){
                    urx.Util.regSuccessCallback();
                }else{
                    if(urx.activeModal){
                        IBMCore.common.widget.overlay.hide(urx.activeModal);
                    }
                    urx.Util.displayTrialPage();
                }
            }
        },
        /**
         * display access trial modal with or without delta field
         */
        displayTrialPage: function (){
            var pws = $('#urx-permission').detach();
            console.log(pws.html());
            pws.appendTo('#subscribeModalUrx .urx-permission-container');
            IBMCore.common.widget.overlay.hideAllOverlays();
        	  IBMCore.common.widget.overlay.show('subscribeModalUrx');
            urx.activeModal = 'subscribeModalUrx';
            urx.progProfileCtrl.updateDeltaFields();
            if(urx.progProfileCtrl.missingData){
             /* event triggered */
             urx.Observer("AccessTrialWithPhoneFieldOpen").publish();
              $(".urx-show-delta-field").removeClass("ibm-hide").show();
              $(".pstac").hide();
             }else{
              /* event triggered */
              urx.Observer("AccessTrialOpen").publish();
               $(".pstac").show();
               $(".urx-show-delta-field").hide();
             } 
            
            if(urx.isProvisioned){
                $("#licenceMsg").addClass("ibm-hide");
            }else{
                $("#licenceMsg").removeClass("ibm-hide");
            }
        },
        /**
         * check if user's session(login) exists
         */
        checkUserStatus: function(){
            urx.Util.regType = urx.Util.getRegistrationType();
            console.log("checking if user logged in");
            urx.isProvisioned = false;
            // urx.userService.getuser();
            $.when(urx.userService.status()).then(
                function( response ) {
                    if(urx.isLoggedin && urx.isFederated === false){
                        if(urx.userDetails && urx.socialCtrl.isSocialUser()){
                            //social session exists.
                        }else{
                            $.when(urx.userService.getuser()).then(
                            function(response){
                                if(urx.Util.regType === "provision"){
                                    $.when(urx.provService.checkSbs(urx.email)).then(
                                        function(response){
                                            if(response.result === 'success' && response.trial === 'yes'){
                                                urx.isProvisioned = true;
                                                console.log("is provisioned:" + urx.isProvisioned);
                                            }
                                        }
                                    );
                                }
                              },
                              function(error){
                                    console.log('error',error);
                              }
                            );
                        }
                    }else if(urx.isLoggedin && urx.isFederated === true){
                      if(urx.Util.regType === "provision"){
                        $.when(urx.provService.checkSbs(urx.email)).then(
                            function(response){
                                if(response.result === 'success' && response.trial === 'yes'){
                                   urx.isProvisioned = true;
                                   console.log("is provisioned:" + urx.isProvisioned);
                                }
                                urx.Util.checkFedUserStatus();
                            },
                            function(error){
                                console.log("Error checking trial."+error);
                            }
                        );
                      }else{
                        urx.Util.checkFedUserStatus();
                      }
                    }
            });

        },
        /**
         * callback after user is logged in - applicable only active user session and provision case
         * @param  {string} pass sendEmail as true if you want to send email again
         */
        userLoggedIn: function(){
          if(urx.Util.regType === "provision"){
            $.when(urx.provService.checkSbs(urx.email)).then(
                function(response){
                    urx.isProvisioned = false;
                    if(response.result === 'success' && response.trial === 'yes'){
                        urx.isProvisioned = true;
                    }else if(response.result === 'success' && response.trial === 'no'){
                        urx.coremetrics.triggerCM(1,"PA"); // Session available and not provisioned
                    }
                    console.log("urx.isProvisioned " + urx.isProvisioned);
                    console.log("urx.isEmailVerified " + urx.isEmailVerified);

                    if(urx.isProvisioned && urx.isEmailVerified){
                        /* event triggered */
                        urx.Observer("TrialExist").publish();
                        urx.Util.regSuccessCallback();
                    }
                    else if(urx.isEmailVerified){
                       urx.Util.displayTrialPage(); 
                    }else{ // when user email is not verified
                        urx.Util.showUpdateAccountModal();
                    }
                },
                function(error){
                    urx.Util.hideLoader();
                    var errorMsg = urx.Util.getErrorMessage(error.errorCode);
                    urx.Util.showMessageModal(errorMsg,true);
                }
            );
          }else{
              if((urx.isEmailVerified || urx.userService.preverifiedEmail) && !urx.progProfileCtrl.missingData){
                  /* event triggered */
                  urx.Util.regSuccessCallback();
              }
              else if(urx.isEmailVerified || urx.userService.preverifiedEmail){
                 urx.Util.displayTrialPage(); 
              }else{ // when user email is not verified
                  urx.Util.showUpdateAccountModal();
              }
          }
        },
        /**
         * show update account modal with resend email button
         */
        showUpdateAccountModal: function(){
          if(urx.Util.regType === 'mkt-asset' || urx.Util.regType === 'auth-only'){
              console.log("mkt-asset form");
              var now = new Date(); // Current date now.
              var diffInMinutes = (now - urx.mailCtrl.lastSendTime)/(1000*60); // Minutes
              if(urx.mailCtrl && diffInMinutes > 30){
                urx.mailCtrl.existingUserSendEmail(urx.businessEmail);
              }else{
                  urx.Util.hideLoader();
                  IBMCore.common.widget.overlay.hideAllOverlays();
                  IBMCore.common.widget.overlay.show('mailsent');
                  urx.activeModal = 'mailsent';
              }
            }else{
              var pws = $('#urx-permission').detach();
              console.log('MoveNCLinkToupdateaccount',pws.html());
              pws.appendTo('#updateaccount .urx-permission-container');

              if(urx.Util.regType === 'dwn'){
                $('#updateaccount .urx-permission-container .ibm-notice-choice-container > p').show();
                $('#updateaccount .click-to-access').hide();
              }else{
                $('#updateaccount .urx-permission-container .ibm-notice-choice-container > p').hide();
                $('#updateaccount .click-to-access').show();
              }
              urx.activeModal = 'updateaccount';
              IBMCore.common.widget.overlay.hideAllOverlays();
              IBMCore.common.widget.overlay.show('updateaccount');
              urx.progProfileCtrl.updateDeltaFields();
              /* event triggered */
              jQuery('#updateaccount .user-email').html(urx.userDetails.user);
              urx.Observer("UpdateAcocuntModalOpened").publish();        
            }
        },
        /**
         * redirect deferated user if provision is there otherwise show access trial modal
         */
        fedUserProvision: function(){
            if(urx.Util.regType === "auth-only" || (urx.isProvisioned === true && !urx.isMobileRequired)){
                urx.Util.regSuccessCallback();
            }else{
                if(urx.activeModal){
                    IBMCore.common.widget.overlay.hide(urx.activeModal);
                }
                urx.Util.displayTrialPage();
            }
        },
        /**
         * showLoader on modal
         * @param {string} modalId HTML element id
         */
        showLoader: function(modalId,desc){
            var modalElem = $('#overlayLoader').detach();
            if(desc){
              modalElem.find('#urx-msg-desc').html(desc).show();
            }else{
                modalElem.find('#urx-msg-desc').html("").hide();
            }
            $('#'+modalId).append(modalElem);
            modalElem.show();
        },
        /**
         * show modal with provided message
         * @param  {string} title
         * @param  {string} desc 
         */
        showMessageModal: function(desc,noLoader){
            var hideLoader = noLoader || false;
            var msgObj = $(document.getElementById('urxMessage'));
            if(!hideLoader){
              var modalElem = $('#overlayLoader').detach();
              msgObj.find('.formWrapper').append(modalElem);
              modalElem.show();
            }else{
                urx.Util.hideLoader();
            }
            if(desc){
              msgObj.find('#urx-msg-desc').html(desc).show();
            }else{
                msgObj.find('#urx-msg-desc').html("").hide();
            }
            if(urx.activeModal !== 'urxMessage')
            IBMCore.common.widget.overlay.hideAllOverlays();            
            IBMCore.common.widget.overlay.show('urxMessage');
            urx.activeModal = 'urxMessage';
        },
        /**
         * hide loader
         */
        hideLoader: function(){
            $('#overlayLoader').hide();
        },
        /**
         * showing and Hiding Licence Agreement and Privacy Statemts.
         */
        showHideLicenceAndPrivacy: function(){
            urx.Util.loadNoticeChoiceJs();
            if(window.urxData && window.urxData.licenseAgreementURL){
                $('.urx-licence-agreement').prop('href',window.urxData.licenseAgreementURL);
            }
        },
        /**
         * createing a cookie with 30 minutes expiration time and using it for storing state id.
         */
        createCookie: function(cookieName, cookieVal) {
            var date = new Date();
            var minutes = 30;
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            Cookies.set(cookieName,  cookieVal, {
                path: '/',
                // domain: ".ibm.com",
                // secure: true,
                expires: date
            });
         },
         /**
          * get Cookie
          * @param  {string}
          */
        getCookie: function(name){
            var arr,reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
            arr = document.cookie.match(reg);
            if(arr){
                return unescape(arr[2]);
            }else{
                return null;
            }
        },
        /**
         * Delete cookie in ".ibm.com" domain.
         * @param  {string}
         */
         delCookie: function(cookieName) {
             Cookies.remove(cookieName, {
                 path: '/',
                 domain: ".ibm.com"
             });
         },
         /**
          * set forgot password link to modal from env constant
          */
         setForgotPasswordURL: function(){
             if(ENV.constant && ENV.constant.forgotPasswordURL !== ""){
                 $("#forgotPassword").attr("href",ENV.constant.forgotPasswordURL);
             }
         },
         /**
          * return demandbase industry id by industry name
          * @param  {string}
          * @return {integer}
          */
         getDemanbaseId : function(demand_industries){
             var industries = urx.Util.demandindustry;
             if (!demand_industries || demand_industries.toLowerCase() == "n/a" || demand_industries === "") {
                return industries.length - 1;
            }
            demand_industries = demand_industries.toLowerCase();
            //find a match
            for (var i = 0; i < industries.length; i++) {
                var industry = industries[i].toLowerCase();
                if (industry == demand_industries)
                    return i;
            }
         },
         /**
          * set demandbase data to denamabase object
          */
        setDemandBaseData: function(){
          var demandBaseDataLoaded = function(){
            urx.Observer('AppReady').subscribe(urx.Util.validateStateWIthStateService);

              var userData = IBMCore.common.util.user.getInfo();
              console.log('userData',userData);
                if(userData && userData.company_name && userData.company_name !=="n/a"){
                   urx.Util.demandBaseData.company = userData.company_name.substring(0, 30);
                }else{
                   urx.Util.demandBaseData.company = "";
                }
                if(userData && userData.state && userData.state !== "n/a"){
                  urx.Util.demandBaseData.state =  userData.state.toUpperCase();
                } else if ( userData && userData.registry_state && userData.registry_state !== "n/a" ) {
                  urx.Util.demandBaseData.state = userData.registry_state.toUpperCase();
                }
                if(userData.country && userData.country !=="n/a"){
                     urx.Util.demandBaseData.country = userData.country.toUpperCase();
                }else if(userData.registry_country_code){
                     urx.Util.demandBaseData.country = userData.registry_country_code.toUpperCase();
                }else{
                     urx.Util.demandBaseData.country = "US";
                }
                urx.Util.demandBaseData.updated =true;
                urx.Util.demandBaseData.industry = urx.Util.getDemanbaseId(userData.industry);
                urx.Observer('demandBaseDataLoaded').publish();
          };
          if (IBMCore.common.util.user && typeof IBMCore.common.util.user.subscribe === 'function') {
            IBMCore.common.util.user.subscribe('userIpDataReady','self',demandBaseDataLoaded).runAsap(demandBaseDataLoaded);
          }
        },
        /**
         * @param  {string}
         */
        checkUserSession: function(openModal){
            urx.Util.regType = urx.Util.getRegistrationType();
            $.when(urx.userService.status()).then(
                function( response ) {
                    if(urx && urx.isLoggedin ){
                        if(openModal){
                            urx.Observer('existingUserSession').publish();
                        }
                        urx.isSessionAvailable = true;
                        console.log(" urx.userService status" + JSON.stringify(response));
                        if(urx && urx.isLoggedin && urx.isFederated === false){
                            if(urx.userDetails && urx.socialCtrl.isSocialUser()){
                                if(urx.socialCtrl.active){
                                    urx.socialCtrl.processSocialSession();
                                    urx.Util.hideLoader();
                                }else{
                                    urx.Util.requestCSRF();
                                    urx.Util.opnenModal(openModal);
                                    urx.Util.updateCountry();
                                    urx.Util.hideLoader();
                                }
                            }else{
                                console.log("calling getuser");
                                $.when(urx.userService.getuser()).then(
                                  function(response){
                                    urx.modalState.updateState({existingData: urx.userService.userInfo});
                                    urx.Observer('modalStateUpdated').publish();
                                      console.log("getUser resp", response);
                                      $.when(urx.userService.progressiveProfileDataService({}, "readprofile")).then(
                                          function(res){
                                            if(res.result === "success" && res.data) {
                                              var existingData = urx.Util.mergeUserInfo(res.data,urx.userService.userInfo);
                                               urx.modalState.updateState({existingData: existingData});
                                               urx.Observer('modalStateUpdated').publish();
                                              urx.Util.afterUserSessionExists();
                                            }else{
                                              urx.Util.afterUserSessionExists();
                                            }
                                          },
                                          function(err){
                                            urx.Util.afterUserSessionExists();
                                          }
                                        );
                                    },
                                    function(error){
                                        if(error.errorCode === 'notloggedin'){
                                            if(urx.loginCtrl.btnTxt){
                                            }
                                            urx.Util.hideLoader();
                                            urx.Util.requestCSRF();
                                            urx.Util.opnenModal(openModal);
                                            urx.Util.updateCountry();
                                        }
                                    }
                                );
                            }
                        }else if(urx && urx.isLoggedin && urx.isFederated === true){
                            console.log("fed user session.");
                            urx.Util.fedUserProvision();
                        }
                        else{
                            urx.Util.requestCSRF();
                            urx.Util.opnenModal(openModal);
                            urx.Util.updateCountry();
                            urx.Observer('prefillFormData').publish();
                        }
                    }else{ console.log("User Is not logged In");
                      if(openModal){
                          urx.Util.requestCSRF();
                          console.log("Need to open the modal");
                          urx.Util.opnenModal(openModal);
                          urx.Util.updateCountry();
                        } 
                        else{
                          urx.Util.hideLoader();
                        }
                    }
                    
                },
                function(err){
                    if(openModal){
                      urx.Util.requestCSRF();
                      console.log("Need to open the modal");
                      urx.Util.opnenModal(openModal);
                      urx.Util.updateCountry();
                    } 
                    else{
                      urx.Util.hideLoader();
                    }
                }
            );
        },
        mergeUserInfo: function(nextGenData,IdaaSdata){
            var fields = {
                firstName:null,
                lastName:null,
                phoneNumber:false,
                company:false,
                country:false,
                state:false,
                isStudent:false,
                jobTitle:false,
                kana:false,
                permission:false,
                salutation:false,
                phone:false,
                isFirstTimeUser:false,
            };
            var defaultProviders = {
                company:'userinput',
                phoneNumber:'userinput',
                isStudent:'userinput',
                isFirstTimeUser: 'userinput',
                jobTitle:'userinput',
                salutation:'userinput',
                kana:'userinput',
                permission:'userinput'
                };

            /* add other info for email verification flow */
            if(urx.emailVerification){
                $.extend(fields,{
                    industry:null,
                    firstName:null,
                    lastName:null,
                    anmsid:null,
                    cid:null,
                    sid:null,
                    pageViewId:null,
                    mmc:null,
                    mmca1:null,
                    mmca2:null,
                    mmca3:null,
                    bpid:null,
                    bpasset:null
                });
            }
            urx.nextGenData = nextGenData;
            $.each(fields,function(index,value){
                if((!nextGenData[index] || nextGenData[index] === 'false') && urx.userService.userInfo[index]){
                    fields[index] = urx.userService.userInfo[index];
                }else if(nextGenData[index]){
                    fields[index] = (nextGenData[index] === 'false'? false: nextGenData[index]);
                    if(fields[index])
                      urx.userService.userInfo[index] = fields[index];
                }                    
            });
            if(urx.nextGenData.providers){
                fields.providers = $.extend(defaultProviders,urx.nextGenData.providers);
            }
            return fields;
        },
        /**
         * callback function after user session exists. show display trial modal o update account modal accordingly
         */
        afterUserSessionExists: function(){
           var regType = urx.Util.getRegistrationType();
          if(regType !=='provision'){
              if(urx.isEmailVerified || urx.userService.preverifiedEmail){
                  urx.Util.displayTrialPage();
              }else{ // when user email is not verified
                  urx.Util.showUpdateAccountModal();
              }
            } else {
              // this will check if provision already exists and do the rest.
              urx.Util.userLoggedIn();
          }
        },
        /**
         * update country from demandbase data
         */
        updateCountry: function(){
            var country = false;
            if(urx.modalState.state.existingData.country){
                country = urx.modalState.state.existingData.country;
            }else if(urx.Util.demandBaseData.country && urx.Util.demandBaseData.country !== ""){
                country = urx.Util.demandBaseData.country;
            }
          if(country){
            var countryElm = $('.urx-form-country');
            if(countryElm.is("input")){
              countryElm.val(country);
            }else{
                console.log("change now");
              countryElm.val(country).trigger("change");
              /* show state only for US, CA  */
                if(urx.Util.stateRequiredCountryList.indexOf(country) === -1){
                    $('#updateAccount-form .urx-states-sel, #provision-form .urx-states-sel').hide();
                }
               /* end show state only for US, CA  */
            }
          }
        },
        /**
         * request csrf token and create cookie with it
         */
        requestCSRF: function(){
            urx.formTkn.requestToken().then(function(data, textStatus, request){
                urx.Util.createCookie("urx-formTkn", data.token);
                urx.Util.createCookie("urx-tokenSession", data.tokenSession);
            });
        },
        /**
         * open modal by closing all existing opended modals.
         * @param  {modalName} element id attribute value
         */
        opnenModal: function(modalName){
            if(modalName){
                IBMCore.common.widget.overlay.hideAllOverlays();
                if(modalName === 'loginModalUrx'){
                    urx.loginCtrl.init();
                    /* event triggered */
                    urx.Observer("LoginModalOpened").publish();
                    urx.loginCtrl.openLoginModal();
                }
                else if(modalName === 'signupModalUrx'){
                  /* event triggered */
                    urx.Observer("SignupModalOpened").publish();
                    urx.signupCtrl.openSignUpModal();
                }
            }
            
        },
        /**
         * show hide password input type text/password
         * @param  {object} jQuery object of a password element
         */
        togglePassword : function(pwf){
            var inputType = $(pwf).prop("type") === "text" ? "password" : "text";
            $(pwf).prop("type", inputType);
            $(pwf).focus();
        },
        /**
         * @param  {object} form jQiery form object
         * @param  {boolean} displayError
         * @return {boolean} true if form is valid false if form is not valid
         */
        validateForm: function(form,displayError){
            var errorCount =0;
            var formID = $(form).attr('id');
            $('#'+ formID).find('.urx-valid').filter(':visible').each(function() {
                if(!urx.Util.validateField(this,displayError)){
                    errorCount = errorCount + 1;
                }
            });
            if($('.encouragement > span').hasClass('ibm-textcolor-red-50'))
                errorCount++;
             if(errorCount === 0){
                return true;
            }else{
                return false;
            }
        },
        /**
         * tracklinkMouseDown - track if a link mousedown & clicked to prevent calling validation for input blur.
         */
        tracklinkMouseDown: function(){
            urx.Observer('AppReady').subscribe(function(){
                $('body').on('mousedown','#loginModalUrx a,#signupModalUrx a, .urx-modal-login, .urx-modal-signup, .urx-overlay .ibm-close-link',function(){
                    urx.Util.linkMouseDown = true;
                    console.log('mousedown',urx.Util.linkMouseDown);
                })
                .on('click','#loginModalUrx a,#signupModalUrx a, .urx-modal-login, .urx-modal-signup, .urx-overlay .ibm-close-link',function(){
                    urx.Util.linkMouseDown = false;
                    console.log('mousedown',urx.Util.linkMouseDown);
                });
            });
        },
        /**
         * regSuccessCallback - code to be executed after successfull registration or login
         */
        regSuccessCallback: function(){
          //urx.Util.hideLoader();
          if(typeof window.regSuccess === 'function'){
              window.regSuccess();
          }else if(urxData.targetURL){
              var regType = urx.Util.getRegistrationType();
              var targeturl = '';
              if(regType === "dwn"){
                    if(urxData.SWDSource)
                      targeturl = urx.Util.updateQueryStringParameter(urxData.targetURL,"source",urxData.SWDSource);
                    else
                      targeturl = urx.Util.updateQueryStringParameter(urxData.targetURL,"source",urxData.source);

                    if(urx.Util.getQueryParam('signupTransactionID',urxData.targetURL)){
                        targeturl = urx.Util.updateQueryStringParameter(targeturl,"signupTransactionID",urx.transactionId);
                    }else{
                        targeturl = urx.Util.updateQueryStringParameter(targeturl,"transactionid",urx.transactionId);
                    }
              }
              else{
                 targeturl = urxData.targetURL;
                 if(urx.extSubscriptionId){
                    if(targeturl.indexOf('products-services') > -1){
                      var encodedSubID = urx.extSubscriptionId ? btoa(urx.extSubscriptionId): null;
                      var encodedPartNumber = urxData.partNumber? btoa(urxData.partNumber):null;
                      var encodedProductName = btoa(urxData.productName);
                      if(encodedSubID)
                        targeturl = urx.Util.updateQueryStringParameter(targeturl,"subID",encodedSubID);
                      if(encodedPartNumber)
                        targeturl = urx.Util.updateQueryStringParameter(targeturl,"partNum",encodedPartNumber);
                      if(encodedProductName)
                        targeturl = urx.Util.updateQueryStringParameter(targeturl,"prodName",encodedProductName);
                    }else{
                       targeturl = urx.Util.updateQueryStringParameter(targeturl,"sbsSubscriptionID",urx.extSubscriptionId);
                    }
                 }
              }
              console.log("target URL::: "+targeturl);
              if(urx.coremetrics.isApplicable){
                if(urx.isSessionAvailable){
                    urx.coremetrics.triggerCM(2,"PA","L1");
                  }else{
                    urx.coremetrics.triggerCM(2,"EA","L1");
                  }
              }
              urx.Observer('redirectToDest').publish(targeturl);

              // close if targeturl is the same with currenturl && both has #
              if(targeturl.indexOf('#') > 0) {
                var currentPlainurl = window.location.href;
                if (currentPlainurl.indexOf('#') > 0) {
                  currentPlainurl = window.location.href.substring(0, window.location.href.indexOf('#'));
                }

                var targetPlainurl = targeturl.substring(0, targeturl.indexOf('#'));
                if(currentPlainurl === targetPlainurl) {
                  IBMCore.common.widget.overlay.hide(urx.activeModal);
                }
              }
              window.location.href = targeturl;
          }else{
            if(urx.emailVerification){
              var target = "https://wwwpoc.ibm.com/myibm/dashboard/";
              if(ENV.constant.constant === 'production'){
                target = "https://myibm.ibm.com/";
              }
              urx.Observer('redirectToDest').publish(target);
              window.location.href = target;
            }else{
                var targetUrl = window.location.href;
                var hash = location.hash.substr(1);
                if(hash && hash.indexOf('federated') > -1){
                    targetUrl= targetUrl.replace("#federated","");
                }
                urx.Observer('redirectToDest').publish(targetUrl);
                window.location.href = targetUrl;
            }
          }
        },
        /**
         * getTransIdAndRedirect - call IWM, get mrsTransactionId and redirect user to target url
         * @param  {String}  email
         * @param  {Boolean} isSynchronous
         */
        getTransIdAndRedirect: function(email, isSynchronous){
            urx.Observer("callMrs").publish();
            $.when(urx.iwmService.doIwm(email, isSynchronous)).then(
                function(response){
                    console.log(response);
                    if(response.status === "success"){
                        console.log(response.mrsTransactionId);
                        urx.transactionId = response.mrsTransactionId;
                        window.urxData.mrsTransactionId = response.mrsTransactionId;
                        urx.Util.regSuccessCallback();
                    }else if(response.mrsReturnCode){
                      urx.Util.displayMrsError(response.mrsReturnCode);
                    }else{
                        urx.Util.displayMrsError(response.statuscode);
                    }
                },
                function(error){
                    urx.Util.displayMrsError("000");
                    console.log('getting transaction id failed.',error);
                }
            );
        },
        /**
         * getQueryParam - return query string value
         * @param  {String} name - query param name
         * @param  {String} url  urx to check
         * @return {String}      value of query string
         */
        getQueryParam: function(name, url) {
            if (!url) {
              url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        /**
         * wrapModals - wrap all modal with additional class/div. it will make sure the whole page got scriolled instead of the modal content.
         * @param  {String} lastElemId - last modal id atyribute
         */
        wrapModals: function(lastElemId){
          var deferred = $.Deferred();
          var wUpdated=false;
          var attempts=0;
          var tryWrap = function(){
          var lastModal = $('#'+lastElemId);
              if(lastModal.length && !wUpdated){
                  jQuery('.urx-overlay').each(function(i, elem) {
                      var wrapperInner = jQuery(elem).find('.ibm-common-overlay-inner');
                      if(!wrapperInner.length){
                          jQuery(elem).wrapInner( "<div class='ibm-common-overlay-table'><div class='ibm-common-overlay-row'><div class='ibm-common-overlay-inner'></div></div></div>");
                      }
                  });
                  wUpdated = true;
                  deferred.resolve();
                  return deferred.promise();
              }else{
                  console.log('not updated yet');
                  setTimeout(
                    function () {
                    console.log('retry:',attempts);
                        attempts++;  
                        if(attempts < 20 && !wUpdated){
                          tryWrap();
                        }
                  },200);
              }
          };
          tryWrap();        
        },
        /**
         * loadAdopter - check if formid is a static or cloudant doc and load accordingly.
         * @param  {String} formId
         * @return {Promise}
         */
        loadAdopter: function(formId){
            var deferred = jQuery.Deferred();
            if(urx.Util.isCloudantDoc(formId)){
                jQuery.when(urx.cloudantService.loadAdopter(formId)).then(
                    function(json){
                        urx.Util.formId = formId;
                        urx.Util.setForgotPasswordURL();
                        deferred.resolve({result:'success',type:'cloudant'});
                    },
                    function(err){
                        deferred.reject({result:'error'});
                    }
                );
            }else{
                var file = '/js/lang/us-en/'+"msgs/";
                file = ENV.constant.adopterPath + file +'urx_'+ formId +'.js';
                console.log('Adopter file path'+ file);
                jQuery.getScript(file)
                .done(function( script, textStatus ) {
                    urx.Observer("adopterLoaded").publish();
                    urx.Util.formId = formId;
                    urx.Util.setForgotPasswordURL();
                    deferred.resolve({result:'success',type:'static'});
                })
                .fail(function( jqxhr, settings, exception ) {
                    console.warn('No Adopter file found at: ', file);/*RemoveLogging:skip*/
                    deferred.reject({result:'error'});
                });
            }
            return deferred.promise();
        },
        /**
         * updateSteps - prepare modal steps and keep field informations, steps in validable.
         */
        updateSteps: function(){
          if(window.urxData) {
              if(/SPSS/.test(window.urxData.productName)){window.urxData.student = true;}
                  var steps;
                  var oneScreen;
                  switch (window.urxData.pattern) {
                      case "pattern1":
                      case "pattern2":
                          steps = [{fields: ["email", "firstName", "lastName" ,"password", "permission"]}];
                          oneScreen = true;
                          break;
                      case "pattern3":
                          steps = [{fields: ["email", "firstName", "lastName" ,"password"]}, {fields: ["country", "phone", "company", "permission"]}];
                          break;
                      case "pattern4":
                          steps = [{fields: ["email", "firstName", "lastName" ,"password"]}, {fields: ["country", "phone", "company" ,"isStudent", "permission"]}];
                          break;
                      default:
                          steps = [{fields: ["email", "firstName", "lastName" ,"password", "permission"]}];
                          oneScreen = true;
                          break;
                  }
                  //When locale is jp-ja show last name before first name and also kana field
                  var countryCode = urx.Util.autoDetectCountry();
                  if (countryCode == "JP") {
                  	steps[0].fields[1] = steps[0].fields.splice(2, 1, steps[0].fields[1])[0];
                    if (oneScreen) {
                  	     steps[0].fields.splice(3, 0, "kana");
                    }
                  }
                  var salutationField = urx.Util.getSalutationField();
                  var fields = {};
                  var salutationIndex;
                  $.each(urxData.customQuestions, function(i,o){
                    fields[o.name] = o;
                    switch (o.name) {
                      case "salutation":
                        jQuery.each(steps, function(i, step) {
                            jQuery.each(step.fields, function(index, field) {
                            	if (field === "lastName" && countryCode == "JP") {
                            		salutationIndex = {step:i, index: index};
                            		return false;
                            	} else if (field === "firstName") {
                                    salutationIndex = {step:i, index: index};
                                }
                            });
                        });
                        if(salutationIndex) {
                        	steps[salutationIndex.step].fields.splice(salutationIndex.index, 0, salutationField);
                        }
                        break;
                      case "JOBTITLE":
                      case "jobTitle":
                        var titleIndex;
                        jQuery.each(steps, function(i, step) {
                            jQuery.each(step.fields, function(index, field) {
                                if (field === "company") {
                                    titleIndex = {step:i, index: index + 1};
                                }
                            });
                        });
                        if (titleIndex){
                            steps[titleIndex.step].fields.splice(titleIndex.index, 0, "jobTitle");
                        }
                        break;
                      case "Q_STUDENT":
                      case "student":
                        var studentIndex;
                        jQuery.each(steps, function(i, step) {
                            jQuery.each(step.fields, function(index, field) {
                                if (field === "permission") {
                                    studentIndex = {step:i, index: index};
                                }
                            });
                        });
                        if (studentIndex){
                            steps[studentIndex.step].fields.splice(studentIndex.index, 0, "isStudent");
                        }
                        break;
                      case "Q_FIRSTTIME":
                        var firstTimeUserIndex;
                        jQuery.each(steps, function(i, step) {
                            jQuery.each(step.fields, function(index, field) {
                                if (field === "permission") {
                                    firstTimeUserIndex = {step:i, index: index};
                                }
                            });
                        });
                        if (firstTimeUserIndex){
                            steps[firstTimeUserIndex.step].fields.splice(firstTimeUserIndex.index, 0, "isFirstTimeUser");
                        }
                        break;
                      default:
                        break;
                    }
                  });
                  // If salutation field not in the modal only following countries display it
                  if (!salutationIndex && salutationField) {
                  	$.each(steps, function(i, step) {
                        jQuery.each(step.fields, function(index, field) {
                            if (field === "lastName" && countryCode == "JP") {
                        		salutationIndex = {step:i, index: index};
                        		return false;
                        	} else if (field === "firstName") {
                                salutationIndex = {step:i, index: index};
                            }
                        });
                    });
                    if(salutationIndex) {
                    	steps[salutationIndex.step].fields.splice(salutationIndex.index, 0, salutationField);
                    }
                  }
                  var deltaFields = [];
                  $.each(steps, function(i, step) {
                    $.each(step.fields, function(index, field) {
                        if(field === 'country' && deltaFields.indexOf('phone') < 0){
                          deltaFields.push('phone');
                        }

                        if(deltaFields.indexOf(field) === -1)
                          deltaFields.push(field);

                        fields[field] = field;
                    });
                  });

                  deltaFields = urx.progProfileCtrl.filterByForm(deltaFields);

                  if(deltaFields.indexOf('phone')  === -1){
                    deltaFields.unshift('phone');
                  }
                  urx.modalState.updateState({
                      steps: steps,
                      totalSteps: steps.length - 1,
                      activeStep: 0,
                      fields:fields,
                      deltaFields: deltaFields
                  });
                  urx.Util.setProvidersDetails();
          }
        },
        /**
         * displayMrsError - export validation error message
         * @param  {String} errorCode
         */
        displayMrsError: function(errorCode){
          var errorMsg = urx.localeInfo.msg[errorCode] || urx.localeInfo.msg["000"];
          if(urx.emailVerification){
              urx.emailVerification.fail(errorCode);
          }else if(urx.activeModal && urx.activeModal!==''){
            urx.Util.showMessageModal(errorMsg, true);
          }
        },
        /**
         * validateStateWIthStateService - validate demandbase country code with MRS state service.
         * @return {Promise}
         */
        validateStateWIthStateService: function(){
            var deferred = jQuery.Deferred();
            var countryCode = urx.Util.demandBaseData.country;
            var stateCode = urx.Util.demandBaseData.state;
            if(countryCode && stateCode){
                console.log(userState);
                stateCode = stateCode.toUpperCase();
                urx.Util.demandBaseData.state = false;
                var userState = false;
                $.when(urx.Util.getStateList(countryCode)).then(function(states){
                    if (states.length) {
                        $.each(states, function(index, state) {
                            if(state.stateCode === stateCode){
                                var userState = state.stateCode;
                                urx.Util.demandBaseData.state = state.stateCode;
                                deferred.resolve(userState);
                            }
                        });                    
                    } else {
                        deferred.reject();
                    }
                },function(err){
                    deferred.reject();
                });
            }else{
                deferred.reject();
            }
            return deferred.promise();
        },
        /**
         * isCloudantDoc method
         * @param  {String}  formId
         * @return {Boolean}
         */
        isCloudantDoc:function(formId){
            if(formId.length === 32 || formId.substring(0, 4) === "urx-"){
                return true;
            }else{
                return false;
            }
        },
        /**
         * Get auto detected country from 
         * 1. locale
         * 2. DemandBaseData
         * @return {String} countryCode
         */
        autoDetectCountry:function(){
        	if (urx.Util.locale != "us-en") {
        		return urx.Util.locale.split('-')[0].toUpperCase();
        	} else if (urx.Util.demandBaseData.registry_country_code) {
        		return urx.Util.demandBaseData.registry_country_code.toUpperCase();
        	} else {
        		return urx.Util.demandBaseData.country.toUpperCase();
        	}
        },
        /**
         * Get salutaion field name 
         * @return {String} field name
         */
        getSalutationField:function(country){
        	var countryCode = country || urx.Util.autoDetectCountry();

          	if ($.inArray(countryCode, new Array('DE','AT','CH','LI','JP','TW','CN')) > -1) {
      				if ($.inArray(countryCode, new Array('DE','AT','CH','LI')) > -1) {
      					return "salutation-selection";
      				} else {
      					return "salutation";
      				}
      			}
  			 return null;
        },
        /**
         * getErrorMessage
         * @param  {string} errorCode
         * @return {string}           localized error message
         */
        getErrorMessage: function(errorCode){
          if(!urx.localeInfo.msg[errorCode] || errorCode == "000"){
            if(errorCode == "000")
                errorCode = "";
            var commonMessage = urx.localeInfo.content.unknownGeneralError;
            commonMessage = commonMessage.replace("<code/>",errorCode);
            return commonMessage;
          }else{
            return urx.localeInfo.msg[errorCode];
          }
        },
        postAdopterLoadAction: function(){
            if(window.urxData && urxData.status && urxData.status === 'Draft' && urxData.testAssetUrl && urxData.testAssetUrl!==""){
                urxData.targetURL = urxData.testAssetUrl;
            }
        }
    };
    urx.Util.init();
    urx.Util.setDemandBaseData();
    urx.Observer("adopterLoaded").subscribe(urx.Util.postAdopterLoadAction);

})(jQuery);
