
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
 - Version: update [/chrome-scrive-extension/manifest.json](/chrome-scrive-extension/manifest.json)
 - Build command: grunt crx
 - Windows: use Cygwin
    
#####2. Internet explorer extension
 - Prerequisites: Visual Studio 2010, Microsoft Windows platform SDK
 - Version: update [/internet-explorer-plugin/ScriveBHO/ScriveBHO.rc](/internet-explorer-plugin/ScriveBHO/ScriveBHO.rc)" and
             [/internet-explorer-plugin/ScriveSetup/ScriveSetup.vdproj](/internet-explorer-plugin/ScriveSetup/ScriveSetup.vdproj)
 - Build command: Open [ScriveBHO.sln](/internet-explorer-plugin/ScriveBHO.sln) in VS2010 and execute build command.

    We will need to automate this build process with grunt.
    For IE we need a Windows based machine.


###Deploy process

#####1. Chrome extension
 - Deploy new CRX package from "/output/scrive-browser-extension-VERSION-dev.crx"

#####2. Internet explorer extension
 - Deploy new MSI setup package from "/internet-explorer-plugin/ScriveSetup/Release/ScriveSetup.msi"

#####3. Client-side files (Javascript, HTML, Css, json, etc..)
 - Upload from [/chrome-scrive-extension](/chrome-scrive-extension) to remote hosting these subfolders:<BR>
    [/common](/chrome-scrive-extension/common) 
[/libs](/chrome-scrive-extension/libs) 
[/ie](/chrome-scrive-extension/ie) 
[/html](/chrome-scrive-extension/html) 
[/css](/chrome-scrive-extension/css) 
[/img](/chrome-scrive-extension/img) 
[/_locales](/chrome-scrive-extension/_locales) 


    Also make sure that "Scrive.jsBase" variable in [/ie/ScriveIELoader.js](/chrome-scrive-extension/ie/ScriveIELoader.js)
    has URL of remote hosting location (with trailing '/')

#####4. How to prevent a version mismatch between 2. and 3.

 - Server config file: IE extension should fetch a "json.cfg" file from the server(predefined location) with a key,value pairs of VERSIONs and URLs.
       
     VERSION being the version of IE extension and URL the base url that will be assigned to "Scrive.jsBase" variable of [/ie/ScriveIELoader.js](/chrome-scrive-extension/ie/ScriveIELoader.js) to load the scripts from.
     
      ```
     { "0.5.0": "https://www.scrive.com/ie/v0.5.0/",
       "0.7.0": "https://www.scrive.com/ie/v0.7.5/",
       "0.7.5": "https://www.scrive.com/ie/v0.7.5/",
       ..
     }
      ```

 - Browser caching: We will have one to many relationship between released 2 and 3. As additional measure of protection we should try to avoid browser caching of 3 on updates.
        
    Possible solution:
    
       Timestamping - we add a timestamp based random parameter at the end of each request.
      ```
      https://www.scrive.com/ie/v0.7.5/ie/ScriveIELoader.js?RANDOM_PAR
      ```



###Tracking of issues

 - Expand mixpanel reporting so that we can detect issues before clients call us.
