/// <reference path="chrome.d.ts" />
/// <reference path="chrome-app.d.ts" />
/// <reference path="constants.ts" />
;

;

;

chrome.browserAction.onClicked.addListener( function ( tab ) {
  chrome.tabs.executeScript( tab.id, {
    code: "Scrive.Popup.toggleDiv()"
  } );
} );

chrome.runtime.onMessage.addListener( function ( request, sender, sendResponse ) {
  console.log( request.type );

  if ( request.type == "savedDataForRequest" ) sendResponse( {
    savedData: savedDataForRequests[ request.url ]
  } );

} );


/*
 * Here we try to keep all requests that are coming so that we can
 * redo them again with XMLHttpRequest using proper method, POST
 * parameters, headers and whatnot to get the same results.
 *
 * This data should be deleted whenever a frame with this data is
 * closed or the frame gets another content.
 */
var savedDataForRequests = {};

function cleanupOldSavedDataForRequests() {
  /*
   * So that the cache does not grow beyong imagination we keep at
   * most 50 last requests.
   */
  var timeStamp;
  var url;
  while ( Object.keys( savedDataForRequests ).length > 1000 ) {
    // need to find oldest object
    timeStamp = undefined;
    url = undefined;
    for ( var p in savedDataForRequests ) {
      if ( savedDataForRequests.hasOwnProperty( p ) ) {
        var v = savedDataForRequests[ p ];
        if ( !timeStamp || timeStamp > v.timeStamp ) {
          timeStamp = v.timeStamp;
          url = p;
        }
      }
    }
    if ( url ) {
      delete savedDataForRequests[ url ];
    } else {
      console.log( "cleanupOldSavedDataForRequests: infinite loop" );
    }
  }
}

var webRequestFilter = {
  urls: [ "http://*/*", "https://*/*" ],
  //types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
  types: [ "main_frame", "object", "sub_frame", "image", "other" ]
};

chrome.webRequest.onBeforeRequest.addListener( function ( info ) {
  savedDataForRequests[ info.url ] = {
    formData: ( info.requestBody && info.requestBody.formData ) ? info.requestBody.formData : undefined,
    timeStamp: info.timeStamp,
    method: info.method,
    type: info.type,
    tabId: info.tabId
  };
}, webRequestFilter, [ "requestBody" ] );

chrome.webRequest.onHeadersReceived.addListener( function ( info ) {
  var obj = savedDataForRequests[ info.url ];
  if ( obj ) {
    obj.responseHeaders = info.responseHeaders;
  }
  cleanupOldSavedDataForRequests();
}, webRequestFilter, [ "responseHeaders" ] );

var webRequestFilter2 = {
  urls: [ "http://*/*", "https://*/*" ],
  types: [ "xmlhttprequest" ]
};

chrome.webRequest.onErrorOccurred.addListener( function ( info ) {
  if ( info.tabId && info.tabId >= 0 ) {
    var message = {
      type: "xmlhttprequesterror",
      error: info.error,
      method: info.method,
      url: info.url,
      ip: info.ip
    };
    chrome.tabs.sendMessage( info.tabId, message, function () {} );
  }
}, webRequestFilter2 );

chrome.windows.getCurrent( {}, function ( w ) {
  if ( w ) {
    var mainwindow = w.id;
    chrome.windows.onCreated.addListener( function ( w ) {
      if ( w && w.type == "popup" ) {
        chrome.windows.get( w.id, {
          populate: true
        }, function ( w ) {
          if ( w ) {
            var tab = w.tabs[ 0 ];

            /*
             * Do not mess with windows that are not
             * normal urls. Leave firebug, chrome etc
             * alone.
             */
            if ( tab.url && ( tab.url.substring( 0, 4 ) == "http" || tab.url.substring( 0, 4 ) == "file" ) ) {
              /*
               * Would be nice to position this tab just
               * after the tab that opened this popup.
               * Seems openerTabId is not reliable, for
               * pupos is never present. Ooops.
               */
              var openerTabId = tab.openerTabId;
              if ( openerTabId ) {
                chrome.tabs.get( openerTabId, function ( t ) {
                  var index = -1;
                  if ( t ) {
                    index = t.index + 1;
                  }
                  chrome.tabs.move( tab.id, {
                    windowId: mainwindow,
                    index: index
                  }, function () {
                    chrome.tabs.update( tab.id, {
                      active: true
                    } );
                  } );
                } );
              } else {
                chrome.tabs.move( tab.id, {
                  windowId: mainwindow,
                  index: -1
                }, function () {
                  chrome.tabs.update( tab.id, {
                    active: true
                  } );
                } );
              }
            }
          }
        } );
      }
    } );

    /*
     * We are tracking here what was the last normal window before
     * the popup opened. We might want to use
     * 'chrome.windows.getLastFocused()' instead. Check it out
     * later.
     */
    chrome.windows.onFocusChanged.addListener( function ( w ) {
      if ( w ) {
        chrome.windows.get( w, {}, function ( w ) {
          if ( w && w.type == "normal" ) {
            mainwindow = w.id;
          }
        } );
      }
    } );
  }
} );