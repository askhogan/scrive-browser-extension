;

function showError( element, errorData ) {
  var buildHTML = Scrive.Platform.i18n.getMessage( "somethingWentWrong" );
  element.style.display = "block";
  buildHTML = "<p>" + Scrive.Platform.i18n.getMessage( "mailSupportWithErrorMessage" ) + "</p>";
  buildHTML += "<p>";
  if ( errorData.url ) {
    buildHTML += errorData.url + "<br/>";
  }
  if ( errorData.response ) {
    buildHTML += Scrive.Platform.i18n.getMessage( "errorMessage" ) + "<br />" + errorData.response + "<br/>";
  }
  if ( errorData.headers && errorData.headers.length != 0 ) {
    buildHTML += errorData.headers.join( "<br/>" ) + "<br/>";
  }
  if ( errorData.status && errorData.statusText ) {
    buildHTML += Scrive.Platform.i18n.getMessage( "status" ) + ": " + errorData.status + " " + errorData.statusText + "<br/>";
  }

  buildHTML += "</p>";

  Scrive.Platform.LocalStore.get( KEYS.PRINTER_URL, function ( items ) {
    var printer_url = items[ KEYS.PRINTER_URL ] || DEFAULTS.PRINTER_URL;
    buildHTML += "<p>" + Scrive.Platform.i18n.getMessage( "systemInformation" ) + ":<br/>";
    buildHTML += "Chrome Extension Version: " + Scrive.Platform.BrowserUtils.getExtensionVersion() + "<br />";
    buildHTML += Scrive.Platform.i18n.getMessage( "time" ) + ": " + new Date() + "<br />";
    buildHTML += "Scrive URL: " + printer_url;
    buildHTML += "</p>";
    element.innerHTML = buildHTML;

    Scrive.Mixpanel.track( "Error detected", {
      content: buildHTML
    } );
  } );
}