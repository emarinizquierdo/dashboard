"use strict";

var gDriveApp = angular.module('gDriveApp', []);

//gDriveApp.service('gdocs', GDocs);
//gDriveApp.controller('DocsController', ['$scope', '$http', DocsController]);

// Main Angular controller for app.
function DocsController($scope, $http, gdocs) {
    $scope.docs = [];


    DocsController.$inject = ['$scope', '$http', 'gdocs']; // For code minifiers.


    // Toggles the authorization state.
    $scope.toggleAuth = function(interactive) {
        if (!gdocs.accessToken) {
            gdocs.auth(interactive, function() {

                //TODO something after auth

            });
        } else {
            gdocs.revokeAuthToken(function() {});
            this.clearDocs();
        }
    }

    // Controls the label of the authorize/deauthorize button.
    $scope.authButtonLabel = function() {
        if (gdocs.accessToken)
            return 'Deauthorize';
        else
            return 'Authorize';
    };

    $scope.toggleAuth(false);
}

$(document).ready(function() {

    $('.target').resizable().rotatable().draggable({
        handle: ".ps-popup-inner",
        cancel: ".webview"
    });


});