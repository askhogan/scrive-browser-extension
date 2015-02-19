
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

      mainStart = new Date().getTime();

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

      Scrive.LogUtils.info( "Scrive.Main.init Total time " + ( new Date().getTime() - mainStart ) + "ms" );

    } catch ( e ) {
      alert( "While initializing Scrive: " + e.message );
    }
  };

  function isChrome() {
    return navigator.userAgent.toLowerCase().indexOf( 'chrome' ) != -1;
  }
};

// Init Platform - the abstraction around platform specific code.

Scrive.Platform = new function () {

  this.chrome = Scrive.Main.chrome;

  // Call this explicitly to initialize platform specific code.
  this.init = function () {
    try {
      //this.chrome = isChrome();
      if ( !Scrive.Platform.chrome )
        Scrive.Main.activeXObj = new ActiveXObject( "ScriveBHO.ScriveActiveX" );

      Scrive.Platform.Logger = this.chrome ? Scrive.CH.Logger : Scrive.IE.Logger;
      if ( Scrive.Platform.Logger.init ) Scrive.Platform.Logger.init();

      Scrive.Platform.LocalStore = this.chrome ? Scrive.CH.LocalStore : Scrive.IE.LocalStore;
      if ( Scrive.Platform.LocalStore.init ) Scrive.Platform.LocalStore.init();

      Scrive.Platform.BrowserUtils = this.chrome ? Scrive.CH.BrowserUtils : Scrive.IE.BrowserUtils;
      if ( Scrive.Platform.BrowserUtils.init ) Scrive.Platform.BrowserUtils.init();

      Scrive.Platform.HttpRequest = this.chrome ? Scrive.CH.HttpRequest : Scrive.IE.HttpRequest;
      if ( Scrive.Platform.HttpRequest.init ) Scrive.Platform.HttpRequest.init();

      Scrive.Platform.i18n = this.chrome ? Scrive.CH.i18n : Scrive.IE.i18n;
      if ( Scrive.Platform.i18n.init ) Scrive.Platform.i18n.init();

    } catch ( e ) {
      Scrive.LogUtils.error( "Scrive.Platform.init" );
    }
  };
};

Scrive.LogUtils = new function () {

  this.debugOn = false;
  this.profileOn = false;
  this.infoOn = false;

  this.message = function ( msg ) {
    doPrint( "message", msg );
  };

  this.log = function ( msg ) {
    doPrint( "message", msg );
  };

  this.info = function ( msg ) {
    if ( Scrive.LogUtils.infoOn ) {
      doPrint( "info", msg );
    }
  };

  this.error = function ( s, e ) {
    var msg = ( e != null ) ? s + " " + Scrive.Platform.Logger.getErrorMessage( e ) : s;
    doPrint( "error", msg );
  };

  this.debug = function ( s ) {
    if ( Scrive.LogUtils.debugOn ) {
      doPrint( "debug", s );
    }
  };

  this.start = function ( s ) {
    if ( Scrive.LogUtils.profileOn ) {
      Scrive.LogUtils[ s ] = new Date();
      doPrint( "start", s );
    }
  };

  this.end = function ( s ) {
    if ( Scrive.LogUtils.profileOn ) {
      var start = Scrive.LogUtils[ s ];
      var end = new Date();
      try {
        Scrive.LogUtils.message( "end: " + s + ", took " + ( end.getTime() - start.getTime() ) );
        delete( Scrive.LogUtils[ s ] );
      } catch ( e ) {
        Scrive.LogUtils.error( "start for " + s + " is not defined" );
      }
    }
  };

  function doPrint( prefix, msg ) {
    Scrive.Platform.Logger.print( "[Scrive " + prefix + ": " + getTimestamp() + " " + msg + "]" );
  }

  function getTimestamp() {
    var currentTime = new Date();
    var minutes = currentTime.getMinutes();
    return ( currentTime.getMonth() + 1 ) + "/" + currentTime.getDate() + "/" + currentTime.getFullYear() + " " +
      currentTime.getHours() + ":" + ( minutes < 10 ? "0" + minutes : minutes ) + ":" + currentTime.getSeconds() + ":" + currentTime.getMilliseconds();
  }
};
Scrive.IE.Logger = new function () {

  this.console = null;
  //    this.fbl = false;

  this.getErrorMessage = function ( e ) {
    return e.message ? e.message : e;
  };

  this.print = function ( msg ) {
    if ( typeof window.console == "undefined" ) {
      var p = document.createElement( 'p' );
      if ( msg.indexOf( "Scrive message" ) != -1 ) {
        p.setAttribute( "style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #0000ff;" );
      } else if ( msg.indexOf( "Scrive error" ) != -1 ) {
        p.setAttribute( "style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #ff0000;" );
      } else {
        p.setAttribute( "style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #000000;" );
      }
      p.appendChild( document.createTextNode( msg ) );
      Scrive.IE.Logger.console.appendChild( p );
    } else {
      if ( msg.indexOf( "Scrive message" ) != -1 ) console.info( msg );
      else if ( msg.indexOf( "Scrive error" ) != -1 ) console.error( msg );
      else console.log( msg );
    }
  };

  this.init = function () {
    try {
      //http://msdn.microsoft.com/en-us/library/dd565625%28v=vs.85%29.aspx#consolelogging
      //http://stackoverflow.com/questions/2656730/internet-explorer-console
      if ( typeof window.console == "undefined" ) {
        Scrive.IE.Logger.console = document.createElement( 'div' );
        Scrive.IE.Logger.console.setAttribute( "style", "display: block; width: 500px; height: 200px; background-color: #ffffff; border: 5px solid #000000; padding: 10px; overflow: scroll; position: absolute; z-index: 100000; left: 30px; top: 30px;" );
        document.body.appendChild( Scrive.IE.Logger.console );
      } else
        Scrive.IE.Logger.console = window.console;

    } catch ( e ) {
      alert( "While initializing logger: " + e.message );
    }

  };

  //    this.showConsole = function() {
  //        if (typeof window.console == "undefined")   Scrive.IE.Logger.console.style.display = "block";
  //    }
};
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

