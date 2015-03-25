
// Defines Scrive, Scrive.IE, Scrive.CH namespaces
if ( Scrive == null || typeof ( Scrive ) != "object" ) {
  var Scrive = new Object();
}

if ( !Scrive.CH )
  Scrive.CH = new Object();
if ( !Scrive.IE )
  Scrive.IE = new Object();

var KEYS = {
  PRINTER_URL: 'printer_url',
  OAUTH_CLIENT_ID: 'oauth_client_id',
  OAUTH_CLIENT_SECRET: 'oauth_client_secret',
  OAUTH_TOKEN_ID: 'oauth_token_id',
  OAUTH_TOKEN_SECRET: 'oauth_token_secret'
};

var DEFAULTS = {
  PRINTER_URL: ""
};

var MESSAGES = {
  PDFEXISTSONPAGE: 'pdfexistsonpage',
  PRINTTOPAPER: 'printtopaper',
  PRINTTOESIGN: 'printtoesign',
  XMLHTTPREQUESTERROR: 'xmlhttprequesterror'
};

Scrive.Main = new function () {

  this.chrome = isChrome();

  this.init = function () {
    try {
      Scrive.LogUtils.debugOn = true;
      Scrive.LogUtils.profileOn = false;
      Scrive.LogUtils.infoOn = true;

      var mainStart = new Date().getTime();

      //Initialize platform specific stuff
      if ( Scrive.Platform && Scrive.Platform.init )
        Scrive.Platform.init();
      if ( Scrive.ContentScript && Scrive.ContentScript.init )
        Scrive.ContentScript.init();
      if ( Scrive.Popup && Scrive.Popup.init )
        Scrive.Popup.init();
      if ( Scrive.Options && Scrive.Options.init )
        Scrive.Options.init();
      if ( Scrive.DirectUpload && Scrive.DirectUpload.init )
        Scrive.DirectUpload.init();

      // we add property to the main document to signal that Scrive was loaded and initialized
      document.documentElement.setAttribute( '_scriveloaded' , true );

      Scrive.LogUtils.info( "Scrive.Main.init Total time " + ( new Date().getTime() - mainStart ) + "ms" );

    } catch ( e ) {
      alert( "While initializing Scrive: " + e.message );
    }
  };

  function isChrome() {
    return navigator.userAgent.toLowerCase().indexOf( 'chrome' ) != -1;
  }
};