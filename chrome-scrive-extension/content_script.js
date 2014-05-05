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
var pdf = undefined;

setupListeners();

function setupListeners() {
  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.type == 'pdfexistsonpage') {
        pdf = findEmbeddedPdfInDocument(document, request.savedDataForRequests);
        if (pdf) {
          sendResponse(true);
        } else {
          sendResponse(false);
        }
      };

      if (request.type == 'printtopaper') {
        window.print();
      }

      if (request.type == 'savedataforrequest') {
          window.scriveSavedDataForRequest = request.data;
      }

      if (request.type == 'printtoesign') {
        // TODO make this more clever
        sendPDF(pdf, request, sendResponse);
      }
    }
  );
};


function qualifyURL( document, url )
{
    // it actually tries to contact the server when using IMG tag... not good!
/*
    var img = document.createElement('img');
    img.src = url; // set string url
    url = img.src; // get qualified url
    img.src = null; // no server request
*/
    var a = document.createElement('a');
    a.href = url; // set string url
    url = a.href; // get qualified url
    return url;
}

/**
 * Look through the DOM and search for PDF's
 * 
 * @return Array The pdfs that were found.
 */
// TODO handle more than one pdf on the page
function findEmbeddedPdfInDocument(document,savedDataForRequests)
{
  // REFACTOR TO USE querySelector
    var elems = document.getElementsByTagName("*");
    var count = elems.length;
    for( var i = 0; i<count; i++ ) {
        var elem = elems[i];
        var tagName = elem.tagName.toLowerCase();

        if( tagName=="embed" ) {
            var xsrc1 = elem.getAttribute("src")
            var xsrc = qualifyURL(document, xsrc1);
            var data = savedDataForRequests[xsrc];
            if( data ) {
                for( var k in data.responseHeaders ) {
                    var headerLine = data.responseHeaders[k];
                    if( headerLine.name.toLowerCase()=="content-type" &&
                        headerLine.value.search("application/pdf")>=0 ) {
                        return xsrc;
                    }
                }
            }
        }
        else if( tagName=="iframe" || tagName=="frame") {
          try {
            var elem = findEmbeddedPdfInDocument(elem.contentDocument,savedDataForRequests);
            if( elem ) {
                return elem;
            }
          } catch (e) {
            // this happens when unallowed frame traversals are done
            console.log("error while traversing frames", e);
          }
        }
    }
    return;
}

/*
 * First get the PDF with a xhr call, then put it to the middleware
 */
function sendPDF(pdf, request, errorCallback) {

  var src = pdf.getAttribute('src');
  var savedData = request.savedDataForRequests[src];

  var getpdfXHR = new XMLHttpRequest();
  getpdfXHR.onload = function() {
    if (getpdfXHR.status >= 200 && getpdfXHR.status <= 299) {
      uploadPDFData(getpdfXHR.response, errorCallback);
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
  if( savedData && savedData.requestBody && savedData.requestBody.formData ) {
    var formData = new FormData();
    for(var k in savedData.requestBody.formData) {
        formData.append(k, savedData.requestBody.formData[k][0]);
    }
    getpdfXHR.open("POST", src);
    getpdfXHR.responseType = "blob";
    getpdfXHR.send(formData);
  }
  else {
    getpdfXHR.open("GET", src);
    getpdfXHR.responseType = "blob";
    getpdfXHR.send();
  }
  /*
   * I'm not sure what is the real difference between 'blob' and
   * 'arraybuffer', they look similar enough to me. 'Blob' has
   * mime type associated with it, ArrayBuffer does not.
   */
}


})();

function uploadPDFData(data, errorCallback, sameWindow) {
  var xmlHttpRequestPUT = new XMLHttpRequest();
  xmlHttpRequestPUT.onload = function () {
    if( xmlHttpRequestPUT.status == 200 ) {
      var openBrowser = xmlHttpRequestPUT.getResponseHeader("X-Open-Browser");
      if( openBrowser ) {
        if( sameWindow ) {
          window.location = openBrowser;
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
    errorCallback({
      'type': 'error',
      'headers': xmlHttpRequestPUT.getAllResponseHeaders().split("\n").filter(function(x) { return x!=""; }),
      'status':  xmlHttpRequestPUT.status,
      'statusText': xmlHttpRequestPUT.statusText
    });
  };

  chrome.storage.sync.get([KEYS.PRINTER_URL,
                           KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
                           KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET], function(items) {
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
