;

function showError(element, errorData) {
    //EKI fix this - localization is not in place yet
//    var buildHTML = chrome.i18n.getMessage("somethingWentWrong");
    var buildHTML = "Something went wrong!";
    element.style.display = "block";
//    buildHTML = "<p>" + chrome.i18n.getMessage("mailSupportWithErrorMessage") + "</p>";
    buildHTML = "<p>" + "By emailing the error message below to \u003Ca target='_blank' href='mailto:info@scrive.com?subject=Scrive Chrome-extension - bug'\>info@scrive.com\u003C/a\>, you help us make the service even better." + "</p>";
    buildHTML += "<p>";
    if (errorData.url) {
        buildHTML += errorData.url + "<br/>";
    }
    if (errorData.response) {
//        buildHTML += chrome.i18n.getMessage("errorMessage") + "<br />" + errorData.response + "<br/>";
        buildHTML += "Error message" + "<br />" + errorData.response + "<br/>";
    }
    if (errorData.headers && errorData.headers.length != 0) {
        buildHTML += errorData.headers.join("<br/>") + "<br/>";
    }
    if (errorData.status && errorData.statusText) {
//        buildHTML += chrome.i18n.getMessage("status") + ": " + errorData.status + " " + errorData.statusText + "<br/>";
        buildHTML += "Status" + ": " + errorData.status + " " + errorData.statusText + "<br/>";
    }

    buildHTML += "</p>";

//    chrome.storage.sync.get(KEYS.PRINTER_URL, function (items) {
//        var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
//        buildHTML += "<p>" + chrome.i18n.getMessage("systemInformation") + ":<br/>";
//        buildHTML += "Chrome Extension Version: " + chrome.runtime.getManifest()["version"] + "<br />";
//        buildHTML += chrome.i18n.getMessage("time") + ": " + new Date() + "<br />";
//        buildHTML += "Scrive URL: " + printer_url;
//        buildHTML += "</p>";
//        element.innerHTML = buildHTML;

        buildHTML += "<p>" + "System information" + ":<br/>";
        buildHTML += "IE Extension Version: 0.5" + "<br />";
        buildHTML += "Time" + ": " + new Date() + "<br />";
        buildHTML += "Scrive URL: " + Scrive.Platform.LocalStore.get(KEYS.PRINTER_URL);
        buildHTML += "</p>";
        element.innerHTML = buildHTML;
//
//        mixpanel.track("Error detected", { content: buildHTML });
//    });
}
