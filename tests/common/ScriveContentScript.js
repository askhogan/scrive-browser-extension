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
    };
//
//    this.setupListeners = function () {
//        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//            if (request.type == MESSAGES.PDFEXISTSONPAGE) {
//                var pdfs = findEmbedTagURLs(document);
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
//                 * Keep the return response channel open by returning
//                 * 'true'.
//                 */
//                return true;
//            }
//            if (request.type == MESSAGES.XMLHTTPREQUESTERROR) {
//                keepErrorInfo[request.url] = request.error;
//                return false;
//            }
//        });
//    };

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
    this.uploadDataToFormData = function (uploadData) {
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
    this.findEmbedTagURLs = function (document) {
        var results = [];
        var elems = document.querySelectorAll("embed, object, frame, iframe");
        var count = elems.length;
        for (var i = 0; i < count; i++) {
            var elem = elems[i];
            var tagName = elem.tagName.toLowerCase();

            if (tagName == "embed") {
                var src_relative = elem.getAttribute("src");
                var src = this.getAbsoluteURL(src_relative, document);
                results.push(src);
            }
            else if (tagName == "object") {
                var src_relative = elem.getAttribute("data");
                var src = this.getAbsoluteURL(src_relative, document);
                results.push(src);
            }
            else if (tagName == "iframe" || tagName == "frame") {
                try {
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

    this.errorCallbackFromXMLHttpRequest = function (url, errorCallback, xmlHttpRequest) {
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

    this.uploadPDFData = function (data, errorCallback, sameWindow) {
//        chrome.storage.sync.get([
//        Scrive.Platform.LocalStore.get([
//            KEYS.PRINTER_URL,
//            KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
//            KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET], function (items) {
//            Scrive.ContentScript.uploadPDFDataWithCredentials(data, errorCallback, sameWindow, items);
//        });
          var items = new Object;
//          items = {
//            "printer_url": "http://vm-dev.scrive.com:12345/printer",
//            "oauth_token_id": "134528d816e0c487_2064",
//            "oauth_token_secret": "a0d4c8099f7664a6",
//            "oauth_client_secret": "f1cbf80661761d67",
//            "oauth_client_id": "51bf4005f676fa35_234"
//          };

      items = {
        "printer_url": "http://vm-dev.scrive.com:12345/printer",
        "oauth_token_id": "e038da4030fd9b93_2112",
        "oauth_token_secret": "e22b69cde89da8c9",
        "oauth_client_secret": "41e9e594dee82cb2",
        "oauth_client_id": "409add1d602bb8c1_863"
      };

      Scrive.ContentScript.uploadPDFDataWithCredentials(data, errorCallback, sameWindow, items);
    };

    this.uploadPDFDataWithCredentials = function (data, errorCallback, sameWindow, items) {
//        var xmlHttpRequestPUT = new XMLHttpRequest();
        var options = new Object();
        var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
        var clientId = items[KEYS.OAUTH_CLIENT_ID] || "";
        var clientSecret = items[KEYS.OAUTH_CLIENT_SECRET] || "";
        var tokenId = items[KEYS.OAUTH_TOKEN_ID] || "";
        var tokenSecret = items[KEYS.OAUTH_TOKEN_SECRET] || "";

        options.onload = function (rq) {
            if (rq.status >= 200 && rq.status <= 299) {
                var openBrowser = rq.getResponseHeader("X-Open-Browser");
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

        options.onerror = function () {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(printer_url, errorCallback, this);
        };

        Scrive.LogUtils.log("Sending PDF data to: " + printer_url);
//        xmlHttpRequestPUT.open("PUT", printer_url);
        options.method = "PUT";

        if (clientId + "" != "" && clientSecret + "" != "" && tokenId + "" != "" && tokenSecret + "" != "") {
            var oauthComponents = [
                "oauth_signature_method=\"PLAINTEXT\"",
                    "oauth_consumer_key=\"" + clientId + "\"",
                    "oauth_token=\"" + tokenId + "\"",
                    "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""];

            var oauthHeader = "OAuth " + oauthComponents.join(",");

            options.headers = new Object();
            options.headers["Authorization"] = oauthHeader;
        }
//        xmlHttpRequestPUT.send(data);
        //EKI need to pass url for IE extension
        options.url = data.url;
        //data.data is undefined for IE
        if (data.data)  options.data = data.data;
        else            options.data = data;
        Scrive.Platform.HttpRequest.put(printer_url,options);
    };
};

