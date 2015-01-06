
'use strict';

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
        }
    });

  // Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-crx');

grunt.registerTask('default', ['myPublicPackage']);

};





