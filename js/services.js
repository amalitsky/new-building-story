"use strict";

angular.module('nbsApp.services', [])
    .factory('nbsR9mk', function nbsR9mk() {
    return function(bId){ return new R9mkModel(bId); };
    })
    .factory('smallFlatBallon', function(){
        return function (event){

        }
    })
    .factory('nbsScope',function(){
        return { flLoaded: 'default' }
    });