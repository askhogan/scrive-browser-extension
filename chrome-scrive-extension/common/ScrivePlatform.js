// Defines Scrive, Scrive.IE, Scrive.Chrome namespaces and Platform - the abstraction around platform specific code.

function $scr(doc, id) {
    return doc.getElementById(id);
}

Scrive.Platform = new function() {

    // Call this explicitly to initialize platform specific code.
    this.init = function() {
        try {
            var chrome = isChrome();

            Scrive.Platform.LocalStore = chrome ? Scrive.CH.LocalStore : Scrive.IE.LocalStore;
            if ( Scrive.Platform.LocalStore.init ) Scrive.Platform.LocalStore.init();

            Scrive.Platform.Logger = chrome ? Scrive.CH.Logger : Scrive.IE.Logger;
            if ( Scrive.Platform.Logger.init ) Scrive.Platform.Logger.init();

            Scrive.Platform.BrowserUtils = chrome ? Scrive.CH.BrowserUtils : Scrive.IE.BrowserUtils;
            if ( Scrive.Platform.BrowserUtils.init ) Scrive.Platform.BrowserUtils.init();

//            Scrive.Platform.HttpRequest = chrome ? Scrive.Chrome.HttpRequest : Scrive.IE.HttpRequest;
//            if ( Scrive.Platform.HttpRequest.init ) Scrive.Platform.HttpRequest.init();

        } catch ( e ) {
            Scrive.LogUtils.error( "Scrive.Platform.init" );
        }
    };

    function isChrome() {
        return navigator.userAgent.toLowerCase().indexOf('chrome') != -1;
    }

};



