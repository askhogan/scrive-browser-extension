/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="oauth.ts" />
// Used only in options.html to initialize current options and save when pressing the save button.

Scrive.Options = new function() {
    var form = document.querySelector('#form');
    var urlInput = document.querySelector('#url');
    var clientIdInput = document.querySelector('#client_id');
    var clientSecretInput = document.querySelector('#client_secret');
    var tokenIdInput = document.querySelector('#token_id');
    var tokenSecretInput = document.querySelector('#token_secret');
    var saveButton = document.querySelector('.button.save');
    var oauthButton = document.querySelector('.button.oauth');
    var gotoListOfJobs = document.querySelector('.goto-list-of-jobs');

    //EKI - these are important
    var client_id = "51bf4005f676fa35_234";
    var client_secret = "f1cbf80661761d67";
    var initiate_endpoint = "https://scrive.com/oauth/temporarycredentials";
    var authorize_endpoint = "https://scrive.com/oauth/authorization";
    var token_endpoint = "https://scrive.com/oauth/tokencredentials";
    ////Mockup:
    //var initiate_endpoint = "https://dev.scrive.com/oauth/temporarycredentials";
    //var authorize_endpoint = "https://dev.scrive.com/oauth/authorization";
    //var token_endpoint = "https://dev.scrive.com/oauth/tokencredentials";

    this.init = function() {

        form.addEventListener('submit', function () {
            return false;
        });
        saveButton.addEventListener('click', this.save_options);
        oauthButton.addEventListener('click', this.oauth_authorize);
//        document.addEventListener('DOMContentLoaded', this.restore_options);
//        document.addEventListener('DOMContentLoaded', this.translate_ui);
        this.restore_options();
        this.translate_ui();
        gotoListOfJobs.addEventListener('click', this.goto_list_of_jobs);

        document.addEventListener('DOMContentLoaded', function () {
            OAuth.handleCallback({
                "initiate_endpoint": initiate_endpoint,
                "authorize_endpoint": authorize_endpoint,
                "token_endpoint": token_endpoint,
                "client_id": client_id,
                "client_secret": client_secret,
                "onload": function (cred) {
                    // oauth_token, oauth_token_secret
                    var obj = {};
                    obj[KEYS.OAUTH_TOKEN_ID] = cred.oauth_token;
                    obj[KEYS.OAUTH_TOKEN_SECRET] = cred.oauth_token_secret;
                    obj[KEYS.OAUTH_CLIENT_ID] = client_id;
                    obj[KEYS.OAUTH_CLIENT_SECRET] = client_secret;
                    chrome.storage.sync.set(obj, function () {
                        /*
                         * Drop 'oauth_token' and 'oauth_verifier'.
                         */
                        window.location.href = (window.location + "").split("?")[0];
                    });
                }
            });
        });
    };

    this.goto_list_of_jobs = function() {
        var url = urlInput.value;

        var clientId = clientIdInput.value;
        var clientSecret = clientSecretInput.value;
        var tokenId = tokenIdInput.value;
        var tokenSecret = tokenSecretInput.value;

        var oauthComponents = [
            "oauth_signature_method=\"PLAINTEXT\"",
                "oauth_consumer_key=\"" + clientId + "\"",
                "oauth_token=\"" + tokenId + "\"",
                "oauth_signature=\"" + clientSecret + "&" + tokenSecret + "\""];

        var oauthHeader = "OAuth " + oauthComponents.join(",");

        url = url.replace("/printer", "/authlogin");
        url = url + "?authorization=" + encodeURIComponent(oauthHeader);
        window.open(url, '_blank');

        return false;
    };

    this.save_options = function() {
        var obj = {};
        obj[KEYS.PRINTER_URL] = urlInput.value;
        obj[KEYS.OAUTH_CLIENT_ID] = clientIdInput.value;
        obj[KEYS.OAUTH_CLIENT_SECRET] = clientSecretInput.value;
        obj[KEYS.OAUTH_TOKEN_ID] = tokenIdInput.value;
        obj[KEYS.OAUTH_TOKEN_SECRET] = tokenSecretInput.value;
        chrome.storage.sync.set(obj, function () {
            var oldButtonText = saveButton.innerText;
            saveButton.innerText = chrome.i18n.getMessage("saved");
            setTimeout(function () {
                saveButton.innerText = oldButtonText;
            }, 2500);
        });

        return false;
    };

    this.translate_ui = function() {
        document.querySelector('#options-header').innerText = chrome.i18n.getMessage("options");
        document.querySelector('.button.save .label').innerText = chrome.i18n.getMessage("save");
        document.querySelector('#url-label').innerText = chrome.i18n.getMessage("printerUrlOptionLabel");
        document.querySelector('#oauth-instructions').innerText = chrome.i18n.getMessage("oauthInstructions");
        document.querySelector('title').innerText = chrome.i18n.getMessage("options");
        document.querySelector('.goto-list-of-jobs').innerText = chrome.i18n.getMessage("gotoListOfJobs");
};

    this.restore_options = function() {
        chrome.storage.sync.get([
            KEYS.PRINTER_URL,
            KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
            KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET], function (items) {
            urlInput.value = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
            clientIdInput.value = items[KEYS.OAUTH_CLIENT_ID] || "";
            clientSecretInput.value = items[KEYS.OAUTH_CLIENT_SECRET] || "";
            tokenIdInput.value = items[KEYS.OAUTH_TOKEN_ID] || "";
            tokenSecretInput.value = items[KEYS.OAUTH_TOKEN_SECRET] || "";
        });
        return false;
    };

    this.oauth_authorize = function() {
        OAuth.authorize({
            "initiate_endpoint": initiate_endpoint,
            "authorize_endpoint": authorize_endpoint,
            "token_endpoint": token_endpoint,
            "client_id": client_id,
            "client_secret": client_secret,
            "privileges": "DOC_CREATE+DOC_CHECK+DOC_SEND"
        });
    };
};

Scrive.Options.init();