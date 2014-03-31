
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
