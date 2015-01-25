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
        try {
            options = options ? options : new Object();

            options.method = options.method ? options.method : "GET";
//            options.docType = options.docType ? options.docType : "text/xml";
//            options.data = options.data ? options.data : "";

            if (options.method == "POST" && options.docType == null) {
                options.docType = "application/x-www-form-urlencoded";
            }

            //EKI we skip this for now..
//            if (options.headers) {
//                var i=0;
//                for ( var key in options.headers ) {
//                    if (options.headers.hasOwnProperty(key)) {
//                        // This is the way we will pass headers to IE
//                        options[ "header" + i + "_name" ] = key;
//                        options[ "header" + i + "_value" ] = options.headers[key];
////                        xmlHttpReq.setRequestHeader(key, options.headers[key]);
//                        Scrive.LogUtils.log("header: " + key + " value:" + options.headers[key]);
//                    }
//                    i++;
//                }
//            }
//
//            if (options.headers.hasOwnProperty("Authorization")) {
//                Scrive.LogUtils.debug("options.setRequestHeader.get(\"Authorization\"):  " + options.headers["Authorization"]);
//            }

            var xmlHttpReq = null;

            //EKI until I add handling of headers to IE addon we have to do it like this.
            if (options.hasOwnProperty("headers") && options.headers.hasOwnProperty("Authorization"))
                xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest(url, options.method, options.headers["Authorization"]);
            else
                xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest(url, options.method, "");

            if (xmlHttpReq) {
                Scrive.LogUtils.debug("HttpRequest: got respond for " + url);
                if (options.onload)
                    options.onload(xmlHttpReq);
            } else {
                Scrive.LogUtils.debug("HttpRequest: failed for " + url);
                options.onerror(xmlHttpReq);
            }

        } catch (e) {
            Scrive.LogUtils.error("HttpRequest.get: " + url, e);
        }
    };

        // Options
        // .method - request type, by default it's GET
        // .docType - document type, by default it's text/xml
        // .data - request data, used for POST requests
        // .returnText - return response text instead of XML
        // .headers - additional headers, as type Map
        // .username - for HTTPAuth
        // .password - for HTTPAuth
    this.put = function (url, options) {
        //EKI put is currently only for Scrive.ContentScript.uploadPDFDataWithCredentials!!!
        //IE addon has printer_url hardcoded in - this must be changed
        this.get(options.url, options);
    };

    //EKI   we will download PDF and send a request in IE extension
    this.PrintToEsign = function ( pdfurl) {

        var savedData = new Object();
        savedData.url=pdfurl;
        savedData.method="PUT";
        this.sendPDF(savedData, Scrive.Popup.errorCallback);

    };

    /*
     * First get the PDF with a xhr call, then put it to the middleware
     */
    this.sendPDF = function(request, errorCallback) {
        //EKI   we will download PDF and send a request in IE extension
//        Scrive.ContentScript.uploadPDFDataWithCredentials(request, errorCallback, false);
        //EKI2 Scrive.LocalStore

        //EKI maybe we will have add this also for IE!
//        Author: Gracjan Polak
//        Date: 27.10.2014 9:36:42
//        Message: Add support for local files

        Scrive.ContentScript.uploadPDFData(request, errorCallback, false);

    };

};