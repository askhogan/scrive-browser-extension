
function showError(element : HTMLElement, errorData)
{
  var buildHTML = chrome.i18n.getMessage("somethingWentWrong");
  element.style.display = "block";
  buildHTML = "<p>" + chrome.i18n.getMessage("mailSupportWithErrorMessage") + "</p>";
  if( errorData.response ) {
    buildHTML += chrome.i18n.getMessage("errorMessage") + "<br />" +
                 errorData.response + "<br/>";
  }
  if( errorData.headers && errorData.headers.length!=0 ) {
    buildHTML += errorData.headers.join("<br/>") + "<br/>";
  }
  if( errorData.status && errorData.statusText ) {
    buildHTML += chrome.i18n.getMessage("status") + ": " + errorData.status + " " + errorData.statusText + "<br/>";
  }

  buildHTML += "</p>";
  element.innerHTML = buildHTML;

  chrome.storage.sync.get(KEYS.PRINTER_URL, function(items) {
    var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
    buildHTML = "";
    buildHTML += "<p>" + chrome.i18n.getMessage("systemInformation") + ":<br/>";
    buildHTML += "Chrome Extension Version: " + chrome.runtime.getManifest()["version"] + "<br />";
    buildHTML += chrome.i18n.getMessage("time") + ": " + new Date() + "<br />";
    buildHTML += "Scrive URL: " + printer_url;
    buildHTML += "</p>";
    element.innerHTML += buildHTML;

    mixpanel.track("Error detected", {content: element.innerHTML});
  });
}
