/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />

interface HttpHeader {
  name: string;
  value?: string;
  binaryValue?: any;
};

interface SavedRequest {
  method: string;
  type: string;
  formData?: FormData;
  responseHeaders?: HttpHeader[];
  timeStamp: number;
  tabId: number;
};

interface ScriveBackgroundPage extends Window
{
    savedDataForRequests : { [x:string]: SavedRequest };
};

/*
 * Here we try to keep all requests that are coming so that we can
 * redo them again with XMLHttpRequest using proper method, POST
 * parameters, headers and whatnot to get the same results.
 *
 * This data should be deleted whenever a frame with this data is
 * closed or the frame gets another content.
 */
var savedDataForRequests : { [x:string]: SavedRequest } = {};

function cleanupOldSavedDataForRequests():void
{
  /*
   * So that the cache does not grow beyong imagination we keep at
   * most 50 last requests.
   */
  var timeStamp;
  var url;
  while( Object.keys(savedDataForRequests).length >50 ) {
    // need to find oldest object
    timeStamp = undefined;
    url = undefined;
    for(var p in savedDataForRequests) {
      if(savedDataForRequests.hasOwnProperty(p)) {
        var v = savedDataForRequests[p];
        if( !timeStamp || timeStamp>v.timeStamp ) {
          timeStamp = v.timeStamp;
          url = p;
        }
      }
    }
    if( url ) {
      delete savedDataForRequests[url];
    }
    else {
      console.log("cleanupOldSavedDataForRequests: infinite loop");
    }
  }
}

var webRequestFilter : chrome.webRequest.RequestFilter = { urls: ["http://*/*","https://*/*"],
                         //types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
                         types: ["main_frame", "object", "sub_frame"]
                       };


// uploadData has the form:
//
// For each key contains the list of all values for that key. If the
// data is of another media type, or if it is malformed, the
// dictionary is not present. An example value of this dictionary is
// {'key': ['value1', 'value2']}.
//
// Note that this is something else than thing called UploadData

function uploadDataToFormData( uploadData : { [x:string]: string[] }[] ) : FormData
{
  var formData = new FormData();
  for(var k in uploadData) {
    for(var i in uploadData[k]) {
      formData.append(k, uploadData[k][i]);
    }
  }
  return formData;
}

chrome.webRequest.onBeforeRequest.addListener(function(info : chrome.webRequest.OnBeforeRequestDetails) {
    if( (info.method=="POST" || info.method=="GET") && info.tabId >=0 ) {
        savedDataForRequests[info.url] = { formData: (info.requestBody && info.requestBody.formData)
                                              ? uploadDataToFormData(info.requestBody.formData) : undefined,
                                           timeStamp: info.timeStamp,
                                           method: info.method,
                                           type: info.type,
                                           tabId: info.tabId
                                         };
    }
}, webRequestFilter, ["requestBody"]);

chrome.webRequest.onHeadersReceived.addListener(function(info : chrome.webRequest.OnHeadersReceivedDetails) {
    if( (info.method=="POST" || info.method=="GET") && info.tabId >=0 ) {
        var obj = savedDataForRequests[info.url];
        if( obj ) {
            obj.responseHeaders = <HttpHeader[]>info.responseHeaders;
        }
    }
  cleanupOldSavedDataForRequests();
}, webRequestFilter, ["responseHeaders"]);


var webRequestFilter2 : chrome.webRequest.RequestFilter = { urls: ["http://*/*","https://*/*"],
                          types: ["xmlhttprequest"]
                        };

chrome.webRequest.onErrorOccurred.addListener(function(info:chrome.webRequest.OnErrorOccurredDetails) {
  if( info.tabId && info.tabId>=0 ) {
    var message = { type: "xmlhttprequesterror",
                    error: info.error,
                    method: info.method,
                    url: info.url,
                    ip: info.ip };
    chrome.tabs.sendMessage(info.tabId, message, function() {});
  }
}, webRequestFilter2);

chrome.windows.getCurrent({},function(w) {
    if( w ) {
        var mainwindow = w.id;
        chrome.windows.onCreated.addListener(function(w) {
            if(w && w.type == "popup" ) {
                chrome.windows.get(w.id,{populate:true}, function(w) {
                    if(w) {
                        var tab = w.tabs[0];
                        /*
                         * Do not mess with windows that are not
                         * normal urls. Leave firebug, chrome etc
                         * alone.
                         */
                        if( tab.url && (tab.url.substring(0,4)=="http" || tab.url.substring(0,4)=="file")) {
                            /*
                             * Would be nice to position this tab just
                             * after the tab that opened this popup.
                             * Seems openerTabId is not reliable, for
                             * pupos is never present. Ooops.
                             */
                            var openerTabId = tab.openerTabId;
                            if( openerTabId ) {
                                chrome.tabs.get(openerTabId, function(t) {
                                var index = -1;
                                    if( t ) {
                                        index = t.index + 1;
                                    }
                                    chrome.tabs.move(tab.id,{windowId:mainwindow,index:index},function() {
                                        chrome.tabs.update(tab.id,{active:true});
                                    });
                                });
                            }
                            else {
                                chrome.tabs.move(tab.id,{windowId:mainwindow,index:-1},function() {
                                    chrome.tabs.update(tab.id,{active:true});
                                });
                            }
                        }
                    }
                });
            }
        });

        /*
         * We are tracking here what was the last normal window before
         * the popup opened. We might want to use
         * 'chrome.windows.getLastFocused()' instead. Check it out
         * later.
         */
        chrome.windows.onFocusChanged.addListener(function(w) {
            if( w ) {
                chrome.windows.get(w,{},function(w) {
                    if( w && w.type == "normal") {
                        mainwindow = w.id;
                    }
                });
            }
        });
    }
});
