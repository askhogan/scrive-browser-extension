Scrive.IE.LocalStore = new function() {


    this.put = function( object, callback ) {
        for(var i in object)
        {
//            this.setValue(i, object[i]);
            this.setValue(i, object[i]);
        }
        if (callback)
            callback.call(null);
    };

    this.get = function( object, callback ) {
//        var resultMap = new SCR_Map();
        var resultMap = new Object();
        for(var i=0; i<object.length;i++)
        {
            resultMap[object[i]] = this.getValue(object[i]);
        }
        if (callback)
            callback.call(null,resultMap);
    };

    this.getValue = function( key ) {
        var val = Scrive.Main.activeXObj.pref( key );
        if ( val == null ){     //just in case we try it again. I suspect there's a bug where it's not here on the first request
            val = Scrive.Main.activeXObj.pref( key );
        }
        return val;
    };

    this.setValue = function( key, val ) {
        var oldVal = Scrive.Main.activeXObj.pref( key );
        if (key && val && ( oldVal != val )){
            Scrive.Main.activeXObj.pref(key)= val;
        }
    }
};