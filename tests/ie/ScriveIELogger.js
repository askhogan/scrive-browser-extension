Scrive.IE.Logger = new function() {

    this.console = null;
//    this.fbl = false;

    this.getErrorMessage = function ( e ){
        return e.message ? e.message : e;
    };

    this.print = function( msg ) {
        if (typeof window.console == "undefined") {
            var p = document.createElement('p');
            if (msg.indexOf("Scrive message") != -1) {
                p.setAttribute("style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #0000ff;");
            } else if (msg.indexOf("Scrive error") != -1) {
                p.setAttribute("style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #ff0000;");
            } else {
                p.setAttribute("style", "margin: 0px 0px 10px 0px; font-weight: bold; font-family: arial; font-size: 12px; color: #000000;");
            }
            p.appendChild(document.createTextNode(msg));
            Scrive.IE.Logger.console.appendChild(p);
        }
        else {
            if (msg.indexOf("Scrive message") != -1)    console.info(msg);
            else if (msg.indexOf("Scrive error") != -1) console.error(msg);
            else                                        console.log(msg);
        }
    };

    this.init = function() {
        try {
            //http://msdn.microsoft.com/en-us/library/dd565625%28v=vs.85%29.aspx#consolelogging
            //http://stackoverflow.com/questions/2656730/internet-explorer-console
            if (typeof window.console == "undefined") {
                Scrive.IE.Logger.console = document.createElement('div');
//                Scrive.IE.Logger.console.setAttribute("style", "display: none; width: 500px; height: 200px; background-color: #ffffff; border: 5px solid #000000; padding: 10px; overflow: scroll; position: absolute; z-index: 100000; left: 30px; top: 30px;");
                Scrive.IE.Logger.console.setAttribute("style", "display: block; width: 500px; height: 200px; background-color: #ffffff; border: 5px solid #000000; padding: 10px; overflow: scroll; position: absolute; z-index: 100000; left: 30px; top: 30px;");
                document.body.appendChild(Scrive.IE.Logger.console);
            }
            else
                Scrive.IE.Logger.console = window.console;

        } catch ( e ) {
            alert( "While initializing logger: " + e.message );
        }

    };

//    this.showConsole = function() {
//        if (typeof window.console == "undefined")   Scrive.IE.Logger.console.style.display = "block";
//    }
};