
Scrive.Popup = new function () {

//  var modalOptions;
  var modalTitle;
  var modalContent;
  var acceptButton;
  var cancelButton;
  var closeWindowButton;

  var onAccept;
  var onCancel;
  var onDirectUpload;

  var dotElements;
  var pdfs = [];
  var spacer;
  var popup;
  var showPopup;
  var uploadingPDFInterval;

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
    //Changed to make IE happy
    closeWindowButton.innerText = "\u00D7";
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

    acceptButton = document.createElement( "a" );
    acceptButton.className = 'scrive_float-right scrive_accept green scrive_button scrive_button-green';
    footer.appendChild(acceptButton);
  };


  this.init = function () {

    showPopup = Scrive.Platform.BrowserUtils.showPopup;

    var body = Scrive.Popup.getBody( document );
    spacer = document.getElementById('scrive_spacer');
    popup = document.getElementById('scrive_popup');

    //added tu support for update and install of Extension
    if (popup) {
      popup.parentNode.removeChild(popup);
      popup = null;
    }

    if (spacer) {
      spacer.parentNode.removeChild(spacer);
      spacer = null;
    }

    spacer = document.createElement( "div" );
    spacer.id = "scrive_spacer";
    spacer.innerHTML = "\<iframe class='scrive_cover' src='about:blank'></iframe>";
    body.appendChild( spacer );

    popup = document.createElement( "div" );
    popup.id = "scrive_popup";

    var popupBorder = document.createElement( "div" );
    popupBorder.className = 'scrive_modal-border';
    popup.appendChild(popupBorder);

    //this.populatePopup(popup);
    this.populatePopup(popupBorder);

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
    else {
      acceptButton.removeEventListener( 'click', onAcceptPrintToEsign );
      cancelButton.removeEventListener( 'click', onCancelPrintToEsign );
      closeWindowButton.removeEventListener( 'click', onCancelPrintToEsign );

      acceptButton.removeEventListener( 'click', onAcceptPrintToPaper );

      acceptButton.removeEventListener( 'click', onAcceptError );

      div.style.visibility = 'hidden';
    }
  };

  this.toggleDivBookmarklet = function () {
    this.checkForPDF();
    this.toggleDiv();
  };

  this.toggleDiv = function () {
    if (uploadingPDFInterval) {
      clearInterval(uploadingPDFInterval);
      Scrive.Popup.clearDots();
    }
    Scrive.Popup.toggleElem( spacer );
    showPopup = !showPopup;
  };

  var onAcceptPrintToEsign = function () {
    acceptButton.removeEventListener( 'click', onAcceptPrintToEsign );
    var pdfurl = pdfs[ 0 ];
    Scrive.Popup.uploadingPDF();
    Scrive.Platform.HttpRequest.PrintToEsign( pdfurl );
    //Do we need ability to send PDF from the same page multiple times without a refresh of browser window ?
    //if we remove listener button is not functional
    Scrive.Mixpanel.track( "Print to e-sign accept" );
  };

  var onCancelPrintToEsign = function () {
    cancelButton.removeEventListener( 'click', onCancelPrintToEsign );
    closeWindowButton.removeEventListener( 'click', onCancelPrintToEsign );
    Scrive.Popup.toggleDiv();
    Scrive.Mixpanel.track( "Print canceled" );
  };

  this.askPrintToEsign = function () {
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "startEsigningQuestion" );
    modalContent.innerHTML = Scrive.Platform.i18n.getMessage( "PDFFound" );
    //Options removed for chrome - add for IE
    //modalOptions.innerText = Scrive.Platform.i18n.getMessage( "options" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "no" );

    spacer.appendChild( popup );

    acceptButton.addEventListener( 'click', onAcceptPrintToEsign );
    cancelButton.addEventListener( 'click', onCancelPrintToEsign );
    closeWindowButton.addEventListener( 'click', onCancelPrintToEsign );
  };

  var onAcceptPrintToPaper = function () {
    acceptButton.removeEventListener( 'click', onAcceptPrintToPaper );
    Scrive.Popup.uploadingPDF();
    Scrive.Platform.HttpRequest.PageToEsign();
    Scrive.Mixpanel.track( "Print to paper accept" );
  };

  this.askPrintToPaper = function () {
    modalTitle.innerText = Scrive.Platform.i18n.getMessage( "startEsigningQuestion" );
    modalContent.innerHTML = Scrive.Platform.i18n.getMessage( "noPDFFound" );
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "yes" );
    cancelButton.innerText = Scrive.Platform.i18n.getMessage( "no" );

    spacer.appendChild( popup );


    acceptButton.addEventListener( 'click', onAcceptPrintToPaper );
    cancelButton.addEventListener( 'click', onCancelPrintToEsign );
    closeWindowButton.addEventListener( 'click', onCancelPrintToEsign );
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

  this.uploadingPDF = function () {
    acceptButton.className += " is-inactive";
    cancelButton.style.display = "none";

    //this.updateWaitingButtonText();
    uploadingPDFInterval = setInterval( this.updateWaitingButtonText, 1000 );
  };

  var onAcceptError = function () {
    acceptButton.removeEventListener( 'click', onAcceptError );
    Scrive.Popup.toggleDiv();
  };

  this.errorCallback = function ( errorData ) {
    showError( modalContent, errorData );

    if (uploadingPDFInterval) {
      clearInterval(uploadingPDFInterval);
      Scrive.Popup.clearDots();
    }

    cancelButton.style.display = "none";
    acceptButton.className = "scrive_button scrive_button-green scrive_float-right";
    acceptButton.innerText = Scrive.Platform.i18n.getMessage( "ok" );
    acceptButton.addEventListener( 'click', onAcceptError );
  };
};