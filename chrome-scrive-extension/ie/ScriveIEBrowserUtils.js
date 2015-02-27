Scrive.IE.BrowserUtils = new function () {

  //this.showPopup = true;
  //Changed to make IE happy
  this.showPopup = false;

  this.getExtensionVersion = function () {
    return Scrive.Main.activeXObj.version;
  };
};