if ( Scrive == null || typeof ( Scrive ) != "object" ) {
  var Scrive = new Object();
}

//if (!Scrive.CH)
//     Scrive.CH = new Object();
//if (!Scrive.IE)
//     Scrive.IE = new Object();

//Scrive.jsBase = "http://users.volja.net/sprejweb/scrive/";
//Scrive.jsBase = "http://localhost:8383/";
//Scrive.jsBase = "https://rawgit.com/scrive/scrive-browser-extension/Common_platform/scrive-platform/"
//Scrive.jsBase = "https://rawgit.com/scrive/scrive-browser-extension/Chrome_Div/chrome-scrive-extension/"
Scrive.jsBase = "https://cdn.rawgit.com/scrive/scrive-browser-extension/dev-ernes-ie/chrome-scrive-extension/"

var ScriveIELoader = new function () {

  this.domain = Scrive.jsBase;
  this.initScript = 'ie/ScriveIEInit.js';

  this.scripts = [
    'ScriveIEContentScriptAll.js'
  ];

  this.loadScriveScripts = function () {

    ScriveIELoader.start = new Date().getTime();

    //        this.loadCss(Scrive.jsBase+'css/less-compilation.css');

    this.loadCss( Scrive.jsBase + 'css/popup.css' );

    var scriptArray = [];
    for ( var i = 0; i < ScriveIELoader.scripts.length; i++ ) {
      scriptArray.push( ScriveIELoader.domain + ScriveIELoader.scripts[ i ] );
    }
    //https://getfirebug.com/firebuglite#Stable
    //        scriptArray.push( "https://getfirebug.com/firebug-lite.js");

    var lastCb = function () {
      ;
      //Scrive.Main.init();
      //            var tag = createScript( ScriveIELoader.domain + ScriveIELoader.initScript );
      //            appendToHead( tag );
    }
    ScriveIELoader.loadScripts( scriptArray, lastCb );
  }

  this.loadScripts = function ( loadScriptArray, cb ) {
    var count = loadScriptArray.length;
    var scriptCb = function () {
      //            in IE11 readyState is no longer supported
      //            http://msdn.microsoft.com/en-us/library/ie/ms534359(v=vs.85).aspx
      //            http://blog.getify.com/ie11-please-bring-real-script-preloading-back/
      //            if (this.readyState == 'loaded' || this.readyState == 'complete')
      {
        count--;
        if ( count <= 0 ) {
          cb.call();
        }
      }
    };
    for ( var i = 0; i < loadScriptArray.length; i++ ) {
      var tag = createScript( loadScriptArray[ i ] );
      //https://groups.google.com/forum/#!topic/jsclass-users/x4W3zVYnMFU
      //            in IE11 readyState is no longer supported
      //            http://msdn.microsoft.com/en-us/library/ie/ms534359(v=vs.85).aspx
      //            http://blog.getify.com/ie11-please-bring-real-script-preloading-back/
      //            tag.onreadystatechange = scriptCb;
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
    //        tag.setAttribute("defer", "defer");
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

setTimeout( "ScriveIELoader.loadScriveScripts();", 1000 );
//ScriveIELoader.loadScriveScripts();