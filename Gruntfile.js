
'use strict';

var Busboy = require('busboy');

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        manifest: grunt.file.readJSON('chrome-scrive-extension/manifest.json'),
        crx: {
            myPublicPackage: {
                "privateKey": "chrome-scrive-extension.pem",
                "src": "chrome-scrive-extension/",
                "dest": "output/<%= pkg.name %>-<%= manifest.version %>-dev.crx"
            }
        },
        connect: {
            server: {
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
                                    //console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
                                    file.on('data', function(data) {
                                        //console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
                                    });
                                    file.on('end', function() {
                                        //console.log('File [' + fieldname + '] Finished');
                                    });
                                });
                                busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
                                    //console.log('Field [' + fieldname + ']: value: ' + val);
                                    if( fieldname=='a_variable' && val=='a_value' ) {
                                        // We expect a variable to be present
                                        isValid = true;
                                    }
                                });
                                busboy.on('finish', function() {
                                    //console.log('Done parsing form!');
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

  // Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-crx');

grunt.registerTask('default', ['myPublicPackage']);

};





