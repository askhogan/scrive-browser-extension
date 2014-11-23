Scrive.CH.BrowserUtils = new function() {

    this.divToggle = false;

    this.getExtensionVersion = function( ) {
        return chrome.runtime.getManifest()["version"];
    };
};
