
Scrive.LogUtils = new function () {

  this.debugOn = false;
  this.profileOn = false;
  this.infoOn = false;

  this.message = function ( msg ) {
    doPrint( "message", msg );
  };

  this.log = function ( msg ) {
    doPrint( "message", msg );
  };

  this.info = function ( msg ) {
    if ( Scrive.LogUtils.infoOn ) {
      doPrint( "info", msg );
    }
  };

  this.error = function ( s, e ) {
    var msg = ( e != null ) ? s + " " + Scrive.Platform.Logger.getErrorMessage( e ) : s;
    doPrint( "error", msg );
  };

  this.debug = function ( s ) {
    if ( Scrive.LogUtils.debugOn ) {
      doPrint( "debug", s );
    }
  };

  this.start = function ( s ) {
    if ( Scrive.LogUtils.profileOn ) {
      Scrive.LogUtils[ s ] = new Date();
      doPrint( "start", s );
    }
  };

  this.end = function ( s ) {
    if ( Scrive.LogUtils.profileOn ) {
      var start = Scrive.LogUtils[ s ];
      var end = new Date();
      try {
        Scrive.LogUtils.message( "end: " + s + ", took " + ( end.getTime() - start.getTime() ) );
        delete( Scrive.LogUtils[ s ] );
      } catch ( e ) {
        Scrive.LogUtils.error( "start for " + s + " is not defined" );
      }
    }
  };

  function doPrint( prefix, msg ) {
    Scrive.Platform.Logger.print( "[Scrive " + prefix + ": " + getTimestamp() + " " + msg + "]" );
  }

  function getTimestamp() {
    var currentTime = new Date();
    var minutes = currentTime.getMinutes();
    return ( currentTime.getMonth() + 1 ) + "/" + currentTime.getDate() + "/" + currentTime.getFullYear() + " " +
      currentTime.getHours() + ":" + ( minutes < 10 ? "0" + minutes : minutes ) + ":" + currentTime.getSeconds() + ":" + currentTime.getMilliseconds();
  }
};