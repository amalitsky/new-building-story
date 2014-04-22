"use strict";

angular.module('nbsApp.filters', [])
.filter('flStatus', function(){
    return function (flStatus){
        var table = {
            1:'avail',
            3:'sold',
            'undefined':'notAvail'
        };
        return table[flStatus] || table['undefined'];
    };
})