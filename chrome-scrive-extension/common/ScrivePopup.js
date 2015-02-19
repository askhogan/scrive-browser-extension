/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="background.ts" />
/// <reference path="show_error.ts" />

Scrive.Popup = new function () {

//  var modalOptions;
  var modalTitle;
  var modalContent;
  var acceptButton;
  var cancelButton;
  var closeWindowButton;
  var directUploadLink;
  var directUploadButton;
  var dotElements;
  var pdfs = [];
  var spacer;
  var popup;
  var showPopup;

  this.init = function () {

    showPopup = Scrive.Platform.BrowserUtils.showPopup;

    var body = Scrive.Popup.getBody( document );

    spacer = document.createElement( "div" );
    spacer.id = "scrive_spacer";
    //spacer.style.top = getDocHeight(doc) + "px";
    spacer.innerHTML = "\<iframe class='scrive_cover' src='about:blank'></iframe>";
    body.appendChild( spacer );

    popup = document.createElement( "div" );
    popup.id = "scrive_popup";
    spacer.appendChild( popup );
    //Options removed for chrome - add for IE
    //popup.innerHTML = "" + "\<div class='scrive_modal-header scrive_no-icon'\>" + "    \<a class='scrive_modal-options'>" + "       \<div class='scrive_label'></div>" + "   \</a>"
    popup.innerHTML = "" + "\<div class='scrive_modal-header scrive_no-icon'\>" + "       \<div class='scrive_label'></div>" + "   \</a>"

    + "    \<span class='scrive_modal-title'></span>" + "    \<a class='scrive_modal-close'></a>" + "\</div>"
    + "   \<div class='scrive_modal-body'>" + "   \<div class='scrive_modal-content'>" + "       \<div class='scrive_body'></div>"
    + "   \</div>" + "   \</div>"
    + "        \<div class='scrive_modal-footer'>" + "   \<a class='scrive_float-left scrive_cancel scrive_button scrive_button-gray'>" + "       \<div class='scrive_label'></div>"
    + "   \</a>" + "   \<a class='scrive_float-left scrive_direct-upload scrive_button scrive_button-gray'>" + "       \<div class='scrive_label'></div>"
    + "   \</a>" + "   \<a class='scrive_float-right scrive_accept green scrive_button scrive_button-green'>" + "       \<div class='scrive_label'></div>"
    + "   \</a\>" + "\</div\>";


    // Set up the templateable parts of the modal
    //Options removed for chrome - add for IE
    //modalOptions = document.querySelector( '.scrive_modal-options' );
    modalTitle = document.querySelector( '.scrive_modal-title' );
    modalContent = document.querySelector( '.scrive_modal-content .scrive_body' );
    acceptButton = document.querySelector( '.scrive_modal-footer .scrive_accept' );
    cancelButton = document.querySelector( '.scrive_modal-footer .scrive_cancel' );
    directUploadButton = document.querySelector( '.scrive_modal-footer .scrive_direct-upload' );
    closeWindowButton = document.querySelector( '.scrive_modal-header .scrive_modal-close' );

    // Steps:
    // - Ask if there is a PDF
    //   - If false pdf, ask user to print page to paper
    //   - If true pdf, ask if user wants to print to e-sign

    var response = Scrive.ContentScript.findEmbedTagURLs( document );

    if ( response == undefined ) {
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = undefined" );
    } else if ( response.length != 0 ) {
      pdfs = response;
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = " + response.length );
      Scrive.Popup.askPrintToEsign();
    } else {
      Scrive.LogUtils.log( "findEmbedTagURLs(document) = " + response.length );
      /*
       * This is slightly creepy as it will print main frame. Usually
       * data is presented as an IFRAME or FRAME in a FRAMESET, but
       * from this point we cannot really know which of the subframes
       * contains useful data.
       *
       * Just hope that people will do this once and then learn not to
       * touch this again.
       */
      Scrive.Popup.askPrintToPaper();
    }

    var onDirectUpload = function () {
      window.open( Scrive.jsBase + "/html/direct_upload.html", '_blank' );
    };

    directUploadButton.addEventListener( 'click', onDirectUpload );

    var onOptions = function () {
      window.location.href = Scrive.jsBase + "/html/options.html";
    };

    //Options removed for chrome - add for IE
    //modalOptions.addEventListener( 'click', onOptions );

    Scrive.Popup.toggleDiv();
  };

  this.getHead = function ( doc ) {
    var head = null;
    if ( doc && doc.documentElement && doc.documentElement.childNodes ) {
      var childNodes = doc.documentElement.childNodes;
      for ( var i = 0; i < childNodes.length; i++ ) {
        if ( childNodes[ i ].nodeName.toLowerCase() == "head" ) {
          head = childNodes[ i ];
          break;
        }
      }
      if ( !head ) {
        head = childNodes[ 0 ];
      }
    }
    return head;
  };

  this.getBody = function ( doc ) {
    var elements = doc.getElementsByTagName( "body" );
    var body = elements.length > 0 ? elements[ 0 ] : null;
    if ( body == null ) {
      var head = this.getHead( doc );
      body = head.nextSibling;
    }
    return body;
  };

  this.toggleElem = function ( div ) {
    if ( showPopup ) div.style.visibility = 'visible';
    else div.style.visibility = 'hidden';
  };

  this.toggleDiv = function () {
    Scrive.Popup.toggleElem( spacer );
    clearInterval(uploadingPDFInterval);
    Scrive.Popup.clearDots();
    showPopup = !showPopup;
  };

  this.askPrintToEsign = function () {
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "startEsigningQuestion" );
    modalContent.style.display = "none";
    //Options removed for chrome - add for IE
    //modalOptions.innerText = Scrive.Platform.i18n.getMessage( "options" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "no" );
    directUploadButton.style.display = "none";
    var onAccept = function () {
      Scrive.Mixpanel.track( "Print to e-sign accept" );

      /*
       * Here we would actually like to inspect what was saved in the
       * request to weed out anything looking like an EMBED element but
       * not referring to an actual PDF. Candidates are:
       *
       * - type attribute on embed element (but it is sometimes missing)
       * - .pdf as extension of url (but sometimes it is not there)
       * - Content-type: application.pdf (but sometimes it is not)
       *
       * Those should be probably tried only when there is more than one
       * EMBED tag, otherwise just go with what happens to be there.
       */
      var pdfurl = pdfs[ 0 ];

      Scrive.Platform.HttpRequest.PrintToEsign( pdfurl );
      //Do we need ability to send PDF from the same page multiple times without a refresh of browser window ?
      //if we remove listener button is not functional
      acceptButton.removeEventListener( 'click', onAccept );
      Scrive.Popup.uploadingPDF();
    };
    var onCancel = function () {
      Scrive.Popup.toggleDiv();
      Scrive.Mixpanel.track( "Print to e-sign cancel", {}, function () {;
      } );
    };

    acceptButton.addEventListener( 'click', onAccept );
    cancelButton.addEventListener( 'click', onCancel );
    closeWindowButton.addEventListener( 'click', this.toggleDiv );
  };

  this.askPrintToPaper = function () {
    //Options removed for chrome - add for IE
    //modalOptions.innerText = Scrive.Platform.i18n.getMessage( "options" );
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "printToPaperQuestion" );
    modalContent.innerHTML = Scrive.Platform.i18n.getMessage( "noPDFFound" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "print" );
    directUploadButton.innerText = Scrive.Platform.i18n.getMessage( "upload" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "cancel" );
    var onAccept = function () {
      Scrive.Popup.toggleDiv();
      window.print();
      Scrive.Mixpanel.track( "Print to paper accept" );
      acceptButton.removeEventListener( 'click', onAccept );
    };
    var onCancel = function () {
      Scrive.Popup.toggleDiv();
      Scrive.Mixpanel.track( "Print to paper cancel", {}, function () {;
      } );
    };

    acceptButton.addEventListener( 'click', onAccept );
    cancelButton.addEventListener( 'click', onCancel );
    closeWindowButton.addEventListener( 'click', this.toggleDiv );
  };

  var dots = 3;
  this.updateWaitingButtonText = function () {
    var html = Scrive.Platform.i18n.getMessage( "wait" ) + "<span id='scrive_dot-0'>.</span><span id='scrive_dot-1'>.</span><span id='scrive_dot-2'>.</span>";
    acceptButton.innerHTML = html;

    dotElements = acceptButton.querySelectorAll( '[id^=scrive_dot-]' );
    for ( var i = 0; i < dotElements.length; i++ ) {
      dotElements[ i ].style.visibility = 'hidden';

      // Show some of the dots
      if ( i < dots ) {
        dotElements[ i ].style.visibility = 'visible';
      }
    }

    dots++;
    if ( dots == 4 )
      dots = 1;
  };

  this.clearDots = function () {
    acceptButton.className = 'scrive_float-right scrive_accept green scrive_button scrive_button-green';
    cancelButton.style.display = "block";
//    directUploadButton.style.display = "block";

    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );

    dotElements = acceptButton.querySelectorAll( '[id^=scrive_dot-]' );
    for ( var i = 0; i < dotElements.length; i++ ) {
      dotElements[ i ].style.visibility = 'hidden';
    }
  };

  var uploadingPDFInterval;
  this.uploadingPDF = function () {
    acceptButton.className += " is-inactive";
    cancelButton.style.display = "none";
    directUploadButton.style.display = "none";

    this.updateWaitingButtonText();
    uploadingPDFInterval = setInterval( this.updateWaitingButtonText, 1000 );
  };

  this.errorCallback = function ( errorData ) {
    showError( modalContent, errorData );

    clearInterval( uploadingPDFInterval );
    cancelButton.style.display = "none";
    directUploadButton.style.display = "none";
    acceptButton.className = "scrive_button scrive_button-green scrive_float-right";
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "ok" );
    var onAccept = function () {
      acceptButton.removeEventListener( 'click', onAccept );
      window.close();
    };
    acceptButton.addEventListener( 'click', onAccept );
  };
};