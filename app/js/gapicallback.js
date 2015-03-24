/**
 * gapi-chrome-apps version 0.001
 *
 * Provides the Google API javascript client 'gapi' as
 * appropriate for hosted websites, or if in a Chrome packaged
 * app implement a minimal set of functionality that is Content
 * Security Policy compliant and uses the chrome identity api.
 *
 * https://github.com/GoogleChrome/chrome-app-samples/tree/master/gapi-chrome-apps-lib
 *
 */
/**
 * Prints a list of tasks on a list with a specified |listId|.
 */


/**
 * Prompts the user for authorization and then proceeds to
 */
function authorize(params, callback) {
    gapi.auth.authorize(params, function(accessToken) {
        if (!accessToken) {
            var error = document.createElement("p");
            error.textContent = 'Unauthorized';
            document.querySelector("body").appendChild(error);
        } else {
            callback();
        }
    });
}

function gapiIsLoaded() {

    /*
     angular.bootstrap(document, ['gDriveApp']);
     gDriveApp.factory('gdocs', function() {
         var gdocs = new GDocs();
         return gdocs;
     });*/

    var params = {
        'immediate': false
    };
    if (!(chrome && chrome.app && chrome.app.runtime)) {
        // This part of the sample assumes that the code is run as a web page, and
        // not an actual Chrome application, which means it takes advantage of the
        // GAPI lib loaded from https://apis.google.com/. The client used below
        // should be working on http://localhost:8000 to avoid origin_mismatch error
        // when making the authorize calls.
        params.scope = "https://www.googleapis.com/auth/drive";
        params.client_id = "467472285488-lo80kj4n1tkr0qhe08rajn4ti827ma4q.apps.googleusercontent.com";
        
        gapi.auth.init(authorize.bind(null, params, function() {
            
            gDriveApp.factory('gdocs', function() {
                var gdocs = new GDocs();
                return gdocs;
            });
            
            angular.bootstrap(document, ['gDriveApp']);

        }));

    } else {
        authorize(params, function() {

            gDriveApp.factory('gdocs', function() {
                var gdocs = new GDocs();
                return gdocs;
            });

            angular.bootstrap(document, ['gDriveApp']);

        });
    }
}

window.gapi_onload = function(){
  console.log('gapi loaded.', gapi.auth, gapi.client);

  // Do things you want with gapi.auth and gapi.client.
  document.body.innerHTML = 'gapi.client = ' + JSON.stringify(gapi.client) + '<br>';
}
