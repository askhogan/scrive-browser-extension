
'use strict';


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
        port: 8282,
        hostname: 'localhost',
        base: 'tests',
        middleware: function(connect, options) {
          // var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
          return [
            // Include the proxy first
            // proxy,
            // Serve static files.
            connect.static(options.base),
            // Make empty directories browsable.
            connect.directory(options.base)
          ];
        }
      },
      proxies: []
    }
  });

  grunt.loadNpmTasks('grunt-connect');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-http-server');
};
