    Scrive.IE.i18n = new function () {
      //We need to auto detected this
      var locale = 'en'; //'sv' swedish 'en' english

      //This is IE specific and we need to test if this works for all supported IE versions
      //http://stackoverflow.com/questions/3894488/is-there-anyway-to-detect-os-language-using-javascript
      var userLanguage = navigator.userLanguage;

      var localeJSON;

      this.init = function () {
        var options = new Object();

        //here we detect if we have swedish user or not - default is 'en' english
        if ( userLanguage.indexOf( "sv" ) != -1 ) locale = 'sv';

        options.url = Scrive.jsBase + '_locales/' + locale + '/messages.json';

        options.responseType = 'x-www-form-urlencoded';
        //options.onerror = params.onerror || oauthOnError;
        options.onload = function ( rq ) {
          if ( ( rq.status >= 200 && rq.status <= 299 ) || rq.status < 100 ) {

            localeJSON = JSON.parse( rq.responseText );

            Scrive.LogUtils.debug( "i18n responseText: " + rq.responseText );
          } else {
            Scrive.LogUtils.error( "i18n failed to load: " + options.url );
          }
        };

        Scrive.LogUtils.log( "i18n init: " + options.url );

        Scrive.Platform.HttpRequest.get( options.url, options );
      };

      this.getMessage = function ( resource ) {

        if ( localeJSON ) {
          if ( localeJSON.hasOwnProperty( resource ) && localeJSON[ resource ].hasOwnProperty( 'message' ) )

            return localeJSON[ resource ].message;
        } else
          return "(^-^)"; //chrome.i18n.getMessage(resource);
      };
    };
