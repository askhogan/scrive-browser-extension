var bg = chrome.extension.getBackgroundPage();
var modalTitle;
var modalContent;
var acceptButton;
var cancelButton;
var directUploadLink;

var sendMessage = function(message, responseCallback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.sendRequest(tab.id, message, responseCallback);
  });
};


document.addEventListener("DOMContentLoaded", function() {
  // Steps:
  // - Ask if there is a PDF
  //   - If false pdf, ask user to print page to paper
  //   - If true pdf, ask if user wants to print to e-sign

  var alreadyReloaded = false;
  var f = function(response) {
      if (response == true) {
          askPrintToEsign();
      } else if (response == false) {
          askPrintToPaper();
      }
      else {
          // we happen to be here because new chrome extension did not
          // get loaded in the context of a page
          if( !alreadyReloaded ) {
              /*
               * Do reload once as we might get into infinite look here
               */
              alreadyReloaded = true;
              chrome.tabs.executeScript(null, {"code": "window.location.reload()"}, function() {
                  console.log("Reloaded Extension content script");
                  sendMessage({'type': 'pdfexistsonpage',
                               'savedDataForRequests': bg.savedDataForRequests
                              }, f);
              });
          }
      }
  }

  sendMessage({'type': 'pdfexistsonpage',
               'savedDataForRequests': bg.savedDataForRequests
              }, f);

  // Set up the templateable parts of the modal
  modalTitle = document.querySelector('.modal-title');
  modalContent = document.querySelector('.modal-content .body');
  acceptButton = document.querySelector('.modal-footer .accept');
  cancelButton = document.querySelector('.modal-footer .cancel');
  directUploadButton = document.querySelector('.modal-footer .direct-upload');

  directUploadButton.addEventListener('click', function () {
      mixpanel.track("Direct upload accept");
      chrome.tabs.create({'url': chrome.extension.getURL('html/direct_upload.html')});
  });
});

var askPrintToEsign = function() {
  modalTitle.innerText = "Starta e-signering genom Scrive?";
  modalContent.style.display = "none";
  acceptButton.innerText = "Ja";
  cancelButton.innerText = "Nej";
  directUploadButton.style.display = "none";
  var onAccept = function() {
    mixpanel.track("Print to e-sign accept");
    sendMessage({'type': 'printtoesign',
                 'savedDataForRequests': bg.savedDataForRequests
                }, function(data) {
      // this is an error callback.
      error(data);
    });
    acceptButton.removeEventListener('click', onAccept);
    uploadingPDF();
  };
  var onCancel = function() { mixpanel.track("Print to e-sign cancel", {}, function() { window.close(); }); };
  acceptButton.addEventListener('click', onAccept);
  cancelButton.addEventListener('click', onCancel);
};

var askPrintToPaper = function() {
  modalTitle.innerText = "Skriv ut med skrivare?";
  modalContent.innerHTML = "Det gick inte att hitta en PDF p&aring; den h&auml;r sidan.";
  acceptButton.innerText = "Skriv ut";
  directUploadButton.innerText = "Ladda upp";
  cancelButton.innerText = "Avbryt";
  var onAccept = function() {
    mixpanel.track("Print to paper accept");
    sendMessage({'type': 'printtopaper'});
    acceptButton.removeListener('click', onAccept);
  };
  var onCancel = function() { mixpanel.track("Print to paper cancel", {}, function() { window.close() }); };
  acceptButton.addEventListener('click', onAccept);
  cancelButton.addEventListener('click', onCancel);
};

var dots = 3;
var updateWaitingButtonText = function() {
  var html = "V&auml;nta<span id='dot-0'>.</span><span id='dot-1'>.</span><span id='dot-2'>.</span>";
  acceptButton.innerHTML = html;

  dotElements = acceptButton.querySelectorAll('[id^=dot-]');
  for (var i = 0; i < dotElements.length; i++) {
    dotElements[i].style.visibility = 'hidden';

    // Show some of the dots
    if (i < dots) {
      dotElements[i].style.visibility = 'visible';
    }
  }

  dots++;
  if (dots == 4) dots = 1;
};

var uploadingPDFInterval;
var uploadingPDF = function() {
  acceptButton.className += " is-inactive";
  cancelButton.style.display = "none";
  directUploadButton.style.display = "none";

  updateWaitingButtonText();
  uploadingPDFInterval = setInterval(updateWaitingButtonText, 1000);
};

var error = function(errorData) {
  modalTitle.innerHTML = "N&aring;got gick fel";
  modalContent.style.display = "block";
  modalContent.innerHTML = "<p>Genom att maila felmeddelandet nedan till <a target='_blank' href='mailto:info@scrive.com?subject=Scrive Chrome-till%C3%A4gg - buggrapport'>info@scrive.com</a> kan du hj&auml;lpa till att g&ouml;ra tj&auml;nsten b&auml;ttre.<br />";
  modalContent.innerHTML += "<p>Felmeddelande:<br/>" +
                                errorData.response + "<br/>" +
                                errorData.headers.join("<br/>") + "<br/>" +
                                "Status: " + errorData.status + " " + errorData.statusText + "<br/>" +
                            "</p>";

  chrome.storage.sync.get(KEYS.PRINTER_URL, function(items) {
    var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
    modalContent.innerHTML += "<p>System-information:<br/>";
    modalContent.innerHTML += "Chrome Extension Version: " + chrome.app.getDetails().version + "<br />";
    modalContent.innerHTML += "Tid: " + new Date() + "<br />";
    modalContent.innerHTML += "URL: " + printer_url;
    modalContent.innerHTML += "</p>";
  });

  clearInterval(uploadingPDFInterval);
  cancelButton.style.display = "none";
  directUploadButton.style.display = "none";
  acceptButton.className = "button button-green float-right";
  acceptButton.innerText = "OK";
  var onAccept = function() {
    acceptButton.removeEventListener('click', onAccept);
    window.close();
  };
  acceptButton.addEventListener('click', onAccept);

  mixpanel.track("Error detected", {content: modalContent.innerHTML});
};
