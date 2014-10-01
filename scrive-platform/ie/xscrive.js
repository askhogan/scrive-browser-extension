
//debugger;

var scrivePlugin = new ActiveXObject("ScriveBHO.ScriveToolbarActiveX");

scrivePlugin.SendPDF("http://www.kb.nl/sites/default/files/docs/pdf_guidelines.pdf");

scrivePlugin.pref("test")="test1 test2";
alert(scrivePlugin.pref("test"));

scrivePlugin.pref("test1")="12test1 test2";
scrivePlugin.pref("test2")="23test1 test2";
scrivePlugin.pref("test3")="34test1 test2";