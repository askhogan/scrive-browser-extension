/*
 * OAuth module.
 *
 * (C) 2014 Scrive
 *
 * OAuth 1.0 autorization module. Supports only PLAINTEXT method.
 *
 * This module exports a global object OAuth with two methods:
 *
 * OAuth.authorize(params): Starts asynchronous OAuth authorization
 * process. If successful it will redirect to server authorization
 * page.
 *
 * OAuth.handleCallback(params): Should be called in window.onload (or
 * equivalent) on page that is a OAuth callback destination.
 *
 * Params object used in both calls has the following fields:
 *
 * - params.initiate_endpoint: URL where to initiate OAuth handshake
 *
 * - params.token_endpoint: URL where to get OAuth token
 *
 * - params.authorize_endpoint: URL where to authorize OAuth requests
 *
 * - params.client_id: Consumer Key also known as Client ID
 *
 * - params.client_secret: Consumer/client shared-secret
 *
 * - params.privileges: Privileges requested by client (separated by
 *   '+' sign)
 *
 * - params.callback: URL to a callback page where server will
 *   redirect after successful OAuth handshake. This defaults to
 *   current page.
 *
 * - params.onload: this callback function will be called with a
 *   single argument, an object with keys 'oauth_token' and
 *   'oauth_token_secret'. The callback function should save those
 *   token credentials in a persistent store and redirect to a
 *   destination page. Note that this callback is not called when
 *   invoked OAuth.authorize because this method ends with a redirect.
 *
 * - params.onerror: This callback will be called with a single
 *   argument XMLHttpRequest where error conditions may be
 *   inspected. If not provided it will put some information to
 *   console.log.
 *
 */
declare module OAuth {
    interface Params {
      endpoint?: string;
      privileges?: string;
      onerror?: any; //??
      onload?: any;
      client_id?: string;
      client_secret?: string;
      token_endpoint?: string;
      initiate_endpoint?: string;
    }
}

