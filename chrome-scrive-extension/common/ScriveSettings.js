
Scrive.Settings = new function () {

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

      Scrive.Settings.initData();

      Scrive.LogUtils.info( "Scrive.Settings.init Total time " + ( new Date().getTime() - mainStart ) + "ms" );

    } catch ( e ) {
      alert( "While initializing Scrive Settings: " + e.message );
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
      Scrive.Settings.data = items;

      Scrive.Settings.verifyPrintUrl();

      if (!Scrive.Settings.verifyOAuthData())
        Scrive.Settings.oauth_getprofile();
      else {
        var obj = {};
        obj[ KEYS.DATA_OAUTH ] = false;

        Scrive.Platform.LocalStore.put( obj, function () {
          ;
        } );
      }
    } );
  };

  this.verifyPrintUrl = function () {
    if ( Scrive.Settings.data[KEYS.PRINTER_URL]
      //http://stackoverflow.com/questions/8830411/regex-to-match-simple-domain
        && (/^https?:\/\/([a-zA-Z\d-]+\.){0,}scrive\.com/.test(Scrive.Settings.data[KEYS.PRINTER_URL]))
        ) {
      var options = new Object();

      options.onload = function ( rq ) {
        if ( ( rq.status >= 200 && rq.status <= 299 ) || rq.status < 100 ) {
          Scrive.Settings.dataPrintUrl = true;

          var obj = {};
          obj[ KEYS.DATA_PRINTURL ] = true;

          Scrive.Platform.LocalStore.put( obj, function () {
            ;
          } );
        }
      };

      options.onerror = function ( rq ) {
          var obj = {};
          obj[ KEYS.DATA_PRINTURL ] = false;

          Scrive.Platform.LocalStore.put( obj, function () {
            ;
          } );
      };

      options.onreadystatechange = function(data) {
        if (data.readyState === 4){   //if complete
          if(data.status === 200){  //check if "OK" (200)
            //success
          } else {
            var obj = {};
            obj[ KEYS.DATA_PRINTURL ] = false;

            Scrive.Platform.LocalStore.put( obj, function () {
              ;
            } );
          }
        }
      };

      Scrive.Platform.HttpRequest.get(Scrive.Settings.data[KEYS.PRINTER_URL], options);
    }
  };

  this.verifyOAuthData = function () {
    return ( !Scrive.Settings.data[KEYS.OAUTH_CLIENT_ID]
        || !Scrive.Settings.data[KEYS.OAUTH_CLIENT_SECRET]
        || !Scrive.Settings.data[KEYS.OAUTH_TOKEN_ID]
        || !Scrive.Settings.data[KEYS.OAUTH_TOKEN_SECRET]
        );
  };

  function isChrome() {
    return navigator.userAgent.toLowerCase().indexOf( 'chrome' ) != -1;
  }

  this.oauth_getprofile = function () {
    OAuth.getprofile( {
      "oauth_consumer_key": Scrive.Settings.data[ KEYS.OAUTH_CLIENT_ID ],
      "oauth_signature": Scrive.Settings.data[ KEYS.OAUTH_CLIENT_SECRET ] + "&" + Scrive.Settings.data[ KEYS.OAUTH_TOKEN_SECRET ],
      "oauth_signature_method": "PLAINTEXT",
      "oauth_token": Scrive.Settings.data[ KEYS.OAUTH_TOKEN_ID ],
      "endpoint": profile_endpoint,

      "onerror": function ( data ) {
        var obj = {};
        obj[ KEYS.DATA_PROFILE ] = false;
        obj[ KEYS.DATA_OAUTH ] = false;

        Scrive.Platform.LocalStore.put( obj, function () {
          ;
        } );
      },

      "onreadystatechange": function(data) {
        if (data.readyState === 4){   //if complete
          if(data.status === 200){  //check if "OK" (200)
            //success
          } else {
            var obj = {};
            obj[ KEYS.DATA_PROFILE ] = false;
            obj[ KEYS.DATA_OAUTH ] = false;

            Scrive.Platform.LocalStore.put( obj, function () {
              ;
            } );
          }
        }
      },

      "onload": function ( data ) {
        Scrive.Settings.profile = JSON.parse(data);
        if (Scrive.Settings.profile)
        {
          Scrive.Settings.dataProfile = true;
          Scrive.Settings.dataOauth = true;   // now we know that our OAuth is working

          var obj = {};
          obj[ KEYS.USER_PROFILE ] = data;
          obj[ KEYS.DATA_PROFILE ] = true;
          obj[ KEYS.DATA_OAUTH ] = true;

          Scrive.Platform.LocalStore.put( obj, function () {
            ;
          } );
        }
      }
    } );
  };
};
