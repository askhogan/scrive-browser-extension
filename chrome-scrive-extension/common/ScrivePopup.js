/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="background.ts" />
/// <reference path="show_error.ts" />

Scrive.Popup = new function() {

//    var bg = chrome.extension.getBackgroundPage();
    var modalOptions;
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
    var divToggle;

    this.init = function () {

        divToggle = Scrive.Platform.BrowserUtils.divToggle;

        var body = Scrive.Popup.getBody(document);

        spacer = document.createElement("div");
        spacer.id = "scrive_spacer";
//        spacer.style.top = getDocHeight(doc) + "px";
        spacer.innerHTML = "\<iframe class='scrive-cover' src='about:blank'></iframe>";
        body.appendChild(spacer);

        popup = document.createElement("div");
        popup.id = "scrive_popup";
        spacer.appendChild(popup);
        popup.innerHTML = ""
            + "\<div class='scrive-modal-header scrive-no-icon'\>"
            + "    \<a class='scrive-modal-options'>"
            + "       \<div class='scrive-label'></div>"
            + "   \</a>"

//            +"    \<span class='modal-title'>Print to paper?</span>"
            + "    \<span class='scrive-modal-title'></span>"
            + "    \<a class='scrive-modal-close'></a>"
            + "\</div>"

            + "   \<div class='scrive-modal-body'>"
            + "   \<div class='scrive-modal-content'>"
            + "       \<div class='scrive-body'></div>"
//            +"       \<div class='body'>We could not find a PDF on this page.</div>"
            + "   \</div>"
            + "   \</div>"

            + "        \<div class='scrive-modal-footer'>"
            + "   \<a class='scrive-float-left scrive-cancel scrive-button scrive-button-gray'>"
            + "       \<div class='scrive-label'></div>"
//            +"       \<div class='label'>Cancel</div>"
            + "   \</a>"
            + "   \<a class='scrive-float-left scrive-direct-upload scrive-button scrive-button-gray'>"
            + "       \<div class='scrive-label'></div>"
//            +"       \<div class='label'>Upload</div>"
            + "   \</a>"
            + "   \<a class='scrive-float-right scrive-accept green scrive-button scrive-button-green'>"
            + "       \<div class='scrive-label'></div>"
//            +"       \<div class='label'>Print</div>"
            + "   \</a\>"
            + "\</div\>";


        // Set up the templateable parts of the modal
        modalOptions = document.querySelector('.scrive-modal-options');
        modalTitle = document.querySelector('.scrive-modal-title');
        modalContent = document.querySelector('.scrive-modal-content .scrive-body');
        acceptButton = document.querySelector('.scrive-modal-footer .scrive-accept');
        cancelButton = document.querySelector('.scrive-modal-footer .scrive-cancel');
        directUploadButton = document.querySelector('.scrive-modal-footer .scrive-direct-upload');
        closeWindowButton = document.querySelector('.scrive-modal-header .scrive-modal-close');

//        document.addEventListener("DOMContentLoaded", function () {
        // Steps:
        // - Ask if there is a PDF
        //   - If false pdf, ask user to print page to paper
        //   - If true pdf, ask if user wants to print to e-sign

        //EKI this calls //
//        sendMessage({ 'type': MESSAGES.PDFEXISTSONPAGE }, null);
//    var response = Scrive.ContentScript.findEmbedTagURLs(document);
        var response = Scrive.ContentScript.findEmbedTagURLs(document);

//            var alreadyReloaded = false;
//            var f = function (response) {
        if (response == undefined) {
            // we happen to be here because new chrome extension did not
            // get loaded in the context of a page
//                    if (!alreadyReloaded) {
//                        /*
//                         * Do reload once as we might get into infinite look
//                         * here. Some pages will not load ScriveContentScript.js due to
//                         * security reasons. For example local file:// pages are
//                         * excluded by our manifest.json as there are chrome bugs in
//                         * security domain implementation for local pages anyway.
//                         */
//                        alreadyReloaded = true;
//                        chrome.tabs.executeScript(null, { "code": "window.location.reload()" }, function () {
//                            // let the new page actually load
//                            setTimeout(function () {
//                                console.log("Reloaded Extension content script");
//                                sendMessage({ 'type': MESSAGES.PDFEXISTSONPAGE }, f);
//                            }, 1000);
//                        });
                    Scrive.LogUtils.log("findEmbedTagURLs(document) = undefined");
//                    } else {
//                        /*
//                         * Seems we do not have rights to load ScriveContentScript.js on
//                         * the page, the best we can do is to print.
//                         */
//                        this.askPrintToPaper();
//                    }
        } else if (response.length != 0) {
            pdfs = response;
                    Scrive.LogUtils.log("findEmbedTagURLs(document) = " +  response.length);
            Scrive.Popup.askPrintToEsign();
        } else {
                    Scrive.LogUtils.log("findEmbedTagURLs(document) = " +  response.length);
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
            window.open(Scrive.jsBase + "/html/direct_upload.html", '_blank');
        };

        directUploadButton.addEventListener('click', onDirectUpload);

        var onOptions = function () {
//        window.open(Scrive.jsBase + "/html/options.html", '_blank');
            window.location.href = Scrive.jsBase + "/html/options.html";
        };

        modalOptions.addEventListener('click', onOptions);

    };

    this.getHead = function( doc ) {
        var head = null;
        if (doc && doc.documentElement && doc.documentElement.childNodes) {
            var childNodes = doc.documentElement.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                if (childNodes[i].nodeName.toLowerCase() == "head") {
                    head = childNodes[i];
                    break;
                }
            }
            if (!head) {
                head = childNodes[0];
            }
        }
        return head;
    };

    this.getBody = function( doc ) {
        var elements = doc.getElementsByTagName("body");
        var body = elements.length > 0 ? elements[0] : null;
        if (body == null) {
            var head = this.getHead(doc);
            body = head.nextSibling;
        }
        return body;
    };

    this.toggleElem = function(div) {
        if (divToggle)  div.style.visibility = 'hidden';
        else            div.style.visibility = 'visible';
    };

    this.toggleDiv = function() {
        Scrive.Popup.toggleElem(spacer);
        divToggle = !divToggle;
    };

    this.askPrintToEsign = function () {
        modalTitle.innerText = Scrive.Platform.i18n.getMessage("startEsigningQuestion");
        modalContent.style.display = "none";
        modalOptions.innerText = Scrive.Platform.i18n.getMessage("options");
        acceptButton.innerText = Scrive.Platform.i18n.getMessage("yes");
        cancelButton.innerText = Scrive.Platform.i18n.getMessage("no");
        directUploadButton.style.display = "none";
        var onAccept = function () {
            Scrive.Mixpanel.track("Print to e-sign accept");

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
            var pdfurl = pdfs[0];

            Scrive.Platform.HttpRequest.PrintToEsign(pdfurl);

            acceptButton.removeEventListener('click', onAccept);
            Scrive.Popup.uploadingPDF();
        };
        var onCancel = function () {
            Scrive.Popup.toggleDiv();
            Scrive.Mixpanel.track("Print to e-sign cancel", {}, function () {
                ;
//            window.close();
//            toggleDiv();
            });
        };

        acceptButton.addEventListener('click', onAccept);
        cancelButton.addEventListener('click', onCancel);
        closeWindowButton.addEventListener('click', this.toggleDiv);
    };

    this.askPrintToPaper = function () {
        modalOptions.innerText = Scrive.Platform.i18n.getMessage("options");
        modalTitle.innerText = Scrive.Platform.i18n.getMessage("printToPaperQuestion");
        modalContent.innerHTML = Scrive.Platform.i18n.getMessage("noPDFFound");
        acceptButton.innerText = Scrive.Platform.i18n.getMessage("print");
        directUploadButton.innerText = Scrive.Platform.i18n.getMessage("upload");
        cancelButton.innerText = Scrive.Platform.i18n.getMessage("cancel");
        var onAccept = function () {
            Scrive.Popup.toggleDiv();
            window.print();
            Scrive.Mixpanel.track("Print to paper accept");
            //EKI possible error
//            acceptButton.removeListener('click', onAccept);
            acceptButton.removeEventListener('click', onAccept);
        };
        var onCancel = function () {
            Scrive.Popup.toggleDiv();
            Scrive.Mixpanel.track("Print to paper cancel", {}, function () {
                ;
//            window.close();
//            toggleDiv();
            });
        };

        acceptButton.addEventListener('click', onAccept);
        cancelButton.addEventListener('click', onCancel);
        closeWindowButton.addEventListener('click', this.toggleDiv);
    };

    var dots = 3;
    this.updateWaitingButtonText = function () {
        var html = Scrive.Platform.i18n.getMessage("wait") + "<span id='scrive-dot-0'>.</span><span id='scrive-dot-1'>.</span><span id='scrive-dot-2'>.</span>";
        acceptButton.innerHTML = html;

        dotElements = acceptButton.querySelectorAll('[id^=scrive-dot-]');
        for (var i = 0; i < dotElements.length; i++) {
            dotElements[i].style.visibility = 'hidden';

            // Show some of the dots
            if (i < dots) {
                dotElements[i].style.visibility = 'visible';
            }
        }

        dots++;
        if (dots == 4)
            dots = 1;
    };

    var uploadingPDFInterval;
    this.uploadingPDF = function () {
        acceptButton.className += " is-inactive";
        cancelButton.style.display = "none";
        directUploadButton.style.display = "none";

        this.updateWaitingButtonText();
        uploadingPDFInterval = setInterval(this.updateWaitingButtonText, 1000);
    };

    this.errorCallback = function (errorData) {
        showError(modalContent, errorData);

        clearInterval(uploadingPDFInterval);
        cancelButton.style.display = "none";
        directUploadButton.style.display = "none";
        acceptButton.className = "scrive-button scrive-button-green scrive-float-right";
        acceptButton.innerText = Scrive.Platform.i18n.getMessage("ok");
        var onAccept = function () {
            acceptButton.removeEventListener('click', onAccept);
            window.close();
        };
        acceptButton.addEventListener('click', onAccept);
    };
};
