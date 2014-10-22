/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
/// <reference path="oauth.ts" />
// Used only in options.html to initialize current options and save when pressing the save button.

//debugger;
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
//            var obj = {};
//            obj[KEYS.OAUTH_TOKEN_ID] = cred.oauth_token;
//            obj[KEYS.OAUTH_TOKEN_SECRET] = cred.oauth_token_secret;
//            obj[KEYS.OAUTH_CLIENT_ID] = client_id;
//            obj[KEYS.OAUTH_CLIENT_SECRET] = client_secret;
                    //EKI this was a copy/paste issue;) - now everything works as expected
//                    Scrive.Platform.LocalStore.put(KEYS.PRINTER_URL, );
                    Scrive.Platform.LocalStore.put(KEYS.OAUTH_CLIENT_ID, client_id);
                    Scrive.Platform.LocalStore.put(KEYS.OAUTH_CLIENT_SECRET,client_secret );
                    Scrive.Platform.LocalStore.put(KEYS.OAUTH_TOKEN_ID, cred.oauth_token);
                    Scrive.Platform.LocalStore.put(KEYS.OAUTH_TOKEN_SECRET, cred.oauth_token_secret);


                    //EKI fix this
//            chrome.storage.sync.set(obj, function () {
//                /*
//                * Drop 'oauth_token' and 'oauth_verifier'.
//                */
                window.location.href = (window.location + "").split("?")[0];
//            });
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
//    var obj = {};
//    obj[KEYS.PRINTER_URL] = urlInput.value;
//    obj[KEYS.OAUTH_CLIENT_ID] = clientIdInput.value;
//    obj[KEYS.OAUTH_CLIENT_SECRET] = clientSecretInput.value;
//    obj[KEYS.OAUTH_TOKEN_ID] = tokenIdInput.value;
//    obj[KEYS.OAUTH_TOKEN_SECRET] = tokenSecretInput.value;
//    //EKI fix this
//    chrome.storage.sync.set(obj, function () {
//        var oldButtonText = saveButton.innerText;
//        saveButton.innerText = chrome.i18n.getMessage("saved");
//        setTimeout(function () {
//            saveButton.innerText = oldButtonText;
//        }, 2500);
//    });
        //Mockup:

        Scrive.LogUtils.debug("Scrive.Options.save_options: \n" +
            "\n urlInput.value = " + urlInput.value +
            "\n clientIdInput.value = " + clientIdInput.value +
            "\n clientSecretInput.value = " + clientSecretInput.value +
            "\n tokenIdInput.value = " + tokenIdInput.value +
            "\n tokenSecretInput.value = " + tokenSecretInput.value +
            "");

        //EKI save key by key, we can also add a method to sync an object if desired
        Scrive.Platform.LocalStore.put(KEYS.PRINTER_URL, urlInput.value);
        Scrive.Platform.LocalStore.put(KEYS.OAUTH_CLIENT_ID, clientIdInput.value);
        Scrive.Platform.LocalStore.put(KEYS.OAUTH_CLIENT_SECRET, clientSecretInput.value);
        Scrive.Platform.LocalStore.put(KEYS.OAUTH_TOKEN_ID, tokenIdInput.value);
        Scrive.Platform.LocalStore.put(KEYS.OAUTH_TOKEN_SECRET, tokenSecretInput.value);

        var oldButtonText = saveButton.innerText;

        saveButton.innerText = "Saved";
        setTimeout(function () {
            saveButton.innerText = oldButtonText;
        }, 2500);


        return false;
    };

    this.translate_ui = function() {
//EKI fix this - localization is not in place yet
//    document.querySelector('#options-header').innerText = chrome.i18n.getMessage("options");
//    document.querySelector('.button.save .label').innerText = chrome.i18n.getMessage("save");
//    document.querySelector('#url-label').innerText = chrome.i18n.getMessage("printerUrlOptionLabel");
//    document.querySelector('#oauth-instructions').innerText = chrome.i18n.getMessage("oauthInstructions");
//    document.querySelector('title').innerText = chrome.i18n.getMessage("options");
//    document.querySelector('.goto-list-of-jobs').innerText = chrome.i18n.getMessage("gotoListOfJobs");
//  Mockup:
        document.querySelector('#options-header').innerText = "Options";
        document.querySelector('.button.save .label').innerText = "Save";
        document.querySelector('#url-label').innerText = "URL to print to";
        document.querySelector('#oauth-instructions').innerText = "To get started with Scrive Print to E-sign, you must authenticate to Scrive. Press the button to start.";
        document.querySelector('title').innerText = "Options";
        document.querySelector('.goto-list-of-jobs').innerText = "Go to list of jobs";
    };

    this.restore_options = function() {
        //EKI Fix this
//    chrome.storage.sync.get([
//        KEYS.PRINTER_URL,
//        KEYS.OAUTH_CLIENT_ID, KEYS.OAUTH_CLIENT_SECRET,
//        KEYS.OAUTH_TOKEN_ID, KEYS.OAUTH_TOKEN_SECRET], function (items) {
//        urlInput.value = items[KEYS.PRINTER_URL] || DEFAULTS.PRINTER_URL;
//        clientIdInput.value = items[KEYS.OAUTH_CLIENT_ID] || "";
//        clientSecretInput.value = items[KEYS.OAUTH_CLIENT_SECRET] || "";
//        tokenIdInput.value = items[KEYS.OAUTH_TOKEN_ID] || "";
//        tokenSecretInput.value = items[KEYS.OAUTH_TOKEN_SECRET] || "";
//    });

        urlInput.value = Scrive.Platform.LocalStore.get(KEYS.PRINTER_URL);
        clientIdInput.value = Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_ID);
        clientSecretInput.value = Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_SECRET);
        tokenIdInput.value = Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_ID);
        tokenSecretInput.value = Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_SECRET);

        Scrive.LogUtils.debug("Scrive.Options.restore_option: \n" +
            "\nurlInput.value = " + Scrive.Platform.LocalStore.get(KEYS.PRINTER_URL) +
            "\nclientIdInput.value = " + Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_ID)+
            "\nclientSecretInput.value = " + Scrive.Platform.LocalStore.get(KEYS.OAUTH_CLIENT_SECRET)+
            "\ntokenIdInput.value = " + Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_ID)+
            "\ntokenSecretInput.value = " + Scrive.Platform.LocalStore.get(KEYS.OAUTH_TOKEN_SECRET)+
            "");

//  Mockup
//        urlInput.value = "http://vm-dev.scrive.com:12345/printer";
//        clientIdInput.value = "51bf4005f676fa35_234";
//        clientSecretInput.value = "f1cbf80661761d67";
//        tokenIdInput.value = "8204118504a23537_1526";
//        tokenSecretInput.value = "8db141e00e14ed13";

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