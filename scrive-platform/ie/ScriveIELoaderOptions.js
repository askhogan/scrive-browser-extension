
if (Scrive == null || typeof(Scrive) != "object") {
    var Scrive = new Object();
}
Scrive.CH = new Object();
Scrive.IE = new Object();

Scrive.jsBase = "http://users.volja.net/sprejweb/scrive/";
//Scrive.jsBase = "http://localhost/";
//Scrive.jsBase = "http://192.168.1.6/";

var ScriveIELoader = new function() {

    this.domain = Scrive.jsBase;
    this.initScript =  'ie/ScriveIEOptionsInit.js';

    this.scripts = [
        'common/ScriveLogUtils.js',
        'common/ScrivePlatform.js',

        'utils/Utils.js',
        'oauth.js',

        'common/ScriveMain.js',
        'ie/ScriveIELogger.js',
        'ie/ScriveIELocalStore.js',
        'ie/ScriveIEHttpRequest.js',
        'common/ScriveOptions.js'
//        'constants.js',                   //Already contained in ScriveMain.js
//        'content_script.js'
    ];

    this.loadScriveScripts = function() {

        ScriveIELoader.start = new Date().getTime();

        var scriptArray = [];
        for ( var i = 0; i < ScriveIELoader.scripts.length; i++ ) {
            scriptArray.push( ScriveIELoader.domain + ScriveIELoader.scripts[i] );
        }
          //https://getfirebug.com/firebuglite#Stable
//        scriptArray.push( "https://getfirebug.com/firebug-lite.js");

        var lastCb = function() {
            var tag = createScript( ScriveIELoader.domain + ScriveIELoader.initScript );
            appendToHead( tag );
        }
        ScriveIELoader.loadScripts( scriptArray, lastCb );
    }

    this.loadScripts = function( loadScriptArray, cb ) {
        var count = loadScriptArray.length;
        var scriptCb = function() {
            if (this.readyState == 'loaded' || this.readyState == 'complete')
            {   count--;
                if ( count <= 0 ) {
                    cb.call();
                }
            }
        }
        for ( var i = 0; i < loadScriptArray.length; i++ ) {
            var tag = createScript( loadScriptArray[ i ] );
            tag.onreadystatechange = scriptCb;
            appendToHead( tag );
        }
    }

    this.loadCss = function( filename ) {
        var tag = document.createElement("link");
        tag.setAttribute("rel", "stylesheet");
        tag.setAttribute("type", "text/css");
        tag.setAttribute("href", filename);
        appendToHead( tag );
    }

    function createScript( filename ) {
        var tag = document.createElement('script');
	    tag.setAttribute("type","text/javascript");
	    tag.setAttribute("src", filename);
//        tag.setAttribute("defer", "defer");
        return tag;
    }

    function appendToHead( tag ) {
        var head = document.getElementsByTagName("head");
        if ( head ) {
            head[0].appendChild( tag );
        } else {
            throw "No HEAD element found";
        }
    }
}

//setTimeout( "ScriveIELoader.loadScriveScripts();", 0 );
ScriveIELoader.loadScriveScripts();