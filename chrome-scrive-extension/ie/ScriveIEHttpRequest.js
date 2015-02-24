Scrive.IE.HttpRequest = new function () {

  // Options
  // .method - request type, by default it's GET
  // .docType - document type
  // .data - request data, used for POST requests
  // .returnText - return response text instead of XML
  // .headers - additional headers, as type Map
  this.get = function ( url, options ) {
    try {
      options = options ? options : new Object();

      options.method = options.method ? options.method : "GET";
      //options.docType = options.docType ? options.docType : "text/xml";
      //options.data = options.data ? options.data : "";

      if ( options.method == "POST" && options.docType == null ) {
        options.docType = "application/x-www-form-urlencoded";
      }

      //we skip this for now..
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

      //until I add handling of headers to IE addon we have to do it like this.
      if ( options.hasOwnProperty( "headers" ) && options.headers.hasOwnProperty( "Authorization" ) )
        xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest( url, options.method, options.headers[ "Authorization" ] );
      else
        //note: it has to be space " " addon can crash otherwise - fix this!
        xmlHttpReq = Scrive.Main.activeXObj.xmlHttpRequest( url, options.method, " " );

      if ( xmlHttpReq ) {
        Scrive.LogUtils.debug( "HttpRequest: got respond for " + url );
        if ( options.onload )
          options.onload( xmlHttpReq );
      } else {
        Scrive.LogUtils.debug( "HttpRequest: failed for " + url );
        options.onerror( xmlHttpReq );
      }

    } catch ( e ) {
      Scrive.LogUtils.error( "HttpRequest.get: " + url, e );
    }
  };

  this.put = function ( url, options ) {
    //this is used only by Scrive.ContentScript.uploadPDFDataWithCredentials
    //note:IE extension has printer_url hardcoded in - change this!
    this.get( options.url, options );
  };

  //PDF is downloaded by IE extension
  this.PrintToEsign = function ( pdfurl ) {

    var savedData = new Object();
    savedData.url = pdfurl;
    savedData.method = "PUT";
    this.sendPDF( savedData, Scrive.Popup.errorCallback );

  };

  /*
   * First get the PDF with a xhr call, then put it to the middleware
   */
  this.sendPDF = function ( request, errorCallback ) {
    //PDF is downloaded by IE extension

    //add this also for IE
    //        Author: Gracjan Polak
    //        Date: 27.10.2014 9:36:42
    //        Message: Add support for local files

    //Open signing status in the same page!
    Scrive.ContentScript.uploadPDFData( request, errorCallback, true );
  };

};