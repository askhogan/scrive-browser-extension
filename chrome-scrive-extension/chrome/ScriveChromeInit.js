
//Setting Chrome specifics and initializing main

Scrive.jsBase = "chrome-extension://cmkpeebfmfecffgdggabjikmlkkegbci";

//http://stackoverflow.com/questions/5082094/register-domcontentloaded-in-google-chrome
document.addEventListener("DOMContentLoaded",Scrive.Main.init);
//setTimeout(Scrive.Main.init, 1000);
