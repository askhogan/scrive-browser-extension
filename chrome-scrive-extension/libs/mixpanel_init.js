//http://beletsky.net/2014/05/using-mixpanel-analytics-from-chrome-extensions.html
//https://mixpanel.com/help/reference/http#tracking-via-http
Scrive.Mixpanel = new function() {

    var api = 'https://api.mixpanel.com';
    var mixtoken;
    var mixid;

    this.init = function(token, id) {
        mixtoken = token;
        mixid = id;
    };

    this.errorCallback = function (errorData) {
        console.log("MixPanel:"+
                "\nUrl: " + errorData.url +
                "\nResponse: " + errorData.response +
                "\nHeaders: " + errorData.headers.join(" ") +
                "\nStatus: " + errorData.status +
                "\nStatusText: " + errorData.statusText
        );
    };

    this.get = function (request, errorCallback) {
        var getpdfXHR = new XMLHttpRequest();
        getpdfXHR.onload = function () {
            if (getpdfXHR.status >= 200 && getpdfXHR.status <= 299) {
                ;//Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
            } else {
                Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
            }
        };
        getpdfXHR.onerror = function () {
            Scrive.ContentScript.errorCallbackFromXMLHttpRequest(request.url, errorCallback, this);
        };

        getpdfXHR.open(request.method, request.url);
        getpdfXHR.send();
    };

    this.track = function(event , content) {
        var payload = {
            event: event,
            properties: {
                distinct_id: mixid,
                token: mixtoken,
                content: content            //EKI we have to check the structure in Mixpanel for this one
//                browser: mixpanel.browser.name
            }
        };

        //http://stackoverflow.com/questions/2820249/base64-encoding-and-decoding-in-client-side-javascript
        var data = window.btoa(JSON.stringify(payload));
        var url = api + '/track?data=' + data;

        //make a request
        this.get({method:"GET", url:url}, this.errorCallback);
    };
};

Scrive.Mixpanel.init("1d1d5acac1631a77d88144f26c1fb45d");
