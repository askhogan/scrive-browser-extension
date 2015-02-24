var OAuth = ( ( function () {
  function getCookie( name ) {
    var cookies = document.cookie.split( ';' );
    for ( var i in cookies ) {
      var parts = cookies[ i ].split( '=' );
      if ( parts[ 0 ] == name ) {
        parts.shift();
        return parts.join( "=" );
      }
    }
    // return undefined
  };

  function setCookie( name, value ) {
    document.cookie = name + '=' + value;
  };

  function deleteCookie( name ) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  function parameterEncode( value ) {
    var hex = "0123456789ABCDEF";
    var result = "";
    var count = value.length;
    for ( var i = 0; i < count; i++ ) {
      var c = value.charAt( i );

      /*
       * Unreserved characters MUST NOT be encoded. Everything else
       * MUST BE encoded. Hex digits MUST be uppercase. Encoding
       * MUST be UTF8.
       */
      if ( c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c == "-" || c == "." || c == "_" || c == "~" ) {
        result = result + c;
      } else {
        // note: we should support UTF-8 here
        var cc = c.charCodeAt( 0 );
        result = result + "%" + hex[ ( cc / 16 ) & 15 ] + hex[ cc & 15 ];
      }
    }
    return result;
  };

  function authorizationHeader( fields ) {
    var result = [];

    /*
     * Order of these fields is important.
     */
    var names = [
      "oauth_consumer_key",
      "oauth_token",
      "oauth_signature_method",
      "oauth_timestamp",
      "oauth_nonce",
      "oauth_callback",
      "oauth_verifier",
      "oauth_version",
      "oauth_signature"
    ];
    for ( var keyindex in names ) {
      var key = names[ keyindex ];
      if ( fields.hasOwnProperty( key ) ) {
        if ( key != "oauth_signature" ) {
          result.push( key + "=\"" + parameterEncode( fields[ key ] ) + "\"" );
        } else {
          // self compatibility mode: do not encode &
          result.push( key + "=\"" + fields[ key ] + "\"" );
        }
      }
    }
    return "OAuth " + result.join( "," );
  };

  function decodeQueryString( query ) {
    var pairs = query.split( '&' );
    var result = {};
    var len = pairs.length;
    var tmp, key, value;

    for ( var i = 0; i < len; i++ ) {
      tmp = pairs[ i ].split( '=' );
      if ( tmp != "" ) {
        key = decodeURIComponent( tmp.shift() );

        // allow only first item through
        if ( !result.hasOwnProperty( key ) ) {
          value = decodeURIComponent( tmp.join( "=" ) );
          result[ key ] = value;
        }
      }
    }
    return result;
  };

  /*
   * This is a fallback method when onerror was not given.
   */
  function oauthOnError( rq ) {
    Scrive.LogUtils.log( "OAuth communication error: " + rq.status + " " + rq.statusText );
    Scrive.LogUtils.log( "OAuth URL: " + rq.status + " " + rq.statusText );
    Scrive.LogUtils.log( "" + rq.getAllResponseHeaders() );
    Scrive.LogUtils.log( "Response type: " + rq.responseType );
    Scrive.LogUtils.log( rq.responseText );
  };

  function requestToken( params ) {
    var options = new Object();

    var endpoint = params.endpoint;

    if ( params.privileges ) {
      endpoint = endpoint + "?privileges=" + encodeURIComponent( params.privileges );
    }

    options.responseType = 'x-www-form-urlencoded';
    options.onerror = params.onerror || oauthOnError;
    options.onload = function ( rq ) {
      if ( ( rq.status >= 200 && rq.status <= 299 ) || rq.status < 100 ) {
        Scrive.LogUtils.debug( "responseText: " + rq.responseText );
        params.onload( decodeQueryString( rq.responseText ) );
      } else {
        ( params.onerror || oauthOnError )( rq );
      }
    };

    options.headers = new Object();
    options.headers[ "Authorization" ] = authorizationHeader( params );

    Scrive.LogUtils.log( authorizationHeader( params ) );

    Scrive.Platform.HttpRequest.get( endpoint, options );

  };

  /*
   * This function executes first half of OAuth handshake. First asks
   * for temporary credentials, then redirects to confirm user
   * acceptance of privileges. This functionreturns but in the
   * background eventually it should redirect to authorize_endpoint.
   */
  function authorize( params ) {
    requestToken( {
      "oauth_consumer_key": params.client_id,
      "oauth_signature": params.client_secret + "&0",
      "oauth_signature_method": "PLAINTEXT",
      "oauth_callback": params.callback || ( window.location + "" ).split( "?" ).shift(),
      "privileges": params.privileges,
      "endpoint": params.initiate_endpoint,
      "onerror": params.onerror,
      "onload": function ( tempcred ) {
        //oauth_token, oauth_token_secret, oauth_callback_confirmed
        if ( tempcred.oauth_token ) {
          setCookie( "oauth_temporary_token_secret", tempcred.oauth_token_secret );
          if ( /\?/.test( params.authorize_endpoint ) ) {
            window.location.href = params.authorize_endpoint + "&oauth_token=" + encodeURIComponent( tempcred.oauth_token );
          } else {
            window.location.href = params.authorize_endpoint + "?oauth_token=" + encodeURIComponent( tempcred.oauth_token );
          }
        }
      }
    } );
  };

  /*
   * All in one magic. Naviating to this page triggers an OAuth
   * handshake.  This page serves also the double purpose of receving
   * incoming handshake confirmation.  Then it puts data in local
   * storage and navigates back.
   */
  function handleCallback( params ) {
    /* Drop '?' from the front of search string */
    var query = decodeQueryString( window.location.search.substring( 1 ) );

    /* If coming back from redirection query should contain
     * 'oauth_token' and 'oauth_verifier'.
     */
    if ( query.hasOwnProperty( "oauth_token" ) && query.hasOwnProperty( "oauth_verifier" ) ) {
      var oauth_temporary_token_secret = getCookie( "oauth_temporary_token_secret" );
      deleteCookie( "oauth_temporary_token_secret" );
      requestToken( {
        "oauth_consumer_key": params.client_id,
        "oauth_token": query.oauth_token,
        "oauth_signature_method": "PLAINTEXT",
        "oauth_verifier": query.oauth_verifier,
        "oauth_signature": params.client_secret + "&" + oauth_temporary_token_secret,
        "endpoint": params.token_endpoint,
        "onerror": params.onerror,
        "onload": params.onload
      } );
    }
  };

  return {
    "authorize": authorize,
    "handleCallback": handleCallback,
    "authorizationHeader": authorizationHeader
  };
} )() );