
'use strict';

var Busboy = require('busboy');

module.exports = function (grunt) {

  grunt.initConfig({
    'http-server': {
      'tests': {

        // the server root directory
        root: "tests",
        port: 8282,
        // port: function() { return 8282; }
        host: "127.0.0.1",
        // cache: <sec>,
        showDir : true,
        autoIndex: true,
        // server default file extension
        ext: "html",
        // run in parallel with other tasks
        runInBackground: false
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
};
