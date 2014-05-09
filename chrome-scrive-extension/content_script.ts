/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />

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

(function() {
  setupListeners();

  function setupListeners() {
    chrome.runtime.onMessage.addListener(
      function(request : {type: string;
                          url: string;
                          method: string;
                          formData?: FormData},
               sender, sendResponse) {
        if (request.type == 'pdfexistsonpage') {
          var pdfs = findEmbedTagURLs(document);
          sendResponse(pdfs);
        };

        if (request.type == 'printtopaper') {
          window.print();
        }

        if (request.type == 'printtoesign') {
          // TODO make this more clever
          sendPDF(request, sendResponse);
          /*
           * Keep the return response channel open by returning
           * 'true'.
           */
          return true;
        }
      }
    );
  };


  function getAbsoluteURL( url : string, document : HTMLDocument )
  {
    /* Some say that it is better to use IMG here, but experiments
     * show that Chrome tries to load the IMG, which is not a good
     * thing. A tag works ok.
     */
    var a = document.createElement('a');
    a.href = url; // set string url
    url = a.href; // get qualified url, browser magic has happened
    return url;
  }

  /**
   * Look through the DOM and search for PDF's
   * 
   * @return Array the urls of pdfs that were found.
   */
  function findEmbedTagURLs(document : HTMLDocument) : string[]
  {
    var results = [];
    var elems = document.querySelectorAll("embed, frame, iframe");
    var count = elems.length;
    for( var i=0; i<count; i++ ) {
      var elem = <HTMLElement>elems[i]
      var tagName = elem.tagName.toLowerCase();

      if( tagName=="embed" ) {
        var src_relative = elem.getAttribute("src")
        var src = getAbsoluteURL(src_relative,document);
        results.push(src);
      }
      else if( tagName=="iframe" || tagName=="frame") {
        try {
          var elems2 = findEmbedTagURLs((<HTMLFrameElement>elem).contentDocument);
          results = results.concat(elems2);
        } catch (e) {
          // this happens when unallowed frame traversals are done
          // but we are ok with that as it usually is cross-domain
          // security protection
          console.log("error while traversing frames", e);
        }
      }
    }
    return results;
  }

  /*
   * First get the PDF with a xhr call, then put it to the middleware
   */
  function sendPDF(request : {url: string;
                              method: string;
                              formData?: FormData},
                              errorCallback) {
    var getpdfXHR = new XMLHttpRequest();
    getpdfXHR.onload = function() {
      if (getpdfXHR.status >= 200 && getpdfXHR.status <= 299) {
        uploadPDFData(getpdfXHR.response, errorCallback, false);
      }
    };
    getpdfXHR.onerror = function() {
      errorCallback({
        'type': 'error',
        'headers': getpdfXHR.getAllResponseHeaders().split("\n").filter(function(x) { return x!=""; }),
        'status':  getpdfXHR.status,
        'response': getpdfXHR.response,
        'statusText': getpdfXHR.statusText
      });
    };
    getpdfXHR.open(request.method, request.url );
    getpdfXHR.responseType = "blob";
    getpdfXHR.send(request.formData);
    /*
     * I'm not sure what is the real difference between 'blob' and
     * 'arraybuffer', they look similar enough to me. 'Blob' has mime
     * type associated with it, ArrayBuffer does not. ArrayBuffer
     * seems deprecated in favor of ArrayBufferView, but
     * ArrayBufferView is not legal here.
     */
  }


})();

function uploadPDFData(data, errorCallback, sameWindow) {
  var xmlHttpRequestPUT = new XMLHttpRequest();
  xmlHttpRequestPUT.onload = function () {
    if( xmlHttpRequestPUT.status >= 200 && xmlHttpRequestPUT.status <=299 ) {
      var openBrowser = xmlHttpRequestPUT.getResponseHeader("X-Open-Browser");
      if( openBrowser ) {
        if( sameWindow ) {
          window.location.href = openBrowser;
        }
        else {
          window.open(openBrowser,'_blank');
        }
      }
      else {
        // Is this still needed?
        alert("Done! Look at your tablet!");
      }
    }
    else {
      errorCallback({
        'type': 'error',
        'headers': xmlHttpRequestPUT.getAllResponseHeaders().split("\n").filter(function(x) { return x!=""; }),
        'status':  xmlHttpRequestPUT.status,
        'statusText': xmlHttpRequestPUT.statusText
      });
    }
  }

  xmlHttpRequestPUT.onerror = function() {
    console.log("xmlHttpRequestPUT.onerror");
    errorCallback({
      'type': 'error',
      'headers': xmlHttpRequestPUT.getAllResponseHeaders().split("\n").filter(function(x) { return x!=""; }),
      'status':  xmlHttpRequestPUT.status,
      'statusText': xmlHttpRequestPUT.statusText
    });
  };

  chrome.storage.sync.get([KEYS.PRINTER_URL,
                           KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
                           KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET],
                          function(items) {
                            var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
                            var clientId = items[KEYS.OAUTH_CLIENT_ID] || "";
                            var clientSecret = items[KEYS.OAUTH_CLIENT_SECRET] || "";
                            var tokenId = items[KEYS.OAUTH_TOKEN_ID] || "";
                            var tokenSecret = items[KEYS.OAUTH_TOKEN_SECRET] || "";

                            var oauth_header = "OAuth oauth_signature_method=\"PLAINTEXT\"" +
                                ",oauth_consumer_key=\"" + clientId +
                                "\",oauth_token=\"" + tokenId +
                                "\",oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\"";

                            console.log("Sending PDF data to: " + printer_url);
                            xmlHttpRequestPUT.open("PUT", printer_url);

                            if( clientId + "" != "" &&
                                clientSecret + "" != "" &&
                                tokenId + "" != "" &&
                                tokenSecret + "" != "" ) {

                              xmlHttpRequestPUT.setRequestHeader("Authorization", oauth_header);
                              console.log("Using Authorization: " + oauth_header);
                            }
                            xmlHttpRequestPUT.send(data);
                          });
}
