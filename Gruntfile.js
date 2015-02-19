
'use strict';

var Busboy = require('busboy');

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        manifest: grunt.file.readJSON('chrome-scrive-extension/manifest.json'),
        concat: {
          ScriveChromeContentScriptAll: {
            src:["chrome-scrive-extension/common/ScriveMain.js",
                 "chrome-scrive-extension/common/ScrivePlatform.js",
                 "chrome-scrive-extension/common/ScriveLogUtils.js",
                 "chrome-scrive-extension/chrome/ScriveChromeLogger.js",
                 "chrome-scrive-extension/chrome/ScriveChromei18n.js",
                 "chrome-scrive-extension/chrome/ScriveChromeLocalStore.js",
                 "chrome-scrive-extension/chrome/ScriveChromeBrowserUtils.js",
                 "chrome-scrive-extension/chrome/ScriveChromeHttpRequest.js",
                 "chrome-scrive-extension/common/ScriveContentScript.js",
                 "chrome-scrive-extension/libs/enc-base64.js",
                 "chrome-scrive-extension/libs/mixpanel_init.js",
                 "chrome-scrive-extension/show_error.js",
                 "chrome-scrive-extension/common/ScrivePopup.js",
                 "chrome-scrive-extension/chrome/ScriveChromeInit.js"],
            dest: 'chrome-scrive-extension/ScriveChromeContentScriptAll.js'
          },
          ScriveIEContentScriptAll: {
            src:["chrome-scrive-extension/common/ScriveMain.js",
              "chrome-scrive-extension/common/ScrivePlatform.js",
              "chrome-scrive-extension/common/ScriveLogUtils.js",
              "chrome-scrive-extension/ie/ScriveIELogger.js",
              "chrome-scrive-extension/ie/ScriveIEi18n.js",
              "chrome-scrive-extension/ie/ScriveIELocalStore.js",
              "chrome-scrive-extension/ie/ScriveIEBrowserUtils.js",
              "chrome-scrive-extension/ie/ScriveIEHttpRequest.js",
              "chrome-scrive-extension/common/ScriveContentScript.js",
              "chrome-scrive-extension/libs/enc-base64.js",
              "chrome-scrive-extension/libs/mixpanel_init.js",
              "chrome-scrive-extension/show_error.js",
              "chrome-scrive-extension/common/ScrivePopup.js",
              "chrome-scrive-extension/ie/ScriveIEInit.js"],
            dest: 'chrome-scrive-extension/ScriveIEContentScriptAll.js'
          }
        },
        crx: {
            ScriveCrx: {
                "privateKey": "chrome-scrive-extension.pem",
                "src": "chrome-scrive-extension/",
                "dest": "output/<%= pkg.name %>-<%= manifest.version %>-dev.crx"
            }
        },
        connect: {
            IEServer: {
              hostname: 'localhost',
              options: {
                port: 8383,
                base: 'chrome-scrive-extension'
              }
            },
            TestServer: {
                hostname: 'localhost',
                options: {
                    port: 8282,
                    base: 'tests',
                    keepalive: true,
                    middleware: function(connect, options, middlewares) {
                        function myMiddleware(req, res, next) {
                            if( req.method=="POST" ) {
                                var busboy = new Busboy({ headers: req.headers });
                                var isValid = false;
                                busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                                    file.on('data', function(data) {
                                    });
                                    file.on('end', function() {
                                    });
                                });
                                busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
                                    if( fieldname=='a_variable' && val=='a_value' ) {
                                        // We expect a variable to be present
                                        isValid = true;
                                    }
                                });
                                busboy.on('finish', function() {
                                    if( isValid ) {
                                        res.writeHead(303, { Connection: 'close', Location: '/sales_contract.pdf' });
                                        res.end();
                                    }
                                    else {
                                        res.writeHead(404, { Connection: 'close', 'Content-type': 'text/plain; charset=utf-8', 'Cache-control': 'no-cache' });
                                        res.end('Your POST request should have \'a_variable\' with \'a_value\'. Then you would be let through.');
                                    }
                                });
                                req.pipe(busboy);
                            }
                            else {
                                next();
                            }
                        };
                        middlewares.unshift(myMiddleware);
                        return middlewares;
                    }
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['concat','crx']);
};





