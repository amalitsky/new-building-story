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
                function filterSelectedDate(){//checks 'commute.selDate' for being in right interval and modifies if needed
                    var date = moment(new Date($scope.commute.selDate)),// Date type or string
                        start = $scope.commute.startDate,//moment type
                        stop = $scope.commute.stopDate;

                    if(date.isValid){
                        if(date.isAfter(stop, 'day')){
                            $scope.commute.selDate = stop.toDate();
                            return false;
                        }
                        else if(date.isBefore(start, 'day')) {
                            $scope.commute.selDate = start.toDate();
                            return false;
                        }
                    }
                    else {
                        $scope.commute.selDate = stop.toDate();
                        return false;
                    }
                //returns true if selDate was not modified by filter
                return true;
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

                filterSelectedDate();

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
                    if(filterSelectedDate()) {
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
            $scope.commute.selDate = $scope.commute.stopDate;
        };
        $scope.today();


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

function AccordionDemoCtrl($scope) {
    $scope.oneAtATime = true;

    $scope.groups = [
        {
            title: 'Dynamic Group Header - 1',
            content: 'Dynamic Group Body - 1'
        },
        {
            title: 'Dynamic Group Header - 2',
            content: 'Dynamic Group Body - 2'
        }
    ];

    $scope.items = ['Item 1', 'Item 2', 'Item 3'];

    $scope.addItem = function() {
        var newItemNo = $scope.items.length + 1;
        $scope.items.push('Item ' + newItemNo);
    };

    $scope.status = {
        isFirstOpen: true,
        isFirstDisabled: false
    };
}