var OAuth = ((function() {

    function getCookie(name : string) : string
    {
        var cookies = document.cookie.split(';');
        for(var i in cookies) {
            var parts = cookies[i].split('=');
            if( parts[0]==name ) {
                parts.shift();
                return parts.join("=");
            }
        }
        // return undefined
    };

    function setCookie(name : string,value : string):void
    {
        document.cookie = name + '=' + value;
    };

    function deleteCookie(name:string):void
    {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };


    function parameterEncode(value:string):string
    {
        var hex = "0123456789ABCDEF";
        var result = "";
        var count = value.length;
        for( var i=0; i<count; i++ ) {
            var c = value.charAt(i);
            /*
             * Unreserved characters MUST NOT be encoded. Everything else
             * MUST BE encoded. Hex digits MUST be uppercase. Encoding
             * MUST be UTF8.
             */
            if( c >= "a" && c <= "z" ||
                c >= "A" && c <= "Z" ||
                c >= "0" && c <= "9" ||
                c == "-" ||
                c == "." ||
                c == "_" ||
                c == "~" ) {
                result = result + c;
            }
            else {
                // note: we should support UTF-8 here
                var cc = c.charCodeAt(0);
                result = result + "%" + hex[(cc/16)&15] + hex[cc&15];
            }
        }
        return result;
    };

    function authorizationHeader(fields : Object) : string
    {
        var result = [];
        /*
         * Order of these fields is important.
         */
        var names = ["oauth_consumer_key",
                     "oauth_token",
                     "oauth_signature_method",
                     "oauth_timestamp",
                     "oauth_nonce",
                     "oauth_callback",
                     "oauth_verifier",
                     "oauth_version",
                     "oauth_signature"];
        for( var keyindex in names ) {
            var key = names[keyindex];
            if( fields.hasOwnProperty(key)) {
                if( key!="oauth_signature" ) {
                    result.push(key + "=\"" + parameterEncode(fields[key]) + "\"");
                }
                else {
                    // self compatibility mode: do not encode &
                    result.push(key + "=\"" + fields[key] + "\"");
                }
            }
        }
        return "OAuth " + result.join(",");
    };

    function decodeQueryString(query : string) : { [x:string]:string }
    {
        var pairs = query.split('&');
        var result : { [x:string]:string } = {};
        var len = pairs.length;
        var tmp, key, value;

        for(var i=0; i<len; i++ ) {
            tmp = pairs[i].split('=');
            if( tmp!="" ) {
                key = decodeURIComponent(tmp.shift());
                // allow only first item through
                if( !result.hasOwnProperty(key)) {
                    value = decodeURIComponent(tmp.join("="));
                    result[key] = value;
                }
            }
        }
        return result;
    };

    /*
     * This is a fallback method when onerror was not given.
     */
    function oauthOnError(rq : XMLHttpRequest) : void
    {
        if( console!=undefined && console.log!=undefined ) {
            console.log("OAuth communication error: " + rq.status + " " + rq.statusText);
            console.log("OAuth URL: " + rq.status + " " + rq.statusText);
            console.log("" + rq.getAllResponseHeaders());
            console.log("Response type: " + rq.responseType);
            console.log(rq.responseText);
        }
    };

    function requestToken(params : OAuth.Params) : void
    {
        var rq = new XMLHttpRequest();

        var endpoint = params.endpoint;

        if( params.privileges ) {
            endpoint = endpoint + "?privileges=" + encodeURIComponent(params.privileges)
        }
        rq.open("GET", endpoint);

        rq.responseType = 'x-www-form-urlencoded';
        rq.onerror = params.onerror || oauthOnError;
        rq.onload = function() {
            if( (rq.status>=200 && rq.status<=299) || rq.status<100 ) {
                params.onload(decodeQueryString(rq.responseText));
            }
            else {
                (params.onerror || oauthOnError)(rq);
            }
        };
        rq.setRequestHeader("authorization", authorizationHeader(params));

        rq.send();
    };

    /*
     * This function executes first half of OAuth handshake. First asks
     * for temporary credentials, then redirects to confirm user
     * acceptance of privileges. This functionreturns but in the
     * background eventually it should redirect to authorize_endpoint.
     */
    function authorize(params)
    {
        requestToken({
            "oauth_consumer_key": params.client_id,
            "oauth_signature": params.client_secret + "&0",
            "oauth_signature_method": "PLAINTEXT",
            "oauth_callback":  params.callback || (window.location + "").split("?").shift(),
            "privileges": params.privileges,
            "endpoint": params.initiate_endpoint,
            "onerror": params.onerror,
            "onload": function(tempcred) {
                //oauth_token, oauth_token_secret, oauth_callback_confirmed
                if( tempcred.oauth_token ) {
                    setCookie("oauth_temporary_token_secret",tempcred.oauth_token_secret);
                    if( /\?/.test(params.authorize_endpoint)) {
                        window.location.href = params.authorize_endpoint + "&oauth_token=" + encodeURIComponent(tempcred.oauth_token);
                    }
                    else {
                        window.location.href = params.authorize_endpoint + "?oauth_token=" + encodeURIComponent(tempcred.oauth_token);
                    }
                }
            }
        });
    };

    /*
     * All in one magic. Naviating to this page triggers an OAuth
     * handshake.  This page serves also the double purpose of receving
     * incoming handshake confirmation.  Then it puts data in local
     * storage and navigates back.
     */
    function handleCallback(params : OAuth.Params)
    {
        /* Drop '?' from the front of search string */
        var query: { oauth_token?: string; oauth_verifier?: string; } =
             decodeQueryString(window.location.search.substring(1));

        /* If coming back from redirection query should contain
         * 'oauth_token' and 'oauth_verifier'.
         */
        if( query.hasOwnProperty("oauth_token") &&
            query.hasOwnProperty("oauth_verifier")) {
            var oauth_temporary_token_secret = getCookie("oauth_temporary_token_secret");
            deleteCookie("oauth_temporary_token_secret");
            requestToken({
                "oauth_consumer_key": params.client_id,
                "oauth_token": query.oauth_token,
                "oauth_signature_method": "PLAINTEXT",
                "oauth_verifier": query.oauth_verifier,
                "oauth_signature": params.client_secret + "&" + oauth_temporary_token_secret,
                "endpoint": params.token_endpoint,
                "onerror": params.onerror,
                "onload": params.onload
            });
        }
    };

    return { "authorize": authorize,
             "handleCallback": handleCallback };
})());
