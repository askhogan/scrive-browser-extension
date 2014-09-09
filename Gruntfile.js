
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
    }
  });

  grunt.loadNpmTasks('grunt-http-server');
}