Scrive.IE.LocalStore = new function () {


  this.put = function ( object, callback ) {
    for ( var i in object ) {
      this.setValue( i, object[ i ] );
    }
    if ( callback )
      callback.call( null );
  };

  this.get = function ( object, callback ) {
    var resultMap = new Object();
    for ( var i = 0; i < object.length; i++ ) {
      resultMap[ object[ i ] ] = this.getValue( object[ i ] );
    }
    if ( callback )
      callback.call( null, resultMap );
  };

  this.getValue = function ( key ) {
    var val = Scrive.Main.activeXObj.pref( key );
    if ( val == null ) { //just in case we try this again. I suspect we might have a bug here
      val = Scrive.Main.activeXObj.pref( key );
    }
    return val;
  };

  this.setValue = function ( key, val ) {
    var oldVal = Scrive.Main.activeXObj.pref( key );
    if ( key && val && ( oldVal != val ) ) {
      Scrive.Main.activeXObj.pref( key ) = val;
    }
  }
};
Scrive.IE.BrowserUtils = new function () {

  this.showPopup = true;

  this.getExtensionVersion = function () {
    return Scrive.Main.activeXObj.version;
  };
};
Scrive.IE.HttpRequest = new function () {

  // Options
  // .method - request type, by default it's GET
  // .docType - document type
  // .data - request data, used for POST requests
  // .returnText - return response text instead of XML
  // .headers - additional headers, as type Map
  this.get = function ( url, options ) {
    try {
      options = options ? options : new Object();

      options.method = options.method ? options.method : "GET";
      //options.docType = options.docType ? options.docType : "text/xml";
      //options.data = options.data ? options.data : "";

      if ( options.method == "POST" && options.docType == null ) {
        options.docType = "application/x-www-form-urlencoded";
      }

      //we skip this for now..
      //            if (options.headers) {
      //                var i=0;
      //                for ( var key in options.headers ) {
      //                    if (options.headers.hasOwnProperty(key)) {
      //                        // This is the way we will pass headers to IE
      //                        options[ "header" + i + "_name" ] = key;
      //                        options[ "header" + i + "_value" ] = options.headers[key];
      ////                        xmlHttpReq.setRequestHeader(key, options.headers[key]);
      //                        Scrive.LogUtils.log("header: " + key + " value:" + options.headers[key]);
      //                    }
      //                    i++;
      //                }
      //            }
      //
      //            if (options.headers.hasOwnProperty("Authorization")) {
      //                Scrive.LogUtils.debug("options.setRequestHeader.get(\"Authorization\"):  " + options.headers["Authorization"]);
      //            }

      var xmlHttpReq = null;

      //until I add handling of headers to IE addon we have to do it like this.
      if ( options.hasOwnProperty( "headers" ) && options.headers.hasOwnProperty( "Authorization" ) )
        xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest( url, options.method, options.headers[ "Authorization" ] );
      else
        //note: it has to be space " " addon can crash otherwise - fix this!
        xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest( url, options.method, " " );

      if ( xmlHttpReq ) {
        Scrive.LogUtils.debug( "HttpRequest: got respond for " + url );
        if ( options.onload )
          options.onload( xmlHttpReq );
      } else {
        Scrive.LogUtils.debug( "HttpRequest: failed for " + url );
        options.onerror( xmlHttpReq );
      }

    } catch ( e ) {
      Scrive.LogUtils.error( "HttpRequest.get: " + url, e );
    }
  };

  this.put = function ( url, options ) {
    //this is used only by Scrive.ContentScript.uploadPDFDataWithCredentials
    //note:IE extension has printer_url hardcoded in - change this!
    this.get( options.url, options );
  };

  //PDF is downloaded by IE extension
  this.PrintToEsign = function ( pdfurl ) {

    var savedData = new Object();
    savedData.url = pdfurl;
    savedData.method = "PUT";
    this.sendPDF( savedData, Scrive.Popup.errorCallback );

  };

  /*
   * First get the PDF with a xhr call, then put it to the middleware
   */
  this.sendPDF = function ( request, errorCallback ) {
    //PDF is downloaded by IE extension

    //add this also for IE
    //        Author: Gracjan Polak
    //        Date: 27.10.2014 9:36:42
    //        Message: Add support for local files

    //Open signing status in the same page!
    Scrive.ContentScript.uploadPDFData( request, errorCallback, true );
  };

};
/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="show_error.ts" />

