
//Setting Chrome specifics and initializing main

Scrive.jsBase = chrome.extension.getURL( '' ).substring( 0, chrome.extension.getURL( '' ).lastIndexOf( '/' ) );

//http://stackoverflow.com/questions/5082094/register-domcontentloaded-in-google-chrome
document.addEventListener( "DOMContentLoaded", Scrive.Main.init );