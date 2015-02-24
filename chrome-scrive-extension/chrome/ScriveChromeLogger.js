
Scrive.CH.Logger = new function () {

  this.getErrorMessage = function ( e ) {
    return e.message ? e.message : e;
  };

  this.print = function ( msg ) {
    try {
      if ( msg.indexOf( "Scrive message" ) != -1 ) console.info( msg );
      else if ( msg.indexOf( "Scrive error" ) != -1 ) console.error( msg );
      else console.log( msg );
    } catch ( e ) {}
  };
};