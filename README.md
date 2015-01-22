
Scrive browser extension
=================================
###Components:

  **1.** Chrome extension
  
  **2.** Internet explorer extension
  
  **3.** Client-side files (Javascript, HTML, Css, json, etc..)
  <br><br>
 ---
  <br>
**Dependencies:** 1 & 2 depend on and share large part of the 3.

**Modus operandi:** 1 & 2 are loading(injecting) 3 inside of currently visited web page of a web browser.

**Packaging:** 1 & 3 are bundled and deployed within the same package<BR>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
while for 2, 3 needs to be hosted on a external web server.
<br>
---
###Build process

#####1. Chrome extension
 - Prerequisites: nodejs, grunt, grunt-cli, grunt-crx, node-rsa
 - Version: update "/chrome-scrive-extension/manifest.json"
 - Build command: grunt crx
 - Windows: use Cygwin
    
#####2. Internet explorer extension
 - Prerequisites: Visual Studio 2010, Microsoft Windows platform SDK
 - Version: update "internet-explorer-plugin/ScriveBHO/ScriveBHO.rc" and
             "internet-explorer-plugin/ScriveSetup/ScriveSetup.vdproj"
 - Build command: Open "ScriveBHO.sln" in VS2010 and execute build command.

    We will need to automate this build process with grunt.
    For IE we need a Windows based machine.


###Deploy process

#####1. Chrome extension
 - Deploy new CRX package from "/output/scrive-browser-extension-<VERSION>-dev.crx"

#####2. Internet explorer extension
 - Deploy new MSI setup package from "/internet-explorer-plugin/ScriveSetup/Release/ScriveSetup.msi"

#####3. Client-side files (Javascript, HTML, Css, json, etc..)
 - Upload from "/chrome-scrive-extension" to remote hosting these subfolders:
    /common /libs /ie /html /css /img /_locales

    Also make sure that "Scrive.jsBase" variable in "/ie/ScriveIELoader.js" 
    has URL of remote hosting location (with trailing '/')

#####4.How to prevent a version mismatch between 2. and 3.

 - Server config file:
        2 should fetch a "json.cfg" file from the server(predefined location)

        "json.cfg" should contain a key,value pairs of VERSIONS and URLs.
        
        VERSION being IE ext.ver.number and
        
        URL root url of a hosted external files that we know works for that version of IE extension.
        
        This value will then be assigned to "Scrive.jsBase" variable of "/ie/ScriveIELoader.js"
        

        { "0.5.0": "https://www.scrive.com/ie/v0.5.0/",
          "0.7.0": "https://www.scrive.com/ie/v0.7.5/",
          "0.7.5": "https://www.scrive.com/ie/v0.7.5/",
           ....
        }
        
 - Browser caching:
 
        We will have one to many relationship between released 2 and 3.

        As additional measure of protection we should try to avoid browser caching of 3 on updates.
        

        Possible solution:
            Timestamping - we add a timestamp based random parameter at the end of each request made by 2
			   something like:

                   "https://www.scrive.com/ie/v0.7.5/ie/ScriveIELoader.js?<random parameter>"



###Tracking of issues

    Expand mixpanel reporting so that we can detect issues before clients call us.




