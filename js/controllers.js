'use strict';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl',
        ['$scope', '$http', '$routeParams', '$timeout', 'nbsR9mk', 'Commute',
            function($scope, $http, $routeParams, $timeout, nbsR9mk, Commute) {
                function loadSnap(){
                    var date;
                    date = (moment($scope.commute.selDate).isSame($scope.commute.stopDate, 'day'))?false:$scope.commute.selDate;
                    $scope.r9mk.toDate(date).done(function(){
                        $scope.commute.flatsStat = $scope.r9mk.flatsStat;
                        $timeout(function(){ $scope.$apply(); });
                    });
                }
                function checkSelectedDate(){//checks 'commute.selDate' for right interval and modifies if needed
                    $scope.tempSelectDate = moment(new Date($scope.commute.selDate));
                    //console.log($scope.tempSelectDate.toISOString());
                    if($scope.tempSelectDate.isValid &&
                        $scope.tempSelectDate.isAfter($scope.commute.startDate.clone().subtract('day', 1), 'day') &&
                        $scope.tempSelectDate.isBefore($scope.commute.stopDate.clone().add('day', 1), 'day')){
                        //$scope.commute.selDate = $scope.tempSelectDate.toDate();
                        //leave the same
                    }
                    else if($scope.tempSelectDate.isValid &&
                        $scope.tempSelectDate.isBefore($scope.commute.startDate.clone(), 'day')) {
                        $scope.commute.selDate = $scope.commute.startDate.toDate();
                    }
                    else {
                        $scope.commute.selDate = $scope.commute.stopDate.toDate();
                    }
                    $scope.tempSelectDate = undefined;
                }

                $scope.bId = $routeParams.bId;
                $scope.commute = Commute;
                $scope.hoveredFlat = { hovered:0 };

                $scope.r9mk = nbsR9mk;
                $scope.header = $scope.r9mk.buildings[$scope.bId].nameRu;

                if($scope.r9mk.buildings[$scope.bId].startDate){
                    $scope.commute.startDate = moment($scope.r9mk.buildings[$scope.bId].startDate);
                }
                else {
                    $scope.commute.startDate = moment();
                }

                if($scope.r9mk.buildings[$scope.bId].stopDate){
                    $scope.commute.stopDate = moment($scope.r9mk.buildings[$scope.bId].stopDate);
                }
                else {//i'd like to show local 'today' day active for any timezone if !stopDate
                    $scope.commute.stopDate = moment();
                }

                $scope.commute.selDate = ($routeParams.date)?$routeParams.date:new Date();
                checkSelectedDate();

                /*if($routeParams.date){
                    $scope.tempSelectDate = moment(new Date($routeParams.date));
                    if($scope.tempSelectDate.isValid &&
                        $scope.tempSelectDate.isAfter($scope.commute.startDate.clone().subtract('day', 1), 'day') &&
                        $scope.tempSelectDate.isBefore($scope.commute.stopDate.clone().add('day', 1), 'day')){
                            $scope.commute.selDate = $scope.tempSelectDate.toDate();
                    }
                    else if($scope.tempSelectDate.isValid &&
                        $scope.tempSelectDate.isBefore($scope.commute.startDate.clone(), 'day')) {
                            $scope.commute.selDate = $scope.commute.startDate.toDate();
                    }
                }

                $scope.tempSelectDate = false;*/

                /*if(!$scope.commute.selDate) {
                    $scope.tempSelectDate = moment.utc();
                    if($scope.tempSelectDate.isSame($scope.commute.stopDate, 'day') ||
                        $scope.tempSelectDate.isBefore($scope.commute.stopDate, 'day')){
                            $scope.commute.selDate = $scope.tempSelectDate.toDate();
                    }
                    else {
                        $scope.commute.selDate = $scope.commute.stopDate.toDate();
                    }
                }

                */


                $scope.setHoveredFlat = function(flId, popupPos){
                    var flat = { hovered:0, popupPos:0 };
                    if(flId && popupPos && $scope.r9mk.flLoaded){
                        flat = $scope.r9mk.flats[flId];
                        flat.hovered = 1;
                        flat.popupPos = popupPos;
                    }
                    $scope.$apply(function(){
                        $scope.hoveredFlat = flat;
                    });
                };

                $scope.r9mk.init($routeParams.bId)
                .done(loadSnap)
                .done(function(){
                    $scope.r9mk.loadPriceHistory()
                    .done(function(){
                        $scope.commute.priceStat = $scope.r9mk.priceStat;
                        $scope.$apply();
                    });
                })
                .done(function(){
                    $scope.r9mk.loadAvailFlatsQhistory()
                    .done(function(){
                        $scope.commute.availFlatsQhist = $scope.r9mk.availFlatsQhist;
                        $scope.$apply();
                    });
                });

                $scope.$watch('commute.selDate', function(val, prevVal){
                    if(val === prevVal) { return; }
                    var selDate = val;
                    checkSelectedDate();
                    if(moment(selDate).isSame($scope.commute.selDate, 'day')) {
                        loadSnap();
                    }
                });

                $scope.$on('$destroy', function () {
                    $scope.r9mk.destroy();
                });
            }])
    .controller('DatepickerDemoCtrl', ['$scope', 'Commute', function($scope, Commute){
        $scope.commute = Commute;
        $scope.today = function() {
            $scope.commute.selDate = new Date();
        };
        $scope.today();
        /*$scope.$watch('dt', function(val) {
            Commute.selDate = val;
        });*/

        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };

        $scope.dateOptions = {
            showWeeks:0,
            startingDay: 1,
            showButtonBar: 0,
            maxMode:'day'
        };

        //$scope.maxDate = $scope.commute.stopDate || new Date();
        //$scope.minDate = $scope.commute.startDate;
        $scope.format = 'dd.MM.yyyy';
    }]);