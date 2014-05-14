/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="show_error.ts" />

declare var mixpanel;

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

var keepErrorInfo : { [x :string]: string } = {};

(function() {
  setupListeners();


  function setupListeners() {
    chrome.runtime.onMessage.addListener(
      function(request : {type: string;
                          url: string;
                          method: string;
                          formData?: FormData;
                          error?: string},
               sender, sendResponse) : boolean {

        if (request.type == 'pdfexistsonpage') {
          var pdfs = findEmbedTagURLs(document);
          sendResponse(pdfs);
        }

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
        if (request.type == 'xmlhttprequesterror') {
          keepErrorInfo[request.url] = request.error;
          return false;
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
      else {
        errorCallbackFromXMLHttpRequest(request.url,errorCallback,this);
      }
    };
    getpdfXHR.onerror = function() {
      errorCallbackFromXMLHttpRequest(request.url,errorCallback,this);
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

function errorCallbackFromXMLHttpRequest(url: string, errorCallback: (x:ErrorData) => void, xmlHttpRequest : XMLHttpRequest) : void
{
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
  setTimeout(function() {
    errorCallback({
      type: 'error',
      url: url,
      headers: xmlHttpRequest.getAllResponseHeaders().split("\n").filter(function(x) { return x!=""; }),
      response: xmlHttpRequest.responseText ? xmlHttpRequest.responseText : keepErrorInfo[url],
      status:  xmlHttpRequest.status,
      statusText: xmlHttpRequest.statusText
    })},200);
}

function uploadPDFData(data, errorCallback: (x:ErrorData) => void, sameWindow:boolean):void
{
  chrome.storage.sync.get([KEYS.PRINTER_URL,
                           KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
                           KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET],
                          function(items) {
                            uploadPDFDataWithCredentials(data,errorCallback, sameWindow, items);
                          });
}

function uploadPDFDataWithCredentials(data,
                                      errorCallback: (x:ErrorData) => void,
                                      sameWindow:boolean,
                                      items):void
{
  var xmlHttpRequestPUT = new XMLHttpRequest();
  var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
  var clientId = items[KEYS.OAUTH_CLIENT_ID] || "";
  var clientSecret = items[KEYS.OAUTH_CLIENT_SECRET] || "";
  var tokenId = items[KEYS.OAUTH_TOKEN_ID] || "";
  var tokenSecret = items[KEYS.OAUTH_TOKEN_SECRET] || "";

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
      errorCallbackFromXMLHttpRequest(printer_url,errorCallback,this);
    }
  }

  xmlHttpRequestPUT.onerror = function() {
    errorCallbackFromXMLHttpRequest(printer_url,errorCallback,this);
  };

  console.log("Sending PDF data to: " + printer_url);
  xmlHttpRequestPUT.open("PUT", printer_url);

  if( clientId + "" != "" &&
      clientSecret + "" != "" &&
      tokenId + "" != "" &&
      tokenSecret + "" != "" ) {

    var oauthComponents = [ "oauth_signature_method=\"PLAINTEXT\"",
                            "oauth_consumer_key=\"" + clientId + "\"",
                            "oauth_token=\"" + tokenId + "\"",
                            "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""];

    var oauthHeader = "OAuth " + oauthComponents.join(",");

    xmlHttpRequestPUT.setRequestHeader("Authorization", oauthHeader);
  }
  xmlHttpRequestPUT.send(data);
}
