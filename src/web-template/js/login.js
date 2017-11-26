/*jslint  */
/**
 * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN v 4.9 2017/02/16
 * @description
 * <p>
 * Contains event triggers and functions required for Log In Page hosted within IDaaS.
 * </p>
 */
var ibmIDC = ibmIDC || {};
ibmIDC.logInUtil = ibmIDC.logInUtil || {};
ibmIDC.logInUtil = {
        
    tempUserId : "",
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param String emailAddress - IBMid provide by user
     * @function validateUserId
     * @description <p>Identify the user is existing, federated or a new user </p>
     * @returns {void}
     */
    validateUserId: function(emailAddress) {
        var identitysourceurl = "https://"+window.location.host+"/v1/mgmt/idaas/user/identitysources";
         var oidcUrl = false;
        if(document.referrer.indexOf("redirect_uri")!=-1&&document.referrer.indexOf("scope")!=-1&&document.referrer.indexOf("client_id")!=-1){
            oidcUrl = true;
        }
        $.ajax({
            url: identitysourceurl,
            dataType: "json",
            type:"POST",
            data: JSON.stringify({user:emailAddress,oidcUrl:oidcUrl}),
            contentType: "application/json",
            success: function(data) {
                if (data[0].providerType == 'ibmldap') {
                    ibmIDC.logInUtil.showExistingUser(emailAddress); 
                }else{
                    $.removeCookie("useribmid", {path: '/'});
                    ibmIDC.logInUtil.showFedUser(data,emailAddress); 
                }
            },
            error: function(xhr, ajaxOptions, thrownError, data) {
                if (xhr.status == 404) {
                    if(xhr.responseJSON.result.indexOf('FBTBLU127E')!=-1){
                        $("#msgibmid").html(ibmIDErrMsg['loginErrMsg1']);
                      }else{
                        $("#msgibmid").html(ibmIDErrMsg['loginErrMsg2']);
                        ibmIDC.logInUtil.redirectUser();
                      }
                }
            } 
        });
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param String emailAddress - IBMid/Fed id
     * @param Boolean persist - true to set cookie
     * @function persistUserId
     * @description <p>Set or remove the temp cookie, used for identifying the user in case of wrong password</p>
     * @returns {void}
     */
    persistUserId : function(emailAddress,persist){
        var date = new Date();
        ibmIDC.logInUtil.tempUserId=emailAddress||"";
        date.setTime(date.getTime()+120000);
        if(persist){
            $.cookie("useribmid",emailAddress,{expires:date, path:'/', secure : true});
        }else{
            $.removeCookie("useribmid",{path:'/'});
        }
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param String emailAddress - IBMid
     * @function showExistingUser
     * @description <p>Display the password field for existing user</p>
     * @returns {void}
     */
    showExistingUser : function(emailAddress){
        ibmIDC.logInUtil.tempUserId = emailAddress;
    ibmIDC.logInUtil.isAnonymousUser();
    $('#username').val(emailAddress);
        $("#useridform").addClass("ibm-hide");
        $("#ibmcloudform").removeClass("field-email");
        $("#ibmSigninformEmail").html(emailAddress);
        $("#continuebutton, #ng-mobile-new").hide();
        //$("#password").attr('tabindex', 0);
        //$("#password").trigger('focus');
        $(".forgotfield, #signin_button, #remUserID").show();
        $(".remMsg1").html(ibmIDErrMsg['rememberIBMid']);
        $(".remMsg2").html(ibmIDErrMsg['enterPassword']);
        $("#ng-mobile-backlink").show();
    var tabindexIds=['#password', '#signinbutton', '#ng-mobile-backlink a', '#ng-mobile-forgotPaswd'];
        ibmIDC.logInUtil.setTabindex(tabindexIds);
        $('#password').focus();
        
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param Array data -- response object for federated user
     * @param String emailAddress - Fed id
     * @function showFedUser
     * @description <p>Display the page for federated users</p>
     * @returns {void}
     */
    showFedUser : function(data,emailAddress){
        var tabindexIds=['#continuefedbutton','#ng-mobile-backlink a'];
        ibmIDC.logInUtil.setTabindex(tabindexIds);
        
        var redURL = data[0].properties[0].value;
        if(ibmIDC.formUtil.queryParam("Target")!=undefined && ibmIDC.formUtil.queryParam("Target")!=""){
            //redURL = redURL+"&Target="+escape(ibmIDC.formUtil.queryParam("Target"));

            redURL = ibmIDC.logInUtil.updateQueryString('Target',escape(ibmIDC.formUtil.queryParam("Target")),redURL)
        }
        ibmIDC.logInUtil.showSpinner(ibmIDC.err["LOGIN-ENTERPRISE-PROCESS"]);
        setTimeout(function() {
            window.location.href = redURL;    
            
        }, 3000);
 },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function showNewUser
     * @description <p>Display the home page</p>
     * @returns {void}
     */
    showNewUser : function(){
        var tabindexIds=['#username','#continuebutton','#ng-mobile-signUp','.forgotlink a'];
        ibmIDC.logInUtil.setTabindex(tabindexIds);
        $('#username').focus();
        $("#useridform").removeClass("ibm-hide");
        $("#fedform").addClass("ibm-hide");
        $("#ibmcloudform").addClass("field-email");
        $("#ibmSigninformEmail,#pwdErrorMsg").html("&nbsp;");
        $("#continuebutton,#ng-mobile-new").show();
        $("#username").focus();
        $(".forgotfield ,#signin_button,#ng-mobile-backlink , #remUserID").hide();
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function redirectUser
     * @description <p>Redirect the user to there respective registration pages.</p>
     * @returns {void}
     */
    redirectUser : function(){
        var path = ibmIDC.idUtil.staticPagesBasePath+"register.html",siteID="&a=@OIDC_CLIENT_ID@",emailAddress = $.trim($('#username').val());;
        if(window.ibmIDMsgs && ibmIDMsgs.regPage){
            path =ibmIDC.idUtil.staticPagesBasePath+ibmIDMsgs.regPage;
        }else if(window.ibmIDMsgs && ibmIDMsgs.bluemixPage){
            path = ibmIDMsgs.bluemixPage; 
        }
        if(window.ibmIDMsgs && ibmIDC.appId){
            siteID="&a="+ibmIDC.appId;
        }
        var dest_url = path+'?Id='+encodeURIComponent(emailAddress)+siteID+"&Target="+ibmIDC.logInUtil.redirectURL();
        $("#create_new_ibmid").attr('href', dest_url);
    },
    /**
     * @author Pavan K Sunkara/India/IBM@IBMIN
     * @memberOf ibmIDC
     * @function redirectURL
     * @description <p>preparing redirect url.</p>
     * @returns {String} value of the redirect url
     */
    redirectURL : function(){
        var dest_url = "https://myibm.ibm.com/";
        if(document.referrer && document.referrer.indexOf("redirect_uri")!=-1 && document.referrer.indexOf("scope")!=-1 && document.referrer.indexOf("client_id")!=-1){
            var referrerarray = document.referrer.split('?');
            dest_url = 'https://'+window.location.host+'/idaas/oidc/endpoint/default/authorize?';
            for(var i=0;i<referrerarray.length;i++){
                if(i!=0){
                    dest_url = dest_url+referrerarray[i];
                }
            }
        }else if(ibmIDC.formUtil.queryParam("Target")){
            dest_url = ibmIDC.formUtil.queryParam("Target");
        }else if(ibmIDC.idUtil.pwdContinueUrl){
            dest_url = ibmIDC.idUtil.pwdContinueUrl;
        }   
        return escape(dest_url);
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function checkUser
     * @description <p>get user id from cookie or query param if available</p>
     * @returns {void}
     */
    checkUser: function() {
        var referrerId=ibmIDC.logInUtil.getReferrerID();
        if (ibmIDC.logInUtil.tempUserId) { // executed during wrong password
            ibmIDC.logInUtil.showExistingUser(ibmIDC.logInUtil.tempUserId);
        } else if (ibmIDC.logInUtil.queryParam("Id") && !(/[<>;"()]/i.test(ibmIDC.logInUtil.queryParam("Id")))) { // executed when id param is available
            $('#username').val(ibmIDC.logInUtil.queryParam("Id"));// 
            ibmIDC.logInUtil.validateUserId(ibmIDC.logInUtil.queryParam("Id"));
        } else if (referrerId) { //check for URL reffer id value
            $('#username').val(referrerId);// 
            ibmIDC.logInUtil.validateUserId(referrerId);
        }
        else if ($.cookie("FED_LOGIN_URL")) { // Sanjit Bauli3/India/IBM@IBMIN federated login url exists in cookie.
            window.location = decodeURI($.cookie("FED_LOGIN_URL"));
        }
        else if ($.cookie("IBMID_USER")) { // executed if remember me is checked
            $(".rememberChkBox").prop("checked", true);
            ibmIDC.logInUtil.validateUserId($.cookie("IBMID_USER"));
        }
    },
    
    
    getReferrerID : function(){
        var id = ibmIDC.getNVP(decodeURIComponent(document.referrer), "&", "=", "redirect_uri");
        return  ibmIDC.getNVP(id, "&", "=", "ibmid");
        
    },
    
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param String
     * @function queryParam
     * @description <p>return the query param value based on the key passed</p>
     * @returns {String} value of the query param
     */
    queryParam: function(key) {
        key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&");
        var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function isAnonymousUser
     * @description <p>Remember Me check box is checked/unchecked based on current id and cookie id is same or not</p>
     * @returns {void}
     */
    isAnonymousUser : function(){
        if(ibmIDC.logInUtil.tempUserId === $.cookie("IBMID_USER")){
            $(".rememberChkBox").prop( "checked", true);
        }else{
            $(".rememberChkBox").prop( "checked", false);
        }
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function checkUserID
     * @description <p>valid the user id field.</p>
     * @returns {void}
     */
    checkUserID: function(){
        var id = $.trim($('#username').val());
        if(id){
            ibmIDC.logInUtil.validateUserId(id);
        }else{
            $("#msgibmid").html(ibmIDErrMsg['LOGIN-IBMID-REQUIRED']);
        }
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function checkPwd
     * @description <p>valid password field.</p>
     * @returns {void}
     */
    checkPwd: function(){
        var id = $.trim($('#username').val()), pwd = $.trim($('#password').val());
        if(pwd){
            if(id){
                jQuery('#username').val($.trim($('#username').val()));
                ibmIDC.logInUtil.persistUserId(id,true);
                document.forms['ibmid-signin-form'].submit();
            }else{
                $("#pwdErrorMsg").html(ibmIDErrMsg['000']).show();
            }
        }else{
            $("#pwdErrorMsg").html(ibmIDErrMsg['passwordRequired']).show();
        }
    },
    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @param object item - DOM element
     * @function rememberUser
     * @description <p>Set or Remove cookie based on Remember Me checkbox </p>
     * @returns {void}
     */
    rememberUser : function(item){
        if($(item).is(':checked')){
            $.cookie("IBMID_USER", $.trim($('#username').val()),{expires:20*365,path:'/'});
        }else{
            $.removeCookie("IBMID_USER",{path:'/'});
        }
    },
    /**
     * @author Sanjit Bauli3/India/IBM@IBMIN
     * @memberOf ibmIDC
     * @param String
     * @function rememberFederatedLoginUrl
     * @description <p>Store federated login page url to cookie (FED_LOGIN_URL)  by encoding the value. Cookie Lifetime set to 30 days.</p>
     * @returns {String} {void}
     */
    rememberFederatedLoginUrl: function(url){
         var date = new Date();
         var days = 30;
         date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
         $.cookie("FED_LOGIN_URL", encodeURI(url), {  
            path: '/',
            domain: ".ibm.com",
            secure  : true,
            expires: date 
         });
    },    
    /**
     * @author Sabhareesan Padmanabhan2/India/Contr/IBM@IBMIN
     * @memberOf ibmIDC
     * @function init
     * @description <p>Reset the form fields and Identify user session</p>
     * @returns {void}
     */
    init:function(){
        jQuery("#signinbutton").wrap( "<div id='signin_button' style='display:none'></div>");
        //Init loading spinner
        if (jQuery("#processing").length === 0) {
            var spinnerUrl = ibmIDC.idUtil.staticFileBasePath + "img/icon_processing.gif";
            jQuery("body").append('<div id="processing"><div class="ibm-columns"><div class="ibm-col-6-2">&nbsp;</div><div class="ibm-col-6-2"><div class="ibm-spinner-container-page">' +
                '<img src="' + spinnerUrl + '" alt="Processing" style="margin-bottom: 20px;"></div><h1 class="loading-message"></h1></div></div></div></div>');
        }
        if(window.ibmIDErrMsg){
            $("#ng-mobile-backlink").html("<br><a href='#' onclick='ibmIDC.logInUtil.showNewUser()'>"+ibmIDErrMsg['LOGIN-IBMID-DIFFERENT']+"</a>").hide();
            //$("#ng-mobile-signUp").attr('href',jQuery("#ng-mobile-signUp").attr('href')+"&Target="+ibmIDC.logInUtil.redirectURL());
            $("#ng-mobile-signUp").attr('href',ibmIDC.logInUtil.updateQueryString('Target',ibmIDC.logInUtil.redirectURL(),jQuery("#ng-mobile-signUp").attr('href')));
        }        
        $("#remUserID").hide();
        $('#ibmid-signin-form').trigger("reset");
        jQuery("#username").attr("autocorrect","off");
        jQuery("#username").attr("autocapitalize","none");
        ibmIDC.logInUtil.persistUserId($.cookie("useribmid"),false);
        ibmIDC.logInUtil.checkUser();
        var tabindexIds=['#username','#continuebutton','#ng-mobile-signUp','.forgotlink a'];
        ibmIDC.logInUtil.setTabindex(tabindexIds);
        jQuery("#username").focus();
    },
    updateElements: function(){
        if(window.ibmIDErrMsg && ibmIDErrMsg['LOGIN-IBMID-DIFFERENT']){
             $("#ng-mobile-backlink").html("<br><a href='#' onclick='ibmIDC.logInUtil.showNewUser()'>"+ibmIDErrMsg['LOGIN-IBMID-DIFFERENT']+"</a>");

        }
        //$("#ng-mobile-signUp").attr('href',jQuery("#ng-mobile-signUp").attr('href')+"&Target="+ibmIDC.logInUtil.redirectURL());
        $("#ng-mobile-signUp").attr('href',ibmIDC.logInUtil.updateQueryString('Target',ibmIDC.logInUtil.redirectURL(),jQuery("#ng-mobile-signUp").attr('href')));
    },
    clickHandle:function(){
        $('#username, #password').on('keypress', function(event) {
            if (event.which === 13 && $(this).attr("id")=="username"){
                ibmIDC.logInUtil.checkUserID();
            }else if(event.which === 13 && $(this).attr("id")=="password"){
                ibmIDC.logInUtil.checkPwd();
            }else {
                $("#msgibmid,#pwdErrorMsg").html(" ");
            }
        });

        $('#signinbutton').on('click', function(event) {
            ibmIDC.logInUtil.checkPwd();
            event.preventDefault();
        });

        $('#continuebutton').on('click', function(event) {
           ibmIDC.logInUtil.checkUserID();
           event.preventDefault();
        });

        $('.rememberChkBox').on('click', function(event) {
            ibmIDC.logInUtil.rememberUser(this);
         });
        
      /*  code commented by pavan for hiding remember me functionality
        $('#continuefedbutton').on('click', function(event) {
           ibmIDC.logInUtil.rememberFederatedLoginUrl($(this).attr('href'));
           event.preventDefault();
           window.location = $(this).attr('href');
        });*/
        

        ibmIDC.logInUtil.init();
    },
    setTabindex : function(tabindexIds){
        $( tabindexIds ).each(function( index, element ) {
            jQuery(element).removeAttr( "tabindex" );
            jQuery(element).attr('tabindex', index+1);
        });
      }, 
    /**
     *
     * @memberOf ibmIDC
     * @function to append url parameter
     * @description <p>Reset the form fields and Identify user session</p>
     * @returns {void}
     */

    updateQueryString :   function (key, value, url) {
        if (!url) url = window.location.href;
        var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
            hash;

        if (re.test(url)) {
            if (typeof value !== 'undefined' && value !== null)
                return url.replace(re, '$1' + key + "=" + value + '$2$3');
            else {
                hash = url.split('#');
                url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                    url += '#' + hash[1];
                return url;
            }
        }
        else {
            if (typeof value !== 'undefined' && value !== null) {
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                hash = url.split('#');
                url = hash[0] + separator + key + '=' + value;
                if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                    url += '#' + hash[1];
                return url;
            }
            else
                return url;
        }
    },

    showSpinner : function(msg){
        if (msg) {
            jQuery("#processing .loading-message").html(msg);   
        }
        jQuery("#processing").show();
    }

};
jQuery(document).on('ready', function(){
     ibmIDC.logInUtil.clickHandle();
     ibmIDC.logInUtil.updateElements();
});
function messageFileLoaded(){
    ibmIDC.logInUtil.updateElements();
}