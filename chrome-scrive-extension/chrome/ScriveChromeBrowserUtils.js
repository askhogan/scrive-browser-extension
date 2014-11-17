Scrive.CH.BrowserUtils = new function() {

    this.getExtensionVersion = function( ) {
        return chrome.runtime.getManifest()["version"];
    };
};
