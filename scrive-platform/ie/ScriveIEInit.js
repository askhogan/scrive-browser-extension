//C++ should inject this file ONCE per document, after it injects all the other files
//Scrive.IE.Logger.fbl=true;  // turns-on FireBug console

function ScriveIEMain() {
    //Initialize common methods
    Scrive.Main.activeXObj =  new ActiveXObject("ScriveBHO.ScriveToolbarActiveX");
    ScriveIEInitialize();
}

function ScriveIEInitialize(){
    try {
        Scrive.LogUtils.debugOn = true;
        Scrive.LogUtils.profileOn = false;
        Scrive.LogUtils.infoOn = true;

        //Initialize platform specific stuff
        Scrive.Platform.init();

        Scrive.LogUtils.info( "Loaded all scripts " + ( new Date().getTime() - ScriveIELoader.start ) + "ms" );

//        Scrive.Main.activeXObj.SendPDF("http://www.kb.nl/sites/default/files/docs/pdf_guidelines.pdf");

    } catch ( e ) {
        alert( "While initializing Scrive: " + e.message );
    }
}

ScriveIEMain();
