//C++ should inject this file ONCE per document, after it injects all the other files
//Scrive.IE.Logger.fbl=true;  // turns-on FireBug console

function ScriveIEOptionsMain() {
    //Initialize common methods
    Scrive.Main.activeXObj =  new ActiveXObject("ScriveBHO.ScriveActiveX");
    ScriveIEOptionsInitialize();
}

function ScriveIEOptionsInitialize(){
    try {
        Scrive.LogUtils.debugOn = true;
        Scrive.LogUtils.profileOn = false;
        Scrive.LogUtils.infoOn = true;

        //Initialize platform specific stuff
        Scrive.Platform.init();
        Scrive.Options.init();

        Scrive.LogUtils.info( "Loaded all scripts " + ( new Date().getTime() - ScriveIELoader.start ) + "ms" );

//        Scrive.Main.activeXObj.SendPDF("http://www.kb.nl/sites/default/files/docs/pdf_guidelines.pdf");

    } catch ( e ) {
        alert( "While initializing Scrive: " + e.message );
    }
}

ScriveIEOptionsMain();
