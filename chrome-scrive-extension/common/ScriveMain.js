
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
  //oauthdata
  OAUTH_CLIENT_ID: 'oauth_client_id',
  OAUTH_CLIENT_SECRET: 'oauth_client_secret',
  OAUTH_TOKEN_ID: 'oauth_token_id',
  OAUTH_TOKEN_SECRET: 'oauth_token_secret',
  //userprofiledata
  USER_PROFILE: 'user_profile',
  //userprofiledata FLAGS
  DATA_OAUTH: 'data_oauth',
  DATA_PRINTURL: 'data_printurl',
  DATA_PROFILE: 'data_profile'
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

  this.data = {};
  this.profile= {};

  this.dataOauth= false;
  this.dataPrintUrl= false;
  this.dataProfile= false;

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

      Scrive.Main.initData();

      Scrive.LogUtils.info( "Scrive.Main.init Total time " + ( new Date().getTime() - mainStart ) + "ms" );

    } catch ( e ) {
      alert( "While initializing Scrive: " + e.message );
    }
  };

  this.initData = function (callback) {
    Scrive.Platform.LocalStore.get( [
      KEYS.DATA_OAUTH, KEYS.DATA_PRINTURL, KEYS.DATA_PROFILE , KEYS.USER_PROFILE
    ], function ( items ) {
      Scrive.Main.dataOauth= items[KEYS.DATA_OAUTH];
      Scrive.Main.dataPrintUrl= items[KEYS.DATA_PRINTURL];
      Scrive.Main.dataProfile= items[KEYS.DATA_PROFILE];
      Scrive.Main.data= items[KEYS.USER_PROFILE];

      if (Scrive.Main.data)
        Scrive.Main.profile = JSON.parse(Scrive.Main.data);

      Scrive.LogUtils.info(
      "\nScrive.Main.dataOauth=" + items[KEYS.DATA_OAUTH] +
      "\nScrive.Main.dataPrintUrl=" + items[KEYS.DATA_PRINTURL] +
      "\nScrive.Main.dataProfile=" + items[KEYS.DATA_PROFILE] +
      "\nScrive.Main.data=" + items[KEYS.USER_PROFILE]
      )

      if ( callback )
        callback.call( null );

    } );
    return false;
  };

  function isChrome() {
    return navigator.userAgent.toLowerCase().indexOf( 'chrome' ) != -1;
  }
};