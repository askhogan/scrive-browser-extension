/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="content_script.ts" />

Scrive.DirectUpload = new function() {

    var inputFile;
    var dropbox;
    var overlay;
    var container;
    var overlayText;
    var error;

    this.init = function() {

        Scrive.LogUtils.debugOn = true;
        Scrive.LogUtils.profileOn = false;
        Scrive.LogUtils.infoOn = true;

        //Initialize platform specific stuff
        Scrive.Platform.init();

        //EKI not sure this will work in IE if not we will have to use
        document.addEventListener("DOMContentLoaded", function () {
            // Set up the templateable parts of the modal
            inputFile = document.querySelector('input[type="file"]');
//EKI doesnt work in IE9/IE10
            inputFile.addEventListener("change", Scrive.DirectUpload.handleFiles, false);

            dropbox = document.querySelector('.dropbox');
            overlay = document.querySelector('.dropbox-overlay');
            overlayText = overlay.querySelector('h1');
            container = document.querySelector('.container-inner');
            error = document.querySelector('.error .container-inner');

            document.body.addEventListener("dragenter", Scrive.DirectUpload.dragenter, false);
            document.body.addEventListener("drop", Scrive.DirectUpload.preventDrop, false);
            document.body.addEventListener("dragover", Scrive.DirectUpload.preventDrop, false);
            overlay.addEventListener("dragover", Scrive.DirectUpload.dragover, false);
            overlay.addEventListener("dragleave", Scrive.DirectUpload.dragleave, false);
            overlay.addEventListener("drop", Scrive.DirectUpload.drop, false);


            overlay.style.width = container.offsetWidth + "px";
            overlay.style.height = container.offsetHeight + "px";

            // Both the button and the overlay text are centered, but not exactly.
            // So we adjust the centering (that we do using line-height) with a few px.
            overlayText.style.lineHeight = (container.offsetHeight - 4) + "px";

            Scrive.DirectUpload.translateUi();
        });
    };

    this.handleFiles = function() {
        //EKI IE < 10 has no support for the html5 fileapi
        //http://stackoverflow.com/questions/6191792/javascript-file-upload
        var fileList = this.files;
        if (fileList.length == 1) {
            var file = fileList[0];

            Scrive.DirectUpload.showUploading();
            //ScriveContentScript.js needs to be injected 1st
            Scrive.ContentScript.uploadPDFData(file, Scrive.DirectUpload.errorCallback, true);
        }
    };

    this.dragenter = function (e) {
        overlay.className += ' visible';
        e.stopPropagation();
        e.preventDefault();
    };

    this.dragover = function(e) {
        e.stopPropagation();
        e.preventDefault();
        overlay.className += ' filehover';
        Scrive.LogUtils.log("dragover");
    };

    this.dragleave = function (e) {
        e.stopPropagation();
        e.preventDefault();
        //EKI The classList property is not supported by IE9 and lower.
        //http://stackoverflow.com/questions/8098406/code-with-classlist-does-not-work-in-ie
        //overlay.classList.remove('filehover');
        overlay.className = overlay.className.replace(/ filehover/g, "");
    };

    this.drop = function(e) {
        e.stopPropagation();
        e.preventDefault();

        var dt = e.dataTransfer;
        // unused variable
//        var files = dt.files;

        Scrive.DirectUpload.handleFiles.call(dt);
    };

    this.preventDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
    };

    this.translateUi = function () {
        document.querySelector("#upload-pdf-document").innerText = Scrive.Platform.i18n.getMessage("uploadPDFDocument");
        document.querySelector("#choose-pdf-document").innerText = Scrive.Platform.i18n.getMessage("choosePDFDocument");
        document.querySelector("#drop-file-here").innerText = Scrive.Platform.i18n.getMessage("dropFileHere");
        document.querySelector(".dnd-instructions").innerText = Scrive.Platform.i18n.getMessage("orDragAndDrop");
    };

    this.errorCallback = function (errorData) {
        //EKI The classList property is not supported by IE9 and lower.
        //http://stackoverflow.com/questions/8098406/code-with-classlist-does-not-work-in-ie
//        overlay.classList.remove('visible');
        overlay.className = overlay.className.replace(/ visible/g, "");
        error.parentElement.style.display = "block";

        //show_error.js needs to be injected 1st
        showError(error, errorData);
    };

    this.showUploading = function () {
        //EKI The classList property is not supported by IE9 and lower.
        //http://stackoverflow.com/questions/8098406/code-with-classlist-does-not-work-in-ie
//        overlay.classList.remove('visible');
        overlay.className = overlay.className.replace(/ visible/g, "");

        container.innerHTML = '<h1 class="uploading">Laddar upp</h1>';
        var spinner = new Spinner({
            lines: 9,
            length: 3,
            width: 2,
            radius: 5,
            color: '#000000',
            speed: 1.5,
            trail: 74,
            shadow: false,
            className: 'spinner'
        }).spin();
        container.appendChild(spinner.el);
    };
};

//setTimeout(Scrive.DirectUpload.init,100);
Scrive.DirectUpload.init();
