"use strict";

function GDocs(selector) {

    /**
     * Options for the Realtime loader.
     */
    var realtimeOptions = {
        /**
         * Client ID from the console.
         */
        clientId: '467472285488-lo80kj4n1tkr0qhe08rajn4ti827ma4q.apps.googleusercontent.com',

        /**
         * The ID of the button to click to authorize. Must be a DOM element ID.
         */
        authButtonElementId: 'authorizeButton',

        /**
         * Function to be called when a Realtime model is first created.
         */
        initializeModel: initializeModel,

        /**
         * Autocreate files right after auth automatically.
         */
        autoCreate: true,

        /**
         * The name of newly created Drive files.
         */
        defaultTitle: "New Realtime Quickstart File",

        /**
         * The MIME type of newly created Drive Files. By default the application
         * specific MIME type will be used:
         *     application/vnd.google-apps.drive-sdk.
         */
        newFileMimeType: null, // Using default.

        /**
         * Function to be called every time a Realtime file is loaded.
         */
        onFileLoaded: onFileLoaded,

        /**
         * Function to be called to inityalize custom Collaborative Objects types.
         */
        registerTypes: null, // No action.

        /**
         * Function to be called after authorization and before loading files.
         */
        afterAuth: null // No action.
    };


    function initializeModel(model) {
        var string = model.createString('Hello Realtime World!');
        model.getRoot().set('text', string);
    }

    var realtimeLoader = new rtclient.RealtimeLoader(realtimeOptions);

    var SCOPE_ = 'https://www.googleapis.com/drive/v2/';

    this.lastResponse = null;

    this.__defineGetter__('SCOPE', function() {
        return SCOPE_;
    });

    this.__defineGetter__('DOCLIST_FEED', function() {
        return SCOPE_ + 'files';
    });

    this.__defineGetter__('CREATE_SESSION_URI', function() {
        return 'https://www.googleapis.com/upload/drive/v2/files?uploadType=resumable';
    });

    this.__defineGetter__('DEFAULT_CHUNK_SIZE', function() {
        return 1024 * 1024 * 5; // 5MB;
    });
};

function onFileLoaded(doc) {
  console.log('file loaded');

    var string = doc.getModel().getRoot().get('text');

    // Keeping one box updated with a String binder.
    var textArea1 = document.getElementById('editor1');
    gapi.drive.realtime.databinding.bindString(string, textArea1);

    // Keeping one box updated with a custom EventListener.
    var textArea2 = document.getElementById('editor2');
    var updateTextArea2 = function(e) {
        textArea2.value = string;
    };
    string.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, updateTextArea2);
    string.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, updateTextArea2);
    textArea2.onkeyup = function() {
        string.setText(textArea2.value);
    };
    updateTextArea2();

    // Enabling UI Elements.
    textArea1.disabled = false;
    textArea2.disabled = false;

    // Add logic for undo button.
    var model = doc.getModel();
    var undoButton = document.getElementById('undoButton');
    var redoButton = document.getElementById('redoButton');

    undoButton.onclick = function(e) {
        model.undo();
    };
    redoButton.onclick = function(e) {
        model.redo();
    };

    // Add event handler for UndoRedoStateChanged events.
    var onUndoRedoStateChanged = function(e) {
        undoButton.disabled = !e.canUndo;
        redoButton.disabled = !e.canRedo;
    };
    model.addEventListener(gapi.drive.realtime.EventType.UNDO_REDO_STATE_CHANGED, onUndoRedoStateChanged);
}

GDocs.prototype.auth = function(interactive, opt_callback) {
    try {
        chrome.identity.getAuthToken({
            interactive: interactive
        }, function(token) {
            if (token) {
                this.accessToken = token;
                opt_callback && opt_callback();
            }
        }.bind(this));
    } catch (e) {
        console.log(e);
    }
};

GDocs.prototype.removeCachedAuthToken = function(opt_callback) {
    if (this.accessToken) {
        var accessToken = this.accessToken;
        this.accessToken = null;
        // Remove token from the token cache.
        chrome.identity.removeCachedAuthToken({
            token: accessToken
        }, function() {
            opt_callback && opt_callback();
        });
    } else {
        opt_callback && opt_callback();
    }
};

GDocs.prototype.revokeAuthToken = function(opt_callback) {
    if (this.accessToken) {
        // Make a request to revoke token
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
            this.accessToken);
        xhr.send();
        this.removeCachedAuthToken(opt_callback);
    }
}

/*
 * Generic HTTP AJAX request handler.
 */
GDocs.prototype.makeRequest = function(method, url, callback, opt_data, opt_headers) {
    var data = opt_data || null;
    var headers = opt_headers || {};

    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    // Include common headers (auth and version) and add rest. 
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
    for (var key in headers) {
        xhr.setRequestHeader(key, headers[key]);
    }

    xhr.onload = function(e) {
        this.lastResponse = this.response;
        callback(this.lastResponse, this);
    }.bind(this);
    xhr.onerror = function(e) {
        console.log(this, this.status, this.response,
            this.getAllResponseHeaders());
    };
    xhr.send(data);
};



/**
 * Uploads a file to Google Docs.
 */
GDocs.prototype.upload = function(blob, callback, retry) {

    var onComplete = function(response) {
        document.getElementById('main').classList.remove('uploading');
        var entry = JSON.parse(response).entry;
        callback.apply(this, [entry]);
    }.bind(this);
    var onError = function(response) {
        if (retry) {
            this.removeCachedAuthToken(
                this.auth.bind(this, true,
                    this.upload.bind(this, blob, callback, false)));
        } else {
            document.getElementById('main').classList.remove('uploading');
            throw new Error('Error: ' + response);
        }
    }.bind(this);


    var uploader = new MediaUploader({
        token: this.accessToken,
        file: blob,
        onComplete: onComplete,
        onError: onError
    });

    document.getElementById('main').classList.add('uploading');
    uploader.upload();

};
