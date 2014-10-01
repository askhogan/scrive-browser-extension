Scrive.IE.LocalStore = new function() {

    //Per session variables
    this.put = function( key, val ) {
        var oldVal = Scrive.IE.LocalStore.get( key );
        if ( oldVal != val ){
            Scrive.Main.activeXObj.pref(key)= val;
        }
    }

    this.get = function( key ) {
        var val = Scrive.Main.activeXObj.pref( key );
        if ( val == null ){     //just in case we try it again. I suspect there's a bug where it's not here on the first request
            val = Scrive.Main.activeXObj.pref( key );
        }
        return val;
    }
}