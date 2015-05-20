
// Init Platform - the abstraction around platform specific code.

Scrive.Platform = new function () {

  this.chrome = Scrive.Main.chrome;

  // Call this explicitly to initialize platform specific code.
  this.init = function () {
    try {
      //this.chrome = isChrome();
      if ( !Scrive.Platform.chrome )
        Scrive.Main.activeXObj = new ActiveXObject( "ScriveBHO.ScriveActiveX" );

      Scrive.Platform.Logger = this.chrome ? Scrive.CH.Logger : Scrive.IE.Logger;
      if ( Scrive.Platform.Logger && Scrive.Platform.Logger.init ) Scrive.Platform.Logger.init();

      Scrive.Platform.LocalStore = this.chrome ? Scrive.CH.LocalStore : Scrive.IE.LocalStore;
      if ( Scrive.Platform.LocalStore && Scrive.Platform.LocalStore.init ) Scrive.Platform.LocalStore.init();

      Scrive.Platform.BrowserUtils = this.chrome ? Scrive.CH.BrowserUtils : Scrive.IE.BrowserUtils;
      if ( Scrive.Platform.BrowserUtils && Scrive.Platform.BrowserUtils.init ) Scrive.Platform.BrowserUtils.init();

      Scrive.Platform.HttpRequest = this.chrome ? Scrive.CH.HttpRequest : Scrive.IE.HttpRequest;
      if ( Scrive.Platform.HttpRequest && Scrive.Platform.HttpRequest.init ) Scrive.Platform.HttpRequest.init();

      Scrive.Platform.i18n = this.chrome ? Scrive.CH.i18n : Scrive.IE.i18n;
      if ( Scrive.Platform.i18n && Scrive.Platform.i18n.init ) Scrive.Platform.i18n.init();

    } catch ( e ) {
      Scrive.LogUtils.error( "Scrive.Platform.init" );
    }
  };
};