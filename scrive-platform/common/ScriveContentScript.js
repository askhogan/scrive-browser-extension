/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="show_error.ts" />

/*
* (C) 2014 by Scrive
*
* This script should be injected into a Google Chrome page when
* looking at a PDF.  It will find the single EMBED tag, see if it
* really is a PDF, download its content as bytes (hopefully from
* cache). Then it will forward its contents to Scrive printer
* interface.
*
* TODO:
* - Update the comment above.
* - handle more errors
* - add a spinner for the time of upload
*/
var keepErrorInfo = {};

Scrive.ContentScript = new function () {

    this.init = function(){
        this.setupListeners();
    };

    this.setupListeners = function() {
        //EKI fix this
//        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//            if (request.type == MESSAGES.PDFEXISTSONPAGE) {
//                var pdfs = this.findEmbedTagURLs(document);
//                alert(pdfs);
//                sendResponse(pdfs);
//            }
//
//            if (request.type == MESSAGES.PRINTTOPAPER) {
//                window.print();
//            }
//
//            if (request.type == MESSAGES.PRINTTOESIGN) {
//                // TODO make this more clever
//                sendPDF(request, sendResponse);
//
//                /*
//                * Keep the return response channel open by returning
//                * 'true'.
//                */
//                return true;
//            }
//            if (request.type == MESSAGES.XMLHTTPREQUESTERROR) {
//                keepErrorInfo[request.url] = request.error;
//                return false;
//            }
//        });
    };

    this.getAbsoluteURL = function (url, document) {
        /* Some say that it is better to use IMG here, but experiments
        * show that Chrome tries to load the IMG, which is not a good
        * thing. A tag works ok.
        */
        var a = document.createElement('a');
        a.href = url; // set string url
        url = a.href; // get qualified url, browser magic has happened
        return url;
    };

    // uploadData has the form:
    //
    // For each key contains the list of all values for that key. If the
    // data is of another media type, or if it is malformed, the
    // dictionary is not present. An example value of this dictionary is
    // {'key': ['value1', 'value2']}.
    //
    // Note that this is something else than thing called UploadData
    this.uploadDataToFormData = function(uploadData) {
        var formData = new FormData();
        for (var k in uploadData) {
            for (var i in uploadData[k]) {
                formData.append(k, uploadData[k][i]);
            }
        }
        return formData;
    };

    /**
    * Look through the DOM and search for PDF's
    *
    * @return Array the urls of pdfs that were found.
    */
    this.findEmbedTagURLs = function(document) {
        var results = [];
        var elems = document.querySelectorAll("embed, frame, iframe");
        var count = elems.length;
        for (var i = 0; i < count; i++) {
            var elem = elems[i];
            var tagName = elem.tagName.toLowerCase();

            if (tagName == "embed") {
                var src_relative = elem.getAttribute("src");
                var src = this.getAbsoluteURL(src_relative, document);
                results.push(src);
            } else if (tagName == "iframe" || tagName == "frame") {
                try  {
                    var elems2 = this.findEmbedTagURLs(elem.contentDocument);
                    results = results.concat(elems2);
                } catch (e) {
                    // this happens when unallowed frame traversals are done
                    // but we are ok with that as it usually is cross-domain
                    // security protection
                    Scrive.LogUtils.error("error while traversing frames", e);
                    //Scrive.LogUtils.error("error while traversing frames", e);
                }
            }
        }
        return results;
    };

    /*
    * First get the PDF with a xhr call, then put it to the middleware
    */
    this.sendPDF = function(request, errorCallback) {
        //EKI   we will download PDF and send a request in IE extension
        Scrive.ContentScript.uploadPDFDataWithCredentials(request, errorCallback, false);

        return;

        var getpdfXHR = new XMLHttpRequest();
        getpdfXHR.onload = function () {
            if (getpdfXHR.status >= 200 && getpdfXHR.status <= 299) {
                Scrive.ContentScript.uploadPDFData(getpdfXHR.response, errorCallback, false);
            } else {
                Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
            }
        };
        getpdfXHR.onerror = function () {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
        };
        getpdfXHR.open(request.method, request.url);
        getpdfXHR.responseType = "blob";
        //EKI not sure how to get formData..
        //http://blog.yorkxin.org/posts/2014/02/06/ajax-with-formdata-is-broken-on-ie10-ie11
//        if (request.formData) {
//            getpdfXHR.send(this.uploadDataToFormData(request.formData));
//        } else {
            getpdfXHR.send();
//        }
        /*
        * I'm not sure what is the real difference between 'blob' and
        * 'arraybuffer', they look similar enough to me. 'Blob' has mime
        * type associated with it, ArrayBuffer does not. ArrayBuffer
        * seems deprecated in favor of ArrayBufferView, but
        * ArrayBufferView is not legal here.
        */
    };

    this.errorCallbackFromXMLHttpRequest = function(url, errorCallback, xmlHttpRequest) {
        /*
         * This information is actually good only for HTTP level errors,
         * when there is HTTP status code and statusText and maybe even
         * responseText.
         *
         * For any kind of error that is a bit lower level, like
         * net::ERR_CONNECTION_REFUSED we do not have good information at
         * this point.
         *
         * To get that information background page subscribes to
         * chrome.webRequest.onErrorOccurred and there in the callback there
         * is a string field called 'error'. We get notified on this tab
         * with a message of 'xmlhttprequesterror'. That information is
         * stored in global keepErrorInfo variable.
         *
         * And also timing issues: lets wait till all messages come in.
         */
        setTimeout(function () {
            errorCallback({
                type: 'error',
                url: url,
                headers: xmlHttpRequest.getAllResponseHeaders().split("\n").filter(function (x) {
                    return x != "";
                }),
                response: xmlHttpRequest.responseText ? xmlHttpRequest.responseText : keepErrorInfo[url],
                status: xmlHttpRequest.status,
                statusText: xmlHttpRequest.statusText
            });
        }, 200);
    };

    this.uploadPDFData = function(data, errorCallback, sameWindow) {
        //EKI fix this
//    chrome.storage.sync.get([
//        KEYS.PRINTER_URL,
//        KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
//        KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET], function (items) {
//        var items;
//        this.uploadPDFDataWithCredentials(data, errorCallback, sameWindow, items);
        //EKI Mockup we should split this and move it to platform specific stuff in Scrive.Platform.HttpRequest probably rename this to Scrive.Platform.HttpUtils
        this.uploadPDFDataWithCredentials(data, errorCallback, sameWindow, {});
//    });


    };

    this.uploadPDFDataWithCredentials = function(data, errorCallback, sameWindow, items) {
        var xmlHttpRequestPUT = new XMLHttpRequest();
        //EKI Mockup:
//    var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
//    var clientId = items[KEYS.OAUTH_CLIENT_ID] || "";
//    var clientSecret = items[KEYS.OAUTH_CLIENT_SECRET] || "";
//    var tokenId = items[KEYS.OAUTH_TOKEN_ID] || "";
//    var tokenSecret = items[KEYS.OAUTH_TOKEN_SECRET] || "";

        //  Mockup:
//    var printer_url = "http://vm-dev.scrive.com:12345/printer";
//    var clientId = "51bf4005f676fa35_234";
//    var clientSecret = "f1cbf80661761d67";
//    var tokenId = "8204118504a23537_1526";
//    var tokenSecret = "8db141e00e14ed13";

        var printer_url = Scrive.Platform.LocalStore.get(KEYS.PRINTER_URL);
        var clientId = Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_ID);
        var clientSecret = Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_SECRET);
        var tokenId = Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_ID);
        var tokenSecret = Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_SECRET);

        xmlHttpRequestPUT.onload = function () {
            if (xmlHttpRequestPUT.status >= 200 && xmlHttpRequestPUT.status <= 299) {
                var openBrowser = xmlHttpRequestPUT.getResponseHeader("X-Open-Browser");
                if (openBrowser) {
                    if (sameWindow) {
                        window.location.href = openBrowser;
                    } else {
                        window.open(openBrowser, '_blank');
                    }
                } else {
                    // Is this still needed?
                    alert("Done! Look at your tablet!");
                }
            } else {
                Scrive.ContentScript.errorCallbackFromXMLHttpRequest(printer_url, errorCallback, this);
            }
        };

        xmlHttpRequestPUT.onerror = function (e) {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(printer_url, errorCallback, this);
        };

        Scrive.LogUtils.log("Sending PDF data to: " + printer_url);
        //EKI   we will download PDF and send a request in IE extension
