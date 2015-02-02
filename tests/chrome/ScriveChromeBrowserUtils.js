Scrive.CH.BrowserUtils = new function() {

    //EKI Due to chrome.browserAction.onClicked.addListener in background.js we have to hide popupDiv
    this.showPopup = false;

    this.getExtensionVersion = function( ) {
        return chrome.runtime.getManifest()["version"];
    };
};
