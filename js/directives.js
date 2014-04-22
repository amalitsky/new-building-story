'use strict';

angular.module('nbsApp.directives', [])
    .directive('nbsFlat', [function() {
    function link(scope, elem, attr){
        elem.mouseover(function (event){
            scope.activeFlat = attr.nbsFlat;
        });

        scope.$watch('r9mk.flats[' + attr.nbsFlat + '].curStatus',
            function (status){
                if(typeof status !== 'undefined') {
                    scope.curStatus = status;
                }
        });
    }
    return {
        scope: true,
        template: '<img src="./img/window.png"/>',
        link: link
    };
    }])
    .directive('nbsFlatInfo', [function(){
        return {
            scope:true,
            template: 'Flat Id = {{ val.testMsg }}'
        }
    }]);