/*
 * (C) 2014 by Scrive
 *
 * This script should be injected into a Google Chrome page when
 * looking at a PDF.  It will find the single EMBED tag, see if it
 * really is a PDF, download its content as bytes (hopefully from
 * cache). Then it will forward its contents to Scrive printer
 * interface.
 *
 * TODO:
 * - Update the comment above.
 * - handle more errors
 * - add a spinner for the time of upload
 */
var keepErrorInfo = {};

Scrive.ContentScript = new function () {
  this.init = function () {};

  this.getAbsoluteURL = function ( url, document ) {
    /* Some say that it is better to use IMG here, but experiments
     * show that Chrome tries to load the IMG, which is not a good
     * thing. A tag works ok.
     */
    var a = document.createElement( 'a' );
    a.href = url; // set string url
    url = a.href; // get qualified url, browser magic has happened
    return url;
  };

  // uploadData has the form:
  //
  // For each key contains the list of all values for that key. If the
  // data is of another media type, or if it is malformed, the
  // dictionary is not present. An example value of this dictionary is
  // {'key': ['value1', 'value2']}.
  //
  // Note that this is something else than thing called UploadData
  this.uploadDataToFormData = function ( uploadData ) {
    var formData = new FormData();
    for ( var k in uploadData ) {
      for ( var i in uploadData[ k ] ) {
        formData.append( k, uploadData[ k ][ i ] );
      }
    }
    return formData;
  };

  /**
   * Look through the DOM and search for PDF's
   *
   * @return Array the urls of pdfs that were found.
   */
  this.findEmbedTagURLs = function ( document ) {
    var results = [];
    var elems = document.querySelectorAll( "embed, object, frame, iframe" );
    var count = elems.length;
    for ( var i = 0; i < count; i++ ) {
      var elem = elems[ i ];
      var tagName = elem.tagName.toLowerCase();

      if ( tagName == "embed" || tagName == "object" ) {
        var src_type = elem.getAttribute( "type" );
        var src_relative;

        if ( tagName == "embed" )
          src_relative = elem.getAttribute( "src" );
        else if ( tagName == "object" ) {
          src_relative = elem.getAttribute( "data" );
          if ( src_relative == undefined || src_relative != undefined && src_relative.trim() == "" )
          // maybe we have a src parameter
            src_relative = elem.getAttribute( "src" );
        }

        // avoiding the flash
        if ( src_type != undefined && src_type.match( 'flash' ) ) {
          // handling the case where wrong MIME type was set
          if ( src_relative != undefined && src_relative.match( '.pdf' ) ) {
            var src = this.getAbsoluteURL( src_relative, document );
            results.push( src );
          }
        } else {
          if ( src_relative != undefined && src_relative.trim() != "" ) {
            var src = this.getAbsoluteURL( src_relative, document );
            results.push( src );
          }
        }
      } else if ( tagName == "iframe" || tagName == "frame" ) {
        try {
          var elems2 = this.findEmbedTagURLs( elem.contentDocument );
          results = results.concat( elems2 );
        } catch ( e ) {
          // this happens when unallowed frame traversals are done
          // but we are ok with that as it usually is cross-domain
          // security protection
          Scrive.LogUtils.error( "error while traversing frames", e );
        }
      }
    }
    return results;
  };

  this.errorCallbackFromXMLHttpRequest = function ( url, errorCallback, xmlHttpRequest ) {
    /*
     * This information is actually good only for HTTP level errors,
     * when there is HTTP status code and statusText and maybe even
     * responseText.
     *
     * For any kind of error that is a bit lower level, like
     * net::ERR_CONNECTION_REFUSED we do not have good information at
     * this point.
     *
     * To get that information background page subscribes to
     * chrome.webRequest.onErrorOccurred and there in the callback there
     * is a string field called 'error'. We get notified on this tab
     * with a message of 'xmlhttprequesterror'. That information is
     * stored in global keepErrorInfo variable.
     *
     * And also timing issues: lets wait till all messages come in.
     */
    setTimeout( function () {
      errorCallback( {
        type: 'error',
        url: url,
        headers: xmlHttpRequest.getAllResponseHeaders().split( "\n" ).filter( function ( x ) {
          return x != "";
        } ),
        response: xmlHttpRequest.responseText ? xmlHttpRequest.responseText : keepErrorInfo[ url ],
        status: xmlHttpRequest.status,
        statusText: xmlHttpRequest.statusText
      } );
    }, 200 );
  };

  this.uploadPDFData = function ( data, errorCallback, sameWindow ) {
    Scrive.Platform.LocalStore.get( [
      KEYS.PRINTER_URL,
      KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
      KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET
    ], function ( items ) {
      Scrive.ContentScript.uploadPDFDataWithCredentials( data, errorCallback, sameWindow, items );
    } );
  };

  this.uploadPDFDataWithCredentials = function ( data, errorCallback, sameWindow, items ) {
    var options = new Object();
    var printer_url = items[ KEYS.PRINTER_URL ] || DEFAULTS.PRINTER_URL;
    var clientId = items[ KEYS.OAUTH_CLIENT_ID ] || "";
    var clientSecret = items[ KEYS.OAUTH_CLIENT_SECRET ] || "";
    var tokenId = items[ KEYS.OAUTH_TOKEN_ID ] || "";
    var tokenSecret = items[ KEYS.OAUTH_TOKEN_SECRET ] || "";

    options.onload = function ( rq ) {
      if ( rq.status >= 200 && rq.status <= 299 ) {
        var openBrowser = rq.getResponseHeader( "X-Open-Browser" );
        if ( openBrowser ) {
          if ( sameWindow ) {
            window.location.href = openBrowser;
          } else {
            window.open( openBrowser, '_blank' );
          }
        } else {
          // Is this still needed?
          alert( "Done! Look at your tablet!" );
        }
      } else {
        Scrive.ContentScript.errorCallbackFromXMLHttpRequest( printer_url, errorCallback, this );
      }
    };

    options.onerror = function () {
      Scrive.ContentScript.errorCallbackFromXMLHttpRequest( printer_url, errorCallback, this );
    };

    Scrive.LogUtils.log( "Sending PDF data to: " + printer_url );
    options.method = "PUT";

    if ( clientId + "" != "" && clientSecret + "" != "" && tokenId + "" != "" && tokenSecret + "" != "" ) {
      var oauthComponents = [
        "oauth_signature_method=\"PLAINTEXT\"",
        "oauth_consumer_key=\"" + clientId + "\"",
        "oauth_token=\"" + tokenId + "\"",
        "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""
      ];

      var oauthHeader = "OAuth " + oauthComponents.join( "," );

      options.headers = new Object();
      options.headers[ "Authorization" ] = oauthHeader;
    }
    //We need to pass url for IE extension
    options.url = data.url;
    //data.data is undefined for IE
    if ( data.data ) options.data = data.data;
    else options.data = data;
    Scrive.Platform.HttpRequest.put( printer_url, options );
  };
};
/*
 CryptoJS v3.1.2
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
var CryptoJS = CryptoJS || function ( h, r ) {
  var k = {},
    l = k.lib = {},
    n = function () {},
    f = l.Base = {
      extend: function ( a ) {
        n.prototype = this;
        var b = new n;
        a && b.mixIn( a );
        b.hasOwnProperty( "init" ) || ( b.init = function () {
          b.$super.init.apply( this, arguments )
        } );
        b.init.prototype = b;
        b.$super = this;
        return b
      },
      create: function () {
        var a = this.extend();
        a.init.apply( a, arguments );
        return a
      },
      init: function () {},
      mixIn: function ( a ) {
        for ( var b in a ) a.hasOwnProperty( b ) && ( this[ b ] = a[ b ] );
        a.hasOwnProperty( "toString" ) && ( this.toString = a.toString )
      },
      clone: function () {
        return this.init.prototype.extend( this )
      }
    },
    j = l.WordArray = f.extend( {
      init: function ( a, b ) {
        a = this.words = a || [];
        this.sigBytes = b != r ? b : 4 * a.length
      },
      toString: function ( a ) {
        return ( a || s ).stringify( this )
      },
      concat: function ( a ) {
        var b = this.words,
          d = a.words,
          c = this.sigBytes;
        a = a.sigBytes;
        this.clamp();
        if ( c % 4 )
          for ( var e = 0; e < a; e++ ) b[ c + e >>> 2 ] |= ( d[ e >>> 2 ] >>> 24 - 8 * ( e % 4 ) & 255 ) << 24 - 8 * ( ( c + e ) % 4 );
        else if ( 65535 < d.length )
          for ( e = 0; e < a; e += 4 ) b[ c + e >>> 2 ] = d[ e >>> 2 ];
        else b.push.apply( b, d );
        this.sigBytes += a;
        return this
      },
      clamp: function () {
        var a = this.words,
          b = this.sigBytes;
        a[ b >>> 2 ] &= 4294967295 <<
          32 - 8 * ( b % 4 );
        a.length = h.ceil( b / 4 )
      },
      clone: function () {
        var a = f.clone.call( this );
        a.words = this.words.slice( 0 );
        return a
      },
      random: function ( a ) {
        for ( var b = [], d = 0; d < a; d += 4 ) b.push( 4294967296 * h.random() | 0 );
        return new j.init( b, a )
      }
    } ),
    m = k.enc = {},
    s = m.Hex = {
      stringify: function ( a ) {
        var b = a.words;
        a = a.sigBytes;
        for ( var d = [], c = 0; c < a; c++ ) {
          var e = b[ c >>> 2 ] >>> 24 - 8 * ( c % 4 ) & 255;
          d.push( ( e >>> 4 ).toString( 16 ) );
          d.push( ( e & 15 ).toString( 16 ) )
        }
        return d.join( "" )
      },
      parse: function ( a ) {
        for ( var b = a.length, d = [], c = 0; c < b; c += 2 ) d[ c >>> 3 ] |= parseInt( a.substr( c,
          2 ), 16 ) << 24 - 4 * ( c % 8 );
        return new j.init( d, b / 2 )
      }
    },
    p = m.Latin1 = {
      stringify: function ( a ) {
        var b = a.words;
        a = a.sigBytes;
        for ( var d = [], c = 0; c < a; c++ ) d.push( String.fromCharCode( b[ c >>> 2 ] >>> 24 - 8 * ( c % 4 ) & 255 ) );
        return d.join( "" )
      },
      parse: function ( a ) {
        for ( var b = a.length, d = [], c = 0; c < b; c++ ) d[ c >>> 2 ] |= ( a.charCodeAt( c ) & 255 ) << 24 - 8 * ( c % 4 );
        return new j.init( d, b )
      }
    },
    t = m.Utf8 = {
      stringify: function ( a ) {
        try {
          return decodeURIComponent( escape( p.stringify( a ) ) )
        } catch ( b ) {
          throw Error( "Malformed UTF-8 data" );
        }
      },
      parse: function ( a ) {
        return p.parse( unescape( encodeURIComponent( a ) ) )
      }
    },
    q = l.BufferedBlockAlgorithm = f.extend( {
      reset: function () {
        this._data = new j.init;
        this._nDataBytes = 0
      },
      _append: function ( a ) {
        "string" == typeof a && ( a = t.parse( a ) );
        this._data.concat( a );
        this._nDataBytes += a.sigBytes
      },
      _process: function ( a ) {
        var b = this._data,
          d = b.words,
          c = b.sigBytes,
          e = this.blockSize,
          f = c / ( 4 * e ),
          f = a ? h.ceil( f ) : h.max( ( f | 0 ) - this._minBufferSize, 0 );
        a = f * e;
        c = h.min( 4 * a, c );
        if ( a ) {
          for ( var g = 0; g < a; g += e ) this._doProcessBlock( d, g );
          g = d.splice( 0, a );
          b.sigBytes -= c
        }
        return new j.init( g, c )
      },
      clone: function () {
        var a = f.clone.call( this );
        a._data = this._data.clone();
        return a
      },
      _minBufferSize: 0
    } );
  l.Hasher = q.extend( {
    cfg: f.extend(),
    init: function ( a ) {
      this.cfg = this.cfg.extend( a );
      this.reset()
    },
    reset: function () {
      q.reset.call( this );
      this._doReset()
    },
    update: function ( a ) {
      this._append( a );
      this._process();
      return this
    },
    finalize: function ( a ) {
      a && this._append( a );
      return this._doFinalize()
    },
    blockSize: 16,
    _createHelper: function ( a ) {
      return function ( b, d ) {
        return ( new a.init( d ) ).finalize( b )
      }
    },
    _createHmacHelper: function ( a ) {
      return function ( b, d ) {
        return ( new u.HMAC.init( a,
          d ) ).finalize( b )
      }
    }
  } );
  var u = k.algo = {};
  return k
}( Math );


/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
( function () {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var C_enc = C.enc;

  /**
   * Base64 encoding strategy.
   */
  var Base64 = C_enc.Base64 = {
    /**
     * Converts a word array to a Base64 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The Base64 string.
     *
     * @static
     *
     * @example
     *
     *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
     */
    stringify: function ( wordArray ) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;
      var map = this._map;

      // Clamp excess bits
      wordArray.clamp();

      // Convert
      var base64Chars = [];
      for ( var i = 0; i < sigBytes; i += 3 ) {
        var byte1 = ( words[ i >>> 2 ] >>> ( 24 - ( i % 4 ) * 8 ) ) & 0xff;
        var byte2 = ( words[ ( i + 1 ) >>> 2 ] >>> ( 24 - ( ( i + 1 ) % 4 ) * 8 ) ) & 0xff;
        var byte3 = ( words[ ( i + 2 ) >>> 2 ] >>> ( 24 - ( ( i + 2 ) % 4 ) * 8 ) ) & 0xff;

        var triplet = ( byte1 << 16 ) | ( byte2 << 8 ) | byte3;

        for ( var j = 0;
          ( j < 4 ) && ( i + j * 0.75 < sigBytes ); j++ ) {
          base64Chars.push( map.charAt( ( triplet >>> ( 6 * ( 3 - j ) ) ) & 0x3f ) );
        }
      }

      // Add padding
      var paddingChar = map.charAt( 64 );
      if ( paddingChar ) {
        while ( base64Chars.length % 4 ) {
          base64Chars.push( paddingChar );
        }
      }

      return base64Chars.join( '' );
    },

    /**
     * Converts a Base64 string to a word array.
     *
     * @param {string} base64Str The Base64 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
     */
    parse: function ( base64Str ) {
      // Shortcuts
      var base64StrLength = base64Str.length;
      var map = this._map;

      // Ignore padding
      var paddingChar = map.charAt( 64 );
      if ( paddingChar ) {
        var paddingIndex = base64Str.indexOf( paddingChar );
        if ( paddingIndex != -1 ) {
          base64StrLength = paddingIndex;
        }
      }

      // Convert
      var words = [];
      var nBytes = 0;
      for ( var i = 0; i < base64StrLength; i++ ) {
        if ( i % 4 ) {
          var bits1 = map.indexOf( base64Str.charAt( i - 1 ) ) << ( ( i % 4 ) * 2 );
          var bits2 = map.indexOf( base64Str.charAt( i ) ) >>> ( 6 - ( i % 4 ) * 2 );
          words[ nBytes >>> 2 ] |= ( bits1 | bits2 ) << ( 24 - ( nBytes % 4 ) * 8 );
          nBytes++;
        }
      }

      return WordArray.create( words, nBytes );
    },

    _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  };
}() );
//http://beletsky.net/2014/05/using-mixpanel-analytics-from-chrome-extensions.html
//https://mixpanel.com/help/reference/http#tracking-via-http
Scrive.Mixpanel = new function () {

  var api = 'https://api.mixpanel.com';
  var mixtoken;
  var mixid;

  this.init = function ( token, id ) {
    mixtoken = token;
    mixid = id;
  };

  this.errorCallback = function ( errorData ) {
    console.log( "MixPanel:" +
      "\nUrl: " + errorData.url +
      "\nResponse: " + errorData.response +
      "\nHeaders: " + errorData.headers.join( " " ) +
      "\nStatus: " + errorData.status +
      "\nStatusText: " + errorData.statusText
    );
  };

  this.get = function ( request, errorCallback ) {
    var options = new Object();
    options.onload = function ( rq ) {
      if ( rq.status >= 200 && rq.status <= 299 ) {; //Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
      } else {
        Scrive.ContentScript.errorCallbackFromXMLHttpRequest( request.url, errorCallback, this );
      }
    };
    options.onerror = function () {
      Scrive.ContentScript.errorCallbackFromXMLHttpRequest( request.url, errorCallback, this );
    };

    options.method = request.method;
    options.url = request.url;

    Scrive.Platform.HttpRequest.get( options.url, options );
  };

  this.track = function ( event, content ) {
    var payload = {
      event: event,
      properties: {
        distinct_id: mixid,
        token: mixtoken,
        content: content     //JSON structure is fine for Mixpanel
        //browser: mixpanel.browser.name
      }
    };

    //http://stackoverflow.com/questions/2820249/base64-encoding-and-decoding-in-client-side-javascript
    //var data = window.btoa(JSON.stringify(payload));
    var data = CryptoJS.enc.Base64.stringify( CryptoJS.enc.Utf8.parse( JSON.stringify( payload ) ) );
    var url = api + '/track?data=' + data;

    //make a request
    this.get( {
      method: "GET",
      url: url
    }, this.errorCallback );
  };
};

