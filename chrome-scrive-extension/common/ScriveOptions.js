// Used only in options.html to initialize current options and save when pressing the save button.

Scrive.jsBase = document.URL.substring( 0, document.URL.lastIndexOf( '/' ) ) + "/../"

Scrive.Options = new function () {
  var form = document.querySelector( '#form' );
  var urlInput = document.querySelector( '#url' );
  var clientIdInput = document.querySelector( '#client_id' );
  var clientSecretInput = document.querySelector( '#client_secret' );
  var tokenIdInput = document.querySelector( '#token_id' );
  var tokenSecretInput = document.querySelector( '#token_secret' );
  var saveButton = document.querySelector( '.button.save' );
  var oauthButton = document.querySelector( '.button.oauth' );
  var gotoListOfJobs = document.querySelector( '.goto-list-of-jobs' );

  var client_id = "51bf4005f676fa35_234";
  var client_secret = "f1cbf80661761d67";
  var initiate_endpoint = "https://scrive.com/oauth/temporarycredentials";
  var authorize_endpoint = "https://scrive.com/oauth/authorization";
  var token_endpoint = "https://scrive.com/oauth/tokencredentials";
  ////Mockup:
  //var initiate_endpoint = "https://dev.scrive.com/oauth/temporarycredentials";
  //var authorize_endpoint = "https://dev.scrive.com/oauth/authorization";
  //var token_endpoint = "https://dev.scrive.com/oauth/tokencredentials";

  this.init = function () {

    form.addEventListener( 'submit', function () {
      return false;
    } );
    saveButton.addEventListener( 'click', this.save_options );
    oauthButton.addEventListener( 'click', this.oauth_authorize );
    this.restore_options();
    this.translate_ui();
    gotoListOfJobs.addEventListener( 'click', this.goto_list_of_jobs );

    OAuth.handleCallback( {
      "initiate_endpoint": initiate_endpoint,
      "authorize_endpoint": authorize_endpoint,
      "token_endpoint": token_endpoint,
      "client_id": client_id,
      "client_secret": client_secret,
      "onload": function ( cred ) {
        // oauth_token, oauth_token_secret
        var obj = {};
        obj[ KEYS.OAUTH_TOKEN_ID ] = cred.oauth_token;
        obj[ KEYS.OAUTH_TOKEN_SECRET ] = cred.oauth_token_secret;
        obj[ KEYS.OAUTH_CLIENT_ID ] = client_id;
        obj[ KEYS.OAUTH_CLIENT_SECRET ] = client_secret;
        //                    chrome.storage.sync.set(obj, function () {
        Scrive.Platform.LocalStore.put( obj, function () {
          /*
           * Drop 'oauth_token' and 'oauth_verifier'.
           */
          window.location.href = ( window.location + "" ).split( "?" )[ 0 ];
        } );
      }
    } );
  };

  this.goto_list_of_jobs = function () {
    var url = urlInput.value;

    var clientId = clientIdInput.value;
    var clientSecret = clientSecretInput.value;
    var tokenId = tokenIdInput.value;
    var tokenSecret = tokenSecretInput.value;

    var oauthComponents = [
      "oauth_signature_method=\"PLAINTEXT\"",
      "oauth_consumer_key=\"" + clientId + "\"",
      "oauth_token=\"" + tokenId + "\"",
      "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""
    ];

    var oauthHeader = "OAuth " + oauthComponents.join( "," );

    url = url.replace( "/printer", "/authlogin" );
    url = url + "?authorization=" + encodeURIComponent( oauthHeader );
    window.open( url, '_blank' );

    return false;
  };

  this.save_options = function () {
    var obj = {};
    obj[ KEYS.PRINTER_URL ] = urlInput.value;
    obj[ KEYS.OAUTH_CLIENT_ID ] = clientIdInput.value;
    obj[ KEYS.OAUTH_CLIENT_SECRET ] = clientSecretInput.value;
    obj[ KEYS.OAUTH_TOKEN_ID ] = tokenIdInput.value;
    obj[ KEYS.OAUTH_TOKEN_SECRET ] = tokenSecretInput.value;

    Scrive.LogUtils.debug( "Scrive.Options.save_options: \n" +
      "\n urlInput.value = " + urlInput.value +
      "\n clientIdInput.value = " + clientIdInput.value +
      "\n clientSecretInput.value = " + clientSecretInput.value +
      "\n tokenIdInput.value = " + tokenIdInput.value +
      "\n tokenSecretInput.value = " + tokenSecretInput.value +
      "" );

    Scrive.Platform.LocalStore.put( obj, function () {
      var oldButtonText = saveButton.innerText;
      saveButton.innerText = Scrive.Platform.i18n.getMessage( "saved" );
      setTimeout( function () {
        saveButton.innerText = oldButtonText;
      }, 2500 );
    } );

    return false;
  };

  this.translate_ui = function () {
    document.querySelector( '#options-header' ).innerText = Scrive.Platform.i18n.getMessage( "options" );
    document.querySelector( '.button.save .label' ).innerText = Scrive.Platform.i18n.getMessage( "save" );
    document.querySelector( '#url-label' ).innerText = Scrive.Platform.i18n.getMessage( "printerUrlOptionLabel" );
    document.querySelector( '#oauth-instructions' ).innerText = Scrive.Platform.i18n.getMessage( "oauthInstructions" );
    document.querySelector( 'title' ).innerText = Scrive.Platform.i18n.getMessage( "options" );
    document.querySelector( '.goto-list-of-jobs' ).innerText = Scrive.Platform.i18n.getMessage( "gotoListOfJobs" );
  };

  this.restore_options = function () {
    Scrive.Platform.LocalStore.get( [
      KEYS.PRINTER_URL,
      KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
      KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET
    ], function ( items ) {
      urlInput.value = items[ KEYS.PRINTER_URL ] || DEFAULTS.PRINTER_URL;
      clientIdInput.value = items[ KEYS.OAUTH_CLIENT_ID ] || "";
      clientSecretInput.value = items[ KEYS.OAUTH_CLIENT_SECRET ] || "";
      tokenIdInput.value = items[ KEYS.OAUTH_TOKEN_ID ] || "";
      tokenSecretInput.value = items[ KEYS.OAUTH_TOKEN_SECRET ] || "";
    } );
    return false;
  };

  this.oauth_authorize = function () {
    OAuth.authorize( {
      "initiate_endpoint": initiate_endpoint,
      "authorize_endpoint": authorize_endpoint,
      "token_endpoint": token_endpoint,
      "client_id": client_id,
      "client_secret": client_secret,
      "privileges": "DOC_CREATE+DOC_CHECK+DOC_SEND"
    } );
  };

  this.loader = new function () {

    this.domain = Scrive.jsBase;
    this.initScript = 'common/ScriveOptionsInit.js';

    this.scripts = [
      'common/ScriveLogUtils.js',
      'common/ScrivePlatform.js',

      'oauth.js'
    ];

    if ( Scrive.Main.chrome ) {
      //http://stackoverflow.com/questions/5080028/what-is-the-most-efficient-way-to-concatenate-n-arrays-in-javascript
      this.scripts.push.apply( this.scripts, [
        'chrome/ScriveChromeLogger.js',
        'chrome/ScriveChromei18n.js',
        'chrome/ScriveChromeLocalStore.js',
        'chrome/ScriveChromeHttpRequest.js',
        'chrome/ScriveChromeBrowserUtils.js'
      ] );
    } else {
      this.scripts.push.apply( this.scripts, [
        'ie/ScriveIELogger.js',
        'ie/ScriveIEi18n.js',
        'ie/ScriveIELocalStore.js',
        'ie/ScriveIEHttpRequest.js',
        'ie/ScriveIEBrowserUtils.js',
      ] );
    }

    this.init = function () {

      Scrive.Options.loader.start = new Date().getTime();

      var scriptArray = [];
      for ( var i = 0; i < this.scripts.length; i++ ) {
        scriptArray.push( this.domain + this.scripts[ i ] );
      }

      var lastCb = function () {
        Scrive.Main.init();
      };
      this.loadScripts( scriptArray, lastCb );
    };

    this.loadScripts = function ( loadScriptArray, cb ) {
      var count = loadScriptArray.length;
      var scriptCb = function () {
        //in IE11 readyState is no longer supported
        //http://msdn.microsoft.com/en-us/library/ie/ms534359(v=vs.85).aspx
        //http://blog.getify.com/ie11-please-bring-real-script-preloading-back/
        //https://groups.google.com/forum/#!topic/jsclass-users/x4W3zVYnMFU
        //if (this.readyState == 'loaded' || this.readyState == 'complete')
        {
          count--;
          if ( count <= 0 ) {
            cb.call();
          }
        }
      };
      for ( var i = 0; i < loadScriptArray.length; i++ ) {
        var tag = createScript( loadScriptArray[ i ] );
        //in IE11 readyState is no longer supported
        //tag.onreadystatechange = scriptCb;
        tag.onload = scriptCb;
        appendToHead( tag );
      }
    };

    this.loadCss = function ( filename ) {
      var tag = document.createElement( "link" );
      tag.setAttribute( "rel", "stylesheet" );
      tag.setAttribute( "type", "text/css" );
      tag.setAttribute( "href", filename );
      appendToHead( tag );
    };

    function createScript( filename ) {
      var tag = document.createElement( 'script' );
      tag.setAttribute( "type", "text/javascript" );
      tag.setAttribute( "src", filename );
      //tag.setAttribute("defer", "defer");
      return tag;
    }

    function appendToHead( tag ) {
      var head = document.getElementsByTagName( "head" );
      if ( head ) {
        head[ 0 ].appendChild( tag );
      } else {
        throw "No HEAD element found";
      }
    }
  };
};

Scrive.Options.loader.init();
