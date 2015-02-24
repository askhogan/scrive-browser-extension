
Scrive.CH.LocalStore = new function () {

  this.put = function ( object, callback ) {
    chrome.storage.sync.set( object, callback );
  };

  this.get = function ( object, callback ) {
    chrome.storage.sync.get( object, callback );
  }
};