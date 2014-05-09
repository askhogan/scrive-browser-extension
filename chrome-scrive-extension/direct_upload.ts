/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="content_script.ts" />

var inputFile;
var dropbox;

function handleFiles() {
  var fileList = this.files;
  if( fileList.length==1 ) {
    var file = fileList[0];

    showUploading();

    uploadPDFData(file, function(e) {
      showError(e);
    },true);
  }
}

function dragenter(e) {
  overlay.className += ' visible';
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
  overlay.className += ' filehover';
  console.log("dragover");
}

function dragleave(e) {
  e.stopPropagation();
  e.preventDefault();
  overlay.classList.remove('filehover');
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  var dt = e.dataTransfer;
  var files = dt.files;

  handleFiles.call(dt);
}

function preventDrop(e) {
  e.stopPropagation();
  e.preventDefault();
}

document.addEventListener("DOMContentLoaded", function() {
  // Set up the templateable parts of the modal
  inputFile = document.querySelector('input[type="file"]');

  inputFile.addEventListener("change", handleFiles, false);

  dropbox = document.querySelector('.dropbox');
  overlay = document.querySelector('.dropbox-overlay');
  overlayText = overlay.querySelector('h1');
  container = document.querySelector('.container-inner');
  error = document.querySelector('.error');

  document.body.addEventListener("dragenter", dragenter, false);
  document.body.addEventListener("drop", preventDrop, false);
  document.body.addEventListener("dragover", preventDrop, false);
  overlay.addEventListener("dragover", dragover, false);
  overlay.addEventListener("dragleave", dragleave, false);
  overlay.addEventListener("drop", drop, false);

  overlay.style.width = container.offsetWidth + "px";
  overlay.style.height = container.offsetHeight + "px";

  // Both the button and the overlay text are centered, but not exactly.
  // So we adjust the centering (that we do using line-height) with a few px.
  overlayText.style.lineHeight = (container.offsetHeight - 4) + "px";

  translateUi();
});

var translateUi = function() {
  document.querySelector("#upload-pdf-document").innerText = chrome.i18n.getMessage("uploadPDFDocument");
  document.querySelector("#choose-pdf-document").innerText = chrome.i18n.getMessage("choosePDFDocument");
  document.querySelector("#drop-file-here").innerText = chrome.i18n.getMessage("dropFileHere");
  document.querySelector(".dnd-instructions").innerText = chrome.i18n.getMessage("orDragAndDrop");
};

var showError = function(errorData) {
  overlay.classList.remove('visible');

  error.style.display = "block";
  error.innerHTML = "<h1>" + chrome.i18n.getMessage("somethingWentWrong") + "</h1>";
  error.innerHTML += "<p>" + chrome.i18n.getMessage("mailSupportWithErrorMessage") + "</p>";
  error.innerHTML += "<p>" + chrome.i18n.getMessage("errorMessage") + ": <br />";
  error.innerHTML += errorData.headers.join("<br/>") + "<br/>" +
                     chrome.i18n.getMessage("status") + ": " + errorData.status + " " + errorData.statusText + "<br/>" +
                     "</p>";

  chrome.storage.sync.get(KEYS.PRINTER_URL, function(items) {
    var printer_url = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
    var innerError = error.querySelector(".container-inner");
    innerError.innerHTML += "<p>" + chrome.i18n.getMessage("systemInformation") + ":<br/>";
    innerError.innerHTML += "Chrome Extension Version: " + chrome.app.getDetails().version + "<br />";
    innerError.innerHTML += chrome.i18n.getMessage("time") + ": " + new Date() + "<br />";
    innerError.innerHTML += "URL: " + printer_url;
    innerError.innerHTML += "</p>";
  });

  error.innerHTML = '<div class="container-inner">' + error.innerHTML  + '</div>';
};

var showUploading = function() {
  overlay.classList.remove('visible');

  container.innerHTML = '<h1 class="uploading">Laddar upp</h1>';
  var spinner = new Spinner({
    lines  : 9,     // The number of lines to draw
    length : 3,     // The length of each line
    width  : 2,     // The line thickness
    radius : 5,     // The radius of the inner circle
    color  : '#000000', // #rbg or #rrggbb
    speed  : 1.5,    // Rounds per second
    trail  : 74,     // Afterglow percentage
    shadow : false,   // Whether to render a shadow
    className: 'spinner'
  }).spin();
  container.appendChild(spinner.el);
};
