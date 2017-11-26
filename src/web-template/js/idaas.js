function showSpinner(var msg) {
	if (jQuery("#processing").length === 0) {
		jQuery("body").append('<div id="processing"><div class="ibm-columns"><div class="ibm-col-6-2">&nbsp;</div><div class="ibm-col-6-2"><div class="ibm-spinner-container-page"><img src="../img/icon_processing.gif" alt="Processing" style="margin-bottom: 20px;"></div><h1 class="loading-message"></h1></div></div></div></div>');
	}
	if (msg) {
		jQuery("#processing .loading-message").html(msg);	
	}
	jQuery("#processing").show();
}

function 