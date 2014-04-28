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
                    'undefined':'не было'
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
                1:'однокомнатная',
                2:'двухкомнатная',
                3:'трёхкомнатная',
                4:'четырёхкомнатная',
                'undefined':'неизвестно что'
            };
            return table[flType] || table['undefined'];
        };
    })
;
