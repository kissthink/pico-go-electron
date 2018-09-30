const {app} = require('electron').remote
let index = {

    // init - called during application start, invokes backend initialisation
    init: function() {
        // Init
        asticode.loader.init();
        // capture electron app "userData" variable 
        // this is used as a location to host the compiled JS file.
        userPath = app.getPath("userData");

        // Wait for astilectron to be ready
        document.addEventListener('astilectron-ready', function() {
            // Listen
            index.listen();
        
            // call backend init
            // Create message
            let message = {"name": "init"};
            if (typeof userPath !== "undefined") {
                message.payload = userPath
            }
            // Send message
            asticode.loader.show();
            astilectron.sendMessage(message, function(message) {
                // Init
                asticode.loader.hide();

                // Check error
                if (message.name === "error") {
                    dialog.showErrorBox("Init Error",message.payload);
                    return
                }
            })

            
            // load initial source code
            index.load(userPath);
        })
    },
    // about menu clicked
    aboutMenu: function(message) {
        dialog.showMessageBox({"title": "About","message": message});
    },
    // new menu clicked
    newMenu: function(payload) {
        document.getElementById("path").innerHTML = "<new>";
        editor.session.setValue(payload)
    },
    // open menu clicked
    openMenu: function(message) {
        dialog.showOpenDialog({"title": "Select sourcefile","message": message});
    },
    // save menu clicked
    saveMenu: function(message) {
        if (typeof saveFilename !== "undefined") {
            this.save(saveFilename);
        } else {
            this.saveAsMenu();
        }
    },
    // saveAs menu clicked
    saveAsMenu: function() {
        saveFilename = dialog.showSaveDialog({"title": "Select file to save as","filters": [{"name":"go files","extensions":["go"]}]});
        if (typeof saveFilename !== "undefined") {
            this.save(saveFilename);
        }
    },
    // load - call backend to load source from path and init editor
    load: function(path) {
        // Create message
        let message = {"name": "load"};
        if (typeof path !== "undefined") {
            payload = {
                "path": path,
            }
            message.payload = payload
        }
        // Send message
        asticode.loader.show();
        astilectron.sendMessage(message, function(message) {
            // Init
            asticode.loader.hide();

            // Check error
            if (message.name === "error") {
                dialog.showErrorBox("Load Error",message.payload);
                return
            }

            document.getElementById("path").innerHTML = message.payload.path;
            editor.session.setValue(message.payload.source)
        })
    },
    // run - call to backend to compile and run current sourcecode
    run: function() {

        payload = {
            "path": userPath,
            "source":editor.session.getValue()
        }
        // Create message
        let message = {"name": "run",
            "payload": payload
        };

        // send sourcecode to backend for compilation
        asticode.loader.show();
        astilectron.sendMessage(message, function(message) {
            // Init
            asticode.loader.hide();
            editor.session.clearAnnotations();
            document.getElementById("compErrors").innerHTML = ""; // Clear errors
            // Check error
            if (message.name === "error") {
                dialog.showErrorBox("Load Error",message.payload);
                return
            }

            // convert response to annotations on sourcecode
            annotations = [];
            errorMessage = "";
            if (message.payload.compResp != undefined && message.payload.compResp.errors != undefined && message.payload.compResp.errors.length > 0) {
                errs = message.payload.compResp.errors
                for (var i = 0; i < errs.length; i++) {
                    annotations.push(errs[i]);
                    errorMessage += errs[i].text + "\n"
                }
                // highlight first error line
                editor.moveCursorToPosition(errs[0].row-1,0);
                editor.moveCursorTo(errs[0].row,0);
                editor.scrollToLine(errs[0].row-1);
                editor.session.setAnnotations(annotations);
                document.getElementById("compErrors").innerHTML =message.payload.compResp.raw;
                dialog.showErrorBox("Compile Error",errorMessage);
                return
            }
            
            // if no errors - code compiled successfully
            // switch to game tab
            screenWidth = message.payload.screenWidth;
            screenHeight = message.payload.screenHeight;
            document.getElementById("gameFrame").contentWindow.location.reload();
            document.getElementById("gameTab").click();
            // refresh js
        })
    },

    // save - saves sourcecode to path
    save: function(path) {
        // Create message
        let message = {"name": "save"};
        if (typeof path !== "undefined") {
            payload = {
                "path": path,
                "source":editor.session.getValue()
            }
            message.payload = payload
        }
        // Send message
        asticode.loader.show();
        astilectron.sendMessage(message, function(message) {
            // Init
            asticode.loader.hide();

            // Check error
            if (message.name === "error") {
                dialog.showErrorBox("Save Error",message.payload);
                return
            }
            document.getElementById("path").innerHTML = message.payload.path;
        })
    },

    // meno option listener
    listen: function() {
        astilectron.onMessage(function(message) {
            switch (message.name) {
                case "about":
                    index.aboutMenu(message.payload);
                    return {payload: "about clicked!"};
                    break;
                case "new":
                    index.newMenu(message.payload);
                    return {payload: "new clicked!"};
                    break;
                case "open":
                    index.openMenu(message.payload);
                    return {payload: "open clicked!"};
                    break;
                case "save":
                    index.saveMenu(message.payload);
                    return {payload: "save clicked!"};
                    break;
                case "saveAs":
                    index.saveAsMenu(message.payload);
                    return {payload: "saveAs clicked!"};
                    break;
            }
        });
    }
};