Scrive.Mixpanel.init( "1d1d5acac1631a77d88144f26c1fb45d" );
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
/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="background.ts" />
/// <reference path="show_error.ts" />

Scrive.Popup = new function () {

//  var modalOptions;
  var modalTitle;
  var modalContent;
  var acceptButton;
  var cancelButton;
  var closeWindowButton;
  var directUploadLink;
  var directUploadButton;
  var dotElements;
  var pdfs = [];
  var spacer;
  var popup;
  var showPopup;

  this.init = function () {

    showPopup = Scrive.Platform.BrowserUtils.showPopup;

    var body = Scrive.Popup.getBody( document );

    spacer = document.createElement( "div" );
    spacer.id = "scrive_spacer";
    //spacer.style.top = getDocHeight(doc) + "px";
    spacer.innerHTML = "\<iframe class='scrive_cover' src='about:blank'></iframe>";
    body.appendChild( spacer );

    popup = document.createElement( "div" );
    popup.id = "scrive_popup";
    spacer.appendChild( popup );
    //Options removed for chrome - add for IE
    //popup.innerHTML = "" + "\<div class='scrive_modal-header scrive_no-icon'\>" + "    \<a class='scrive_modal-options'>" + "       \<div class='scrive_label'></div>" + "   \</a>"
    popup.innerHTML = "" + "\<div class='scrive_modal-header scrive_no-icon'\>" + "       \<div class='scrive_label'></div>" + "   \</a>"

    + "    \<span class='scrive_modal-title'></span>" + "    \<a class='scrive_modal-close'></a>" + "\</div>"
    + "   \<div class='scrive_modal-body'>" + "   \<div class='scrive_modal-content'>" + "       \<div class='scrive_body'></div>"
    + "   \</div>" + "   \</div>"
    + "        \<div class='scrive_modal-footer'>" + "   \<a class='scrive_float-left scrive_cancel scrive_button scrive_button-gray'>" + "       \<div class='scrive_label'></div>"
    + "   \</a>" + "   \<a class='scrive_float-left scrive_direct-upload scrive_button scrive_button-gray'>" + "       \<div class='scrive_label'></div>"
    + "   \</a>" + "   \<a class='scrive_float-right scrive_accept green scrive_button scrive_button-green'>" + "       \<div class='scrive_label'></div>"
    + "   \</a\>" + "\</div\>";


    // Set up the templateable parts of the modal
    //Options removed for chrome - add for IE
    //modalOptions = document.querySelector( '.scrive_modal-options' );
    modalTitle = document.querySelector( '.scrive_modal-title' );
    modalContent = document.querySelector( '.scrive_modal-content .scrive_body' );
    acceptButton = document.querySelector( '.scrive_modal-footer .scrive_accept' );
    cancelButton = document.querySelector( '.scrive_modal-footer .scrive_cancel' );
    directUploadButton = document.querySelector( '.scrive_modal-footer .scrive_direct-upload' );
    closeWindowButton = document.querySelector( '.scrive_modal-header .scrive_modal-close' );

    // Steps:
    // - Ask if there is a PDF
    //   - If false pdf, ask user to print page to paper
    //   - If true pdf, ask if user wants to print to e-sign

    var response = Scrive.ContentScript.findEmbedTagURLs( document );

    if ( response == undefined ) {
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = undefined" );
    } else if ( response.length != 0 ) {
      pdfs = response;
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = " + response.length );
      Scrive.Popup.askPrintToEsign();
    } else {
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = " + response.length );
      /*
       * This is slightly creepy as it will print main frame. Usually
       * data is presented as an IFRAME or FRAME in a FRAMESET, but
       * from this point we cannot really know which of the subframes
       * contains useful data.
       *
       * Just hope that people will do this once and then learn not to
       * touch this again.
       */
      Scrive.Popup.askPrintToPaper();
    }

    var onDirectUpload = function () {
      window.open( Scrive.jsBase + "/html/direct_upload.html", '_blank' );
    };

    directUploadButton.addEventListener( 'click', onDirectUpload );

    var onOptions = function () {
      window.location.href = Scrive.jsBase + "/html/options.html";
    };

    //Options removed for chrome - add for IE
    //modalOptions.addEventListener( 'click', onOptions );

    Scrive.Popup.toggleDiv();
  };

  this.getHead = function ( doc ) {
    var head = null;
    if ( doc && doc.documentElement && doc.documentElement.childNodes ) {
      var childNodes = doc.documentElement.childNodes;
      for ( var i = 0; i < childNodes.length; i++ ) {
        if ( childNodes[ i ].nodeName.toLowerCase() == "head" ) {
          head = childNodes[ i ];
          break;
        }
      }
      if ( !head ) {
        head = childNodes[ 0 ];
      }
    }
    return head;
  };

  this.getBody = function ( doc ) {
    var elements = doc.getElementsByTagName( "body" );
    var body = elements.length > 0 ? elements[ 0 ] : null;
    if ( body == null ) {
      var head = this.getHead( doc );
      body = head.nextSibling;
    }
    return body;
  };

  this.toggleElem = function ( div ) {
    if ( showPopup ) div.style.visibility = 'visible';
    else div.style.visibility = 'hidden';
  };

  this.toggleDiv = function () {
    Scrive.Popup.toggleElem( spacer );
    clearInterval(uploadingPDFInterval);
    Scrive.Popup.clearDots();
    showPopup = !showPopup;
  };

  this.askPrintToEsign = function () {
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "startEsigningQuestion" );
    modalContent.style.display = "none";
    //Options removed for chrome - add for IE
    //modalOptions.innerText = Scrive.Platform.i18n.getMessage( "options" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "no" );
    directUploadButton.style.display = "none";
    var onAccept = function () {
      Scrive.Mixpanel.track( "Print to e-sign accept" );

      /*
       * Here we would actually like to inspect what was saved in the
       * request to weed out anything looking like an EMBED element but
       * not referring to an actual PDF. Candidates are:
       *
       * - type attribute on embed element (but it is sometimes missing)
       * - .pdf as extension of url (but sometimes it is not there)
       * - Content-type: application.pdf (but sometimes it is not)
       *
       * Those should be probably tried only when there is more than one
       * EMBED tag, otherwise just go with what happens to be there.
       */
      var pdfurl = pdfs[ 0 ];

      Scrive.Platform.HttpRequest.PrintToEsign( pdfurl );
      //Do we need ability to send PDF from the same page multiple times without a refresh of browser window ?
      //if we remove listener button is not functional
      acceptButton.removeEventListener( 'click', onAccept );
      Scrive.Popup.uploadingPDF();
    };
    var onCancel = function () {
      Scrive.Popup.toggleDiv();
      Scrive.Mixpanel.track( "Print to e-sign cancel", {}, function () {;
      } );
    };

    acceptButton.addEventListener( 'click', onAccept );
    cancelButton.addEventListener( 'click', onCancel );
    closeWindowButton.addEventListener( 'click', this.toggleDiv );
  };

  this.askPrintToPaper = function () {
    //Options removed for chrome - add for IE
    //modalOptions.innerText = Scrive.Platform.i18n.getMessage( "options" );
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "printToPaperQuestion" );
    modalContent.innerHTML = Scrive.Platform.i18n.getMessage( "noPDFFound" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "print" );
    directUploadButton.innerText = Scrive.Platform.i18n.getMessage( "upload" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "cancel" );
    var onAccept = function () {
      Scrive.Popup.toggleDiv();
      window.print();
      Scrive.Mixpanel.track( "Print to paper accept" );
      acceptButton.removeEventListener( 'click', onAccept );
    };
    var onCancel = function () {
      Scrive.Popup.toggleDiv();
      Scrive.Mixpanel.track( "Print to paper cancel", {}, function () {;
      } );
    };

    acceptButton.addEventListener( 'click', onAccept );
    cancelButton.addEventListener( 'click', onCancel );
    closeWindowButton.addEventListener( 'click', this.toggleDiv );
  };

  var dots = 3;
  this.updateWaitingButtonText = function () {
    var html = Scrive.Platform.i18n.getMessage( "wait" ) + "<span id='scrive_dot-0'>.</span><span id='scrive_dot-1'>.</span><span id='scrive_dot-2'>.</span>";
    acceptButton.innerHTML = html;

    dotElements = acceptButton.querySelectorAll( '[id^=scrive_dot-]' );
    for ( var i = 0; i < dotElements.length; i++ ) {
      dotElements[ i ].style.visibility = 'hidden';

      // Show some of the dots
      if ( i < dots ) {
        dotElements[ i ].style.visibility = 'visible';
      }
    }

    dots++;
    if ( dots == 4 )
      dots = 1;
  };

  this.clearDots = function () {
    acceptButton.className = 'scrive_float-right scrive_accept green scrive_button scrive_button-green';
    cancelButton.style.display = "block";
//    directUploadButton.style.display = "block";

    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );

    dotElements = acceptButton.querySelectorAll( '[id^=scrive_dot-]' );
    for ( var i = 0; i < dotElements.length; i++ ) {
      dotElements[ i ].style.visibility = 'hidden';
    }
  };

  var uploadingPDFInterval;
  this.uploadingPDF = function () {
    acceptButton.className += " is-inactive";
    cancelButton.style.display = "none";
    directUploadButton.style.display = "none";

    this.updateWaitingButtonText();
    uploadingPDFInterval = setInterval( this.updateWaitingButtonText, 1000 );
  };

  this.errorCallback = function ( errorData ) {
    showError( modalContent, errorData );

    clearInterval( uploadingPDFInterval );
    cancelButton.style.display = "none";
    directUploadButton.style.display = "none";
    acceptButton.className = "scrive_button scrive_button-green scrive_float-right";
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "ok" );
    var onAccept = function () {
      acceptButton.removeEventListener( 'click', onAccept );
      window.close();
    };
    acceptButton.addEventListener( 'click', onAccept );
  };
};
//C++ should inject this file ONCE per document, after it injects all the other files
//Scrive.IE.Logger.fbl=true;  // turns-on FireBug console

Scrive.Main.init();