// Defines Scrive, Scrive.IE, Scrive.CH namespaces
if (Scrive == null || typeof(Scrive) != "object") {
    var Scrive = new Object();
}

Scrive.CH = new Object();
Scrive.IE = new Object();

//from constants.js
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

Scrive.Main = new function() {

    this.init = function() {
        try {
            Scrive.LogUtils.debugOn = true;
            Scrive.LogUtils.profileOn = false;
            Scrive.LogUtils.infoOn = true;

            mainStart = new Date().getTime();

            //Initialize platform specific stuff
            Scrive.Platform.init();
            Scrive.ContentScript.init();
            Scrive.Popup.init();

            Scrive.LogUtils.info( "Scrive.Main.init Total time " + ( new Date().getTime() - mainStart ) + "ms" );

        } catch ( e ) {
            alert( "While initializing Scrive: " + e.message );
        }
    };
};