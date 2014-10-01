Scrive.IE.HttpRequest = new function() {

    // Options
    // .method - request type, by default it's GET
    // .docType - document type, by default it's text/xml
    // .data - request data, used for POST requests
    // .returnText - return response text instead of XML
    // .headers - additional headers, as type Map
    // .username - for HTTPAuth
    // .password - for HTTPAuth
    this.get = function (url, options) {

//        Scrive.Main.activeXObj.xmlHttpRequest(url,"http://www.kb.nl/sites/default/files/docs/pdf_guidelines.pdf");
////          Scrive.Main.activeXObj.SendPDF("http://www.kb.nl/sites/default/files/docs/pdf_guidelines.pdf");
//        return null;

        try {
            //debugger;
            options = options ? options : new Object();

            options.method = options.method ? options.method : "GET";

            if (options.method == "POST" && options.docType == null) {
                options.docType = "application/x-www-form-urlencoded";
            }

            // In IE we will support additional headers via naming convention starting with 0;
            if (options.headers) {
                var keys = options.headers.getKeys();
                options[ "header_count" ] = keys.length;
                for (var i = 0; i < keys.length; i++) {
                    options[ "header" + i + "_name" ] = keys[i];
                    options[ "header" + i + "_value" ] = options.headers.get(keys[i]);
                }
            }

//            debugger;
//            var xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest(url, options);

            Scrive.LogUtils.debug("options.setRequestHeader.get(\"authorization\"):  " + options.setRequestHeader.get("authorization"));
            var xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest(url, options.setRequestHeader.get("authorization"));
            if (xmlHttpReq) {
                Scrive.LogUtils.debug("HttpRequest: got respond for " + url);
            } else {
                Scrive.LogUtils.debug("HttpRequest: failed for " + url);
                options.onerror(xmlHttpReq);
            }

//            alert(xmlHttpReq);
            var result = null;
            if (xmlHttpReq) {
                if (xmlHttpReq.readyState == 4) {
                    if (xmlHttpReq.status == 200 || xmlHttpReq.status == 201 || xmlHttpReq.status == 202) {
                        result = ( options.returnText ) ? xmlHttpReq.responseText : xmlHttpReq.responseXML;
                    }
                    else {
                        Scrive.LogUtils.error("IEHttpRequest, loading error: " + url + " : Status code " + xmlHttpReq.status + " : " + xmlHttpReq.responseText);
                        options.onerror(xmlHttpReq);
//                        var check = ( options.alias ? options.alias : url );
//                        Scrive.Platform.LocalStore.put( check + ".error", "true" );
                        result = null;
                    }
                }
            }
//            return result;
            return xmlHttpReq;
        } catch (e) {
            Scrive.LogUtils.error("HttpRequest.get: " + url, e);
        }
    }
};