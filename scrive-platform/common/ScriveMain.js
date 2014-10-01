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
        Scrive.LogUtils.start("Scrive.Main.init Total time")
        Scrive.LogUtils.debug("Scrive.Main.init stub" );
    }
}