//        xmlHttpRequestPUT.open("PUT", printer_url);

        if (clientId + "" != "" && clientSecret + "" != "" && tokenId + "" != "" && tokenSecret + "" != "") {
            var oauthComponents = [
                "oauth_signature_method=\"PLAINTEXT\"",
                    "oauth_consumer_key=\"" + clientId + "\"",
                    "oauth_token=\"" + tokenId + "\"",
                    "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""];

            var oauthHeader = "OAuth " + oauthComponents.join(",");

            //EKI   we will download PDF and send a request in IE extension
//            xmlHttpRequestPUT.setRequestHeader("Authorization", oauthHeader);
        }

        //EKI   we will download PDF and send a request in IE extension
        //xmlHttpRequestPUT.send(data);

        data.setRequestHeader = new SCR_Map();
        data.setRequestHeader.put("Authorization", oauthHeader);
        xmlHttpRequestPUT = Scrive.Platform.HttpRequest.get(data.url, data);

        if (xmlHttpRequestPUT.status >= 200 && xmlHttpRequestPUT.status <= 299) {
            var openBrowser = xmlHttpRequestPUT.getResponseHeader("X-Open-Browser");
            if (openBrowser) {
                if (sameWindow) {
                    window.location.href = openBrowser;
                } else {
                    window.open(openBrowser, '_blank');
                }
            } else {
                // Is this still needed?
                alert("Done! Look at your tablet!");
            }
        } else {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(printer_url, errorCallback, this);
        }


    }
};

