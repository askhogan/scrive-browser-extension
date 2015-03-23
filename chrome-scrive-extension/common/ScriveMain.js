
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
  USER: 'user_profile'
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

  var profile_endpoint = "https://scrive.com/api/v1/getprofile";

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


  this.initData = function () {
    var propArray = [];

    //prepare an array
    for ( var key in KEYS ) {
      if ( KEYS.hasOwnProperty( key ) )
        propArray.push( KEYS[ key ] );
    }

    //get settings
    Scrive.Platform.LocalStore.get( propArray, function ( items ) {
      Scrive.Main.data = items;

      Scrive.Main.verifyPrintUrl();

      if (!Scrive.Main.verifyOAuthData())
        Scrive.Main.oauth_getprofile();
    } );
  };

  this.verifyPrintUrl = function () {
    if ( Scrive.Main.data[KEYS.PRINTER_URL]
        //http://stackoverflow.com/questions/8830411/regex-to-match-simple-domain
        && (/^https?:\/\/([a-zA-Z\d-]+\.){0,}scrive\.com/.test(Scrive.Main.data[KEYS.PRINTER_URL]))
    ) {
      var options = new Object();

      options.onload = function ( rq ) {
        if ( ( rq.status >= 200 && rq.status <= 299 ) || rq.status < 100 ) {
          Scrive.Main.dataPrintUrl = true;
        }
      };

      Scrive.Platform.HttpRequest.get(Scrive.Main.data[KEYS.PRINTER_URL], options);
    }
  };

  this.verifyOAuthData = function () {
    return ( !Scrive.Main.data[KEYS.OAUTH_CLIENT_ID]
        || !Scrive.Main.data[KEYS.OAUTH_CLIENT_SECRET]
        || !Scrive.Main.data[KEYS.OAUTH_TOKEN_ID]
        || !Scrive.Main.data[KEYS.OAUTH_TOKEN_SECRET]
        );
  };

  function isChrome() {
    return navigator.userAgent.toLowerCase().indexOf( 'chrome' ) != -1;
  }

  this.oauth_getprofile = function () {
    OAuth.getprofile( {
      "oauth_consumer_key": Scrive.Main.data[ KEYS.OAUTH_CLIENT_ID ],
      "oauth_signature": Scrive.Main.data[ KEYS.OAUTH_CLIENT_SECRET ] + "&" + Scrive.Main.data[ KEYS.OAUTH_TOKEN_SECRET ],
      "oauth_signature_method": "PLAINTEXT",
      "oauth_token": Scrive.Main.data[ KEYS.OAUTH_TOKEN_ID ],
      "endpoint": profile_endpoint,

      "onload": function ( data ) {
        Scrive.Main.profile = JSON.parse(data);
        if (Scrive.Main.profile)
        {
          Scrive.Main.dataProfile = true;
          Scrive.Main.dataOauth = true;   // now we know that our OAuth is working

          var obj = {};
          obj[ KEYS.USER ] = data;

          Scrive.Platform.LocalStore.put( obj, function () {
            ;
          } );
        }
      }
    } );
  };
};