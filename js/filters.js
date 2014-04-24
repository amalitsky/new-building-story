"use strict";

angular.module('nbsApp.filters', [])
    .filter('flStatus', function(){
        return function (flStatus, type){
            //console.log(flStatus);
            var table = {
                'class':{
                    1:'avail',
                    3:'sold',
                    'undefined':'notAvail'
                },
                'output':{
                    1:'в продаже',
                    3:'продана',
                    'undefined':'в продаже не было'
                }
            };
            type = type || 'class';
            return table[type][flStatus] || table[type]['undefined'];
        };
    })
    .filter('flTypeName', function(){
        return function (flType){
            var table = {
                0:'студия',
                1:'однушка',
                2:'двушка',
                3:'трёшка',
                4:'четырёх комнатная',
                'undefined':'неизвестно что'
            };
            return table[flType] || table['undefined'];
        };
    })
;
