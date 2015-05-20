
Scrive.CH.BrowserUtils = new function () {

  var sendMessage = function ( message, responseCallback ) {
    chrome.runtime.sendMessage( message, responseCallback );
  };

  //Due to chrome.browserAction.onClicked.addListener in background.js we have to hide popupDiv
  this.showPopup = false;

  this.getExtensionVersion = function () {
    return chrome.runtime.getManifest()[ "version" ];
  };

  this.alert = function ( message, responseCallback ) {
    sendMessage( {
      type: 'alertPage',
      message: message
    }, responseCallback );
  };
};