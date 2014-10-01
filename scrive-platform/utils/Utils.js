// Map
function SCR_Map() {
	this.keys = new Object();
    this.count = 0;
}

SCR_Map.prototype.put = function( key, value ) {
   if ( value == null ) value = key;
   if ( this.keys[ key ] == null ) {
       this.count++;
   }
   this.keys[ key ] = value;
}

SCR_Map.prototype.get = function( key ) {
    var result = this.keys[ key ];
    return ( typeof(result) == 'undefined' || (result == undefined) ) ? null : result;
}

SCR_Map.prototype.contains = function( key ) {
    return ( this.get( key ) != null );
}

SCR_Map.prototype.remove = function( key ) {
    var value = this.keys[ key ];
    if ( value ){
        this.keys[ key ] = null;
        delete( this.keys[ key ] );
        this.count--;
    }
}

SCR_Map.prototype.getKeys = function() {
    var k = new Array();
	var idx = 0;
	for ( var key in this.keys ) {
        // Hack around prototype.js issue
        if ( key != "extend" && key != "toJSONString" ){
            k[ idx++ ] = key;
        }
    }
    return k;
}

SCR_Map.prototype.getValues = function() {
	var v = [];
	var idx = 0;
	for ( var key in this.keys ) {
         // Hack around prototype.js issue
        if ( key != "extend" && key != "toJSONString" ) {
            v[ idx++ ] = this.keys[ key ];
        }
    }
	return v;
}

SCR_Map.prototype.putAll = function( arr, keyFunction ) {
    for ( var i = 0; i < arr.length; i++ ) {
        var key = ( keyFunction != null ) ? keyFunction.call( null, arr[i] ) : arr[ i ];
        this.put( key, arr[i] );
    }    
}

SCR_Map.prototype.putMap = function( map ) {
    var keys = map.getKeys();
    for ( var i = 0; i < keys.length; i++ ) {
        this.put( keys[i], map.get( keys[ i ] ) );
    }
}

SCR_Map.prototype.equals = function( other ){
    var keys = this.getKeys();
    var otherKeys = other.getKeys();
    var equals = ( keys.length == otherKeys.length );
    if ( equals ){
        for ( var i = 0; i < keys.length; i++ ){
            if ( keys[i] != otherKeys[i] || this.get( keys[i] ) != other.get( otherKeys[i] ) ){
                equals = false;
                break;
            }
        }
    }
    return equals;
}

SCR_Map.prototype.toString = function() {
    var str = "";
    for ( var key in this.keys ) {
        str = str + "[" + key + "=" + this.keys[ key ] + "]";
    }
    return str;
}

SCR_Map.prototype.print = function() {
    var str = "";
    for ( var key in this.keys ) {
        str = str + "[" + key + "=" + this.keys[ key ] + "]\n";
    }
    return str;
}

SCR_Map.prototype.getCount = function() {
    return this.count;
}

SCR_Map.prototype.sort = function( comparator ){
    var array = [];
    for ( var key in this.keys ) {
        var obj = new Object();
        obj.key = key;
        obj.value = this.keys[key];
        array.push( obj )
    }
    array.sort( comparator );

    this.keys = new Object();
    for ( var i = 0; i < array.length; i++ ){
        this.put( array[i].key, array[i].value );
    }
}

SCR_Map.prototype.purge = function( max ){
    if ( this.count > max ) {
        var keys = this.getKeys();
        var half = max / 2;
        for ( var i = 0; i < half; i++ ){
            this.remove( keys[i] );
        }
    }
}
