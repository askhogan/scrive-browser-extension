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

  this.populatePopup = function ( popup ) {

    var header = document.createElement( "div" );
    header.className = 'scrive_modal-header scrive_no-icon';
    popup.appendChild(header);

    var header_label = document.createElement( "div" );
    header_label.className = 'scrive_label';
    header.appendChild(header_label);

    modalTitle = document.createElement( "span" );
    modalTitle.className = 'scrive_modal-title';
    header.appendChild(modalTitle);

    closeWindowButton = document.createElement( "a" );
    closeWindowButton.className = 'scrive_modal-close';
    closeWindowButton.text = "\u00D7";
    header.appendChild(closeWindowButton);

    var body = document.createElement( "div" );
    body.className = 'scrive_modal-body';
    popup.appendChild(body);

    var body_body = document.createElement( "div" );
    body_body.className = 'scrive_modal-content';
    body.appendChild(body_body);

    modalContent = document.createElement( "div" );
    modalContent.className = 'scrive_body';
    body_body.appendChild(modalContent);

    var footer = document.createElement( "div" );
    footer.className = 'scrive_modal-footer';
    popup.appendChild(footer);

    cancelButton = document.createElement( "a" );
    cancelButton.className = 'scrive_float-left scrive_cancel scrive_button scrive_button-gray';
    cancelButton.style = "display: block;";
    footer.appendChild(cancelButton);

    directUploadButton = document.createElement( "a" );
    directUploadButton.className = 'scrive_float-left scrive_direct-upload scrive_button scrive_button-gray';
    footer.appendChild(directUploadButton);

    acceptButton = document.createElement( "a" );
    acceptButton.className = 'scrive_float-right scrive_accept green scrive_button scrive_button-green';
    footer.appendChild(acceptButton);
  };


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
//    spacer.appendChild( popup );

    this.populatePopup(popup);

    var onDirectUpload = function () {
      window.open(Scrive.jsBase + "/html/direct_upload.html", '_blank');
    };

    directUploadButton.addEventListener('click', onDirectUpload);

    var onOptions = function () {
      window.location.href = Scrive.jsBase + "/html/options.html";
    };

    //Options removed for chrome - add for IE
    //modalOptions.addEventListener( 'click', onOptions );

    Scrive.Popup.toggleDiv();
  };

  // Steps:
  // - Ask if there is a PDF
  //   - If false pdf, ask user to print page to paper
  //   - If true pdf, ask if user wants to print to e-sign
  this.checkForPDF = function () {

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
      //body = head.nextSibling;
      //now we add body if page is missing one
      if ( head && head.parentNode )
      {
        body = document.createElement( "body" );
        head.parentNode.appendChild( body );
      }
    }
    return body;
  };

  this.toggleElem = function ( div ) {
    if ( showPopup ) div.style.visibility = 'visible';
    else div.style.visibility = 'hidden';
  };

  this.toggleDivBookmarklet = function () {
    this.checkForPDF();
    this.toggleDiv();
  };

  this.toggleDiv = function () {
    Scrive.Popup.toggleElem( spacer );
    if (uploadingPDFInterval) {
      clearInterval(uploadingPDFInterval);
      Scrive.Popup.clearDots();
    }
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

    spacer.appendChild( popup );

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

    spacer.appendChild( popup );

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

  var uploadingPDFInterval = null;
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