
if (Scrive && Scrive.Settings)
  document.addEventListener( "DOMContentLoaded", Scrive.Settings.init );

function executeScriptCallback( results ) {
  //The result of a script is the last expression being evaluated. results is actually an array
  //https://developer.chrome.com/extensions/tabs#method-executeScript
  var message = "executeScript: ";
  if (results === undefined) {
    if (chrome.extension.lastError){
      message += chrome.extension.lastError.message;
      //if (errorMsg == "Cannot access a chrome:// URL"){}
    }
  }
  else
  {
    //for (i = 0; i < result.length; i++)
    message += results  + results.length + " times" ;
  }

  console.log(message);
};


var injectIntoTab = function (tab) {
  chrome.tabs.executeScript(
      tab.id, {
      file: "ScriveChromeContentScriptAllUpdate.js"
      },
      executeScriptCallback
  );
  chrome.tabs.insertCSS(tab.id, {
    file: "css/popup.css"
  });
}

chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason == "update" || details.reason == "install") {

    // Get all windows
    chrome.windows.getAll({
      populate: true
    }, function (windows) {
      var i = 0, w = windows.length, currentWindow;
      for( ; i < w; i++ ) {
        currentWindow = windows[i];
        var j = 0, t = currentWindow.tabs.length, currentTab;
        for( ; j < t; j++ ) {
          currentTab = currentWindow.tabs[j];
          // Skip some urls
          if( ! currentTab.url.match(/(chrome.*):\/\//gi) ) {
            injectIntoTab(currentTab);
          }
        }
      }
    });
  }
});

function checkStatus(tab)
{
  var pingBack =
    "chrome.runtime.onMessage.addListener( function(msg, sender, sendResponse) {"
    + "if (msg.text && (msg.text == 'Scrive_status_report')) { "
    +  " sendResponse(  document.documentElement.getAttribute( '_scriveloaded' ) );"
    +  "} });'Scrive pingBack command was executed ';";

  chrome.tabs.executeScript(
      tab.id, {
      code: pingBack
      },
      executeScriptCallback
  );

  chrome.tabs.sendMessage(tab.id, { text: "Scrive_status_report" },
    function (status) {
      console.log("Status of Scrive: " + status);

      if (status === undefined)
        ;//chrome.tabs.update(tab.id, {url: "/html/direct_upload.html"});
      else if (status === null)
        injectIntoTab(tab);
      else {
        chrome.tabs.executeScript(tab.id, {
          code: "Scrive.Popup.toggleDivBookmarklet()"
        });
      }
    }
  );
}

chrome.browserAction.onClicked.addListener( function ( tab ) {

  // we notify user
  if( tab.url.match(/(chrome.*):\/\//gi) ) {
    alert(chrome.i18n.getMessage( "noSigning" ));
  }
  else if( tab.url.match(/(about):/gi) ) {
    alert(chrome.i18n.getMessage( "noSigning" ));
  }
  else if( tab.url.match(/(file):\/\//gi) ) {

    chrome.extension.isAllowedFileSchemeAccess(function(isAllowedAccess) {
      if (isAllowedAccess) {
        checkStatus(tab);
      }
      else {
        alert(chrome.i18n.getMessage( "allowFileURLsMessage" ));
        chrome.tabs.create({
          url: 'chrome://extensions/?id=' + chrome.runtime.id
        });
      }
    });
  }
  else {
    checkStatus(tab);
  }
} );

chrome.runtime.onMessage.addListener( function ( request, sender, sendResponse ) {
  console.log( request.type );

  if ( request.type == "savedDataForRequest" ) sendResponse( {
    savedData: savedDataForRequests[ request.url ]
  } );

  if ( request.type == "alertPage" ) {
    alert(request.message);
    sendResponse();
  }

  if ( request.type == "savedHTMLPage" ) {
    chrome.tabs.query(
        {currentWindow: true, active: true},
        function(tabArray) {
          if (tabArray && tabArray[0]) {
            chrome.pageCapture.saveAsMHTML({tabId: tabArray[0].id}, function (mhtml) {

              //remember to free this url resource with - window.webkitURL.revokeObjectURL(url);
              var url = window.webkitURL.createObjectURL(mhtml);
              console.log(url);

              chrome.tabs.sendMessage(tabArray[0].id, { type: 'savedHTMLPage', savedData: url });

            });
          }
        }
    );
  }
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

var timeTolerance = 2*1000; // 2sec

chrome.webRequest.onBeforeRequest.addListener( function ( info ) {

  var storeData = false;
  var savedData = savedDataForRequests[ info.url ];
  var formData = ( info.requestBody && info.requestBody.formData ) ? info.requestBody.formData : undefined;

  if ( savedData )
  {
    var deltaTime = info.timeStamp - savedData.timeStamp;

    // Always update on formData and never override it
    if ( formData || ( deltaTime > timeTolerance && !savedData.formData) ) {
      storeData = true;
    }
  }
  else
    storeData = true;

  if (storeData) {
    savedDataForRequests[ info.url ] = {
      formData: formData,
      timeStamp: info.timeStamp,
      method: info.method,
      type: info.type,
      tabId: info.tabId
    };
  }
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
      //avoiding window id -1
      if ( w && w >= 0) {
        chrome.windows.get( w, {}, function ( w ) {
          if ( w && w.type == "normal" ) {
            mainwindow = w.id;
          }
        } );
      }
    } );
  }
} );
