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
//    var directUploadLink;
    var directUploadButton;
    var dotElements;
    var pdfs = [];

    //EKI this will have to go to either specific layer or be removed in chrome
//    var sendMessage = function (message, responseCallback) {
//        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//            var tab = tabs[0];
//            chrome.tabs.sendMessage(tab.id, message, responseCallback);
//        });
//    };

    this.init = function () {


        var body = this.getBody(document);

        var spacer = document.createElement("div");
        spacer.id = "scr_spacer";
//        spacer.style.top = getDocHeight(doc) + "px";
        spacer.innerHTML = "\<iframe class='cover' src='about:blank'></iframe>";
        body.appendChild(spacer);

        var popup = document.createElement("div");
        popup.id = "scr_popup";
        spacer.appendChild(popup);
        popup.innerHTML = ""
            +"\<div class='modal-header no-icon'\>"
            +"    \<a class='modal-options'>"
            +"       \<div class='label'></div>"
            +"   \</a>"

//            +"    \<span class='modal-title'>Print to paper?</span>"
            +"    \<span class='modal-title'></span>"
            +"    \<a class='modal-close'></a>"
            +"\</div>"

            +"   \<div class='modal-body'>"
            +"   \<div class='modal-content'>"
            +"       \<div class='body'></div>"
//            +"       \<div class='body'>We could not find a PDF on this page.</div>"
            +"   \</div>"
            +"   \</div>"

            +"        \<div class='modal-footer'>"
            +"   \<a class='float-left cancel button button-gray'>"
            +"       \<div class='label'></div>"
//            +"       \<div class='label'>Cancel</div>"
            +"   \</a>"
            +"   \<a class='float-left direct-upload button button-gray'>"
            +"       \<div class='label'></div>"
//            +"       \<div class='label'>Upload</div>"
            +"   \</a>"
            +"   \<a class='float-right accept green button button-green'>"
            +"       \<div class='label'></div>"
//            +"       \<div class='label'>Print</div>"
            +"   \</a\>"
            +"\</div\>";


        // Set up the templateable parts of the modal
        modalOptions = document.querySelector('.modal-options');
        modalTitle = document.querySelector('.modal-title');
        modalContent = document.querySelector('.modal-content .body');
        acceptButton = document.querySelector('.modal-footer .accept');
        cancelButton = document.querySelector('.modal-footer .cancel');
        directUploadButton = document.querySelector('.modal-footer .direct-upload');

//        document.addEventListener("DOMContentLoaded", function () {
            // Steps:
            // - Ask if there is a PDF
            //   - If false pdf, ask user to print page to paper
            //   - If true pdf, ask if user wants to print to e-sign

        //EKI this calls //            sendMessage({ 'type': MESSAGES.PDFEXISTSONPAGE }, f);
        var response = Scrive.ContentScript.findEmbedTagURLs(document);

//            var alreadyReloaded = false;
//            var f = function (response) {
                if (response == undefined) {
                    // we happen to be here because new chrome extension did not
                    // get loaded in the context of a page
//                    if (!alreadyReloaded) {
//                        /*
//                         * Do reload once as we might get into infinite look
//                         * here. Some pages will not load content_script.js due to
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
//                         * Seems we do not have rights to load content_script.js on
//                         * the page, the best we can do is to print.
//                         */
//                        this.askPrintToPaper();
//                    }
                } else if (response.length != 0) {
                    pdfs = response;
                    Scrive.LogUtils.log("findEmbedTagURLs(document) = " +  response.length);
                    this.askPrintToEsign();
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
                    this.askPrintToPaper();
                }
//            };

//            sendMessage({ 'type': MESSAGES.PDFEXISTSONPAGE }, f);

            directUploadButton.addEventListener('click', function () {
                //EKI add this in for final version
//                mixpanel.track("Direct upload accept");
                //EKI open in new tab
//                chrome.tabs.create({ 'url': chrome.extension.getURL('html/direct_upload.html') });
                alert("not implemented yet");
            });
//        });

    };

    this.getHead = function( doc ) {
        var head = null;
        if ( doc && doc.documentElement && doc.documentElement.childNodes ){
            var childNodes = doc.documentElement.childNodes;
            for ( var i = 0; i < childNodes.length; i++ ){
                if ( childNodes[i].nodeName.toLowerCase() == "head" ){
                    head = childNodes[i];
                    break;
                }
            }
            if ( !head ){
                head = childNodes[0];
            }
        }
        return head;
    }

    this.getBody = function( doc ) {
        var elements = doc.getElementsByTagName( "body" );
        var body = elements.length > 0 ? elements[0] : null;
        if ( body == null ){
            var head = this.getHead( doc );
            body = head.nextSibling;
        }
        return body;
    };

    this.askPrintToEsign = function () {
        //EKI fix this - localization is not in place yet
//        modalTitle.innerText = chrome.i18n.getMessage("startEsigningQuestion");
        modalTitle.innerText = "Start e-signing through Scrive?";
        modalContent.style.display = "none";
//        acceptButton.innerText = chrome.i18n.getMessage("yes");
//        cancelButton.innerText = chrome.i18n.getMessage("no");
        modalOptions.innerText = "Options";
        acceptButton.innerText = "Yes";
        cancelButton.innerText = "No";
        directUploadButton.style.display = "none";
        var onAccept = function () {
//            mixpanel.track("Print to e-sign accept");

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
            //EKI not sure how I will handle these - check bg page
//            var savedData = bg.savedDataForRequests[pdfurl];
            //EKI chrome specific
//            sendMessage({
//                type: 'printtoesign',
//                method: savedData.method,
//                formData: savedData.formData,
//                url: pdfurl
//            }, errorCallback);
            //EKI mockup:
            var savedData = new Object();
            savedData.url=pdfurl;
            savedData.method="PUT";
            Scrive.ContentScript.sendPDF(savedData, Scrive.Popup.errorCallback);

            acceptButton.removeEventListener('click', onAccept);
            Scrive.Popup.uploadingPDF();
        };
        var onCancel = function () {
            //EKI will add this in
//            mixpanel.track("Print to e-sign cancel", {}, function () {
//                //EKI nothing to close here, just hide window
////                window.close();
//            });
            alert("Not implemented yet");
        };
        var onOptions = function () {
            window.location.href = Scrive.jsBase + "/html/options.html";
        }

        modalOptions.addEventListener('click', onOptions);
        acceptButton.addEventListener('click', onAccept);
        cancelButton.addEventListener('click', onCancel);
    };

    this.askPrintToPaper = function () {
        //EKI fix this - localization is not in place yet
//        modalTitle.innerText = chrome.i18n.getMessage("printToPaperQuestion");
//        modalContent.innerHTML = chrome.i18n.getMessage("noPDFFound");
//        acceptButton.innerText = chrome.i18n.getMessage("print");
//        directUploadButton.innerText = chrome.i18n.getMessage("upload");
//        cancelButton.innerText = chrome.i18n.getMessage("cancel");
        modalOptions.innerText = "Options";
        modalTitle.innerText = "Print to paper?";
        modalContent.innerHTML = "We could not find a PDF on this page.";
        acceptButton.innerText = "Print";
        directUploadButton.innerText = "Upload";
        cancelButton.innerText = "Cancel";
        var onAccept = function () {
//            mixpanel.track("Print to paper accept");
//            sendMessage({ 'type': MESSAGES.PRINTTOPAPER }, function (e) {
//                return;
//            });
            //EKI possible error
//            acceptButton.removeListener('click', onAccept);
            acceptButton.removeEventListener('click', onAccept);
        };
        var onCancel = function () {
//            mixpanel.track("Print to paper cancel", {}, function () {
//                window.close();
//            });
            alert("Not implemented yet");
        };
        var onOptions = function () {
            window.location.href = Scrive.jsBase + "/html/options.html";
        }

        modalOptions.addEventListener('click', onOptions);
        acceptButton.addEventListener('click', onAccept);
        cancelButton.addEventListener('click', onCancel);

    };

    var dots = 3;
    this.updateWaitingButtonText = function () {
        //EKI fix this - localization is not in place yet
//        var html = chrome.i18n.getMessage("wait") + "<span id='dot-0'>.</span><span id='dot-1'>.</span><span id='dot-2'>.</span>";
        acceptButton.innerHTML = "Wait" + "<span id='dot-0'>.</span><span id='dot-1'>.</span><span id='dot-2'>.</span>";

        dotElements = acceptButton.querySelectorAll('[id^=dot-]');
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
        acceptButton.className = "button button-green float-right";
        //EKI fix this - localization is not in place yet
//        acceptButton.innerText = chrome.i18n.getMessage("ok");
        acceptButton.innerText = "Ok";
        var onAccept = function () {
            acceptButton.removeEventListener('click', onAccept);
//            window.close();
        };
        acceptButton.addEventListener('click', onAccept);
    };

};