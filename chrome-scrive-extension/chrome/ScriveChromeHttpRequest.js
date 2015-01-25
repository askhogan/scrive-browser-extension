Scrive.CH.HttpRequest = new function() {

    var sendMessage = function (message, responseCallback) {
        chrome.runtime.sendMessage( message, responseCallback);
    };

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

            var xmlHttpReq = new XMLHttpRequest();
            xmlHttpReq.open(options.method, url);

            if (options.responseType)    xmlHttpReq.responseType = options.responseType;
            if (options.docType)    xmlHttpReq.docType = options.docType;

            if (options.headers) {
                for ( var key in options.headers ) {
                    if (options.headers.hasOwnProperty(key)) {
                        xmlHttpReq.setRequestHeader(key, options.headers[key]);
                        Scrive.LogUtils.log("header: " + key + " value:" + options.headers[key]);
                    }
                }
            }

            xmlHttpReq.onerror = options.onerror;

            xmlHttpReq.onload = function () {
                    if (options.onload)
                        options.onload(xmlHttpReq);
            };

            if (options.data)   xmlHttpReq.send(options.data);
            else                xmlHttpReq.send();

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
        this.get(url, options);
    };

    this.PrintToEsign = function ( pdfurl) {

        sendMessage({
                type: 'savedDataForRequest',
                url: pdfurl
            },
            function (response) {
                Scrive.LogUtils.log(response.savedData);

//                Scrive.ContentScript.sendPDF({
                Scrive.Platform.HttpRequest.sendPDF({
                    type: 'printtoesign',
                    method: response.savedData ? response.savedData.method : "GET",
                    formData: response.savedData ? response.savedData.formData : null,
                    url: pdfurl
                }, Scrive.Popup.errorCallback);
            }
        );
    };

    /*
     * First get the PDF with a xhr call, then put it to the middleware
     */
    this.sendPDF = function (request, errorCallback) {
        var getpdfXHR = new XMLHttpRequest();
        getpdfXHR.onload = function () {
            /*
             * status 0 is for local files shown directly in browser
             * status 200..299 is for HTTP(S) traffic
             *
             * Note that this works only for files directly visible in
             * chrome, PDFs embedded in local HTML will not work due to
             * Chrome having bugs and missing implementations in local
             * security domain.
             */
            if (getpdfXHR.status == 0 || (getpdfXHR.status >= 200 && getpdfXHR.status <= 299)) {
                //EKI need to pass url for IE extension
//                Scrive.ContentScript.uploadPDFData(getpdfXHR.response, errorCallback, false);
                request.data = getpdfXHR.response;
                Scrive.ContentScript.uploadPDFData(request, errorCallback, false);
            } else {
                Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
            }
        };
        getpdfXHR.onerror = function () {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
        };
        getpdfXHR.open(request.method, request.url);
        getpdfXHR.responseType = "blob";
        if (request.formData) {
            getpdfXHR.send(uploadDataToFormData(request.formData));
        } else {
            getpdfXHR.send();
        }
        /*
         * I'm not sure what is the real difference between 'blob' and
         * 'arraybuffer', they look similar enough to me. 'Blob' has mime
         * type associated with it, ArrayBuffer does not. ArrayBuffer
         * seems deprecated in favor of ArrayBufferView, but
         * ArrayBufferView is not legal here.
         */
    };
};