'use strict';

import moment from 'moment';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl', ['$scope', '$stateParams', 'nbsR9mk', 'Commute',
        function($scope, $stateParams, nbsR9mk, Commute) {
            function loadSnap(){
                var date;
                date = moment($scope.commute.selDate).isSame($scope.commute.stopDate, 'day') ? false : $scope.commute.selDate;
                return $scope.r9mk.toDate(date).then(function(){
                    $scope.commute.flatTypesStat = $scope.r9mk.flatTypesStat;
                    $scope.commute.flatsStat = $scope.r9mk.flatsStat;
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

            $scope.bId = $stateParams.bId;
            $scope.commute = Commute;

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

            $scope.commute.selDate = ($stateParams.date)?$stateParams.date : moment();

            filterSelectedDate();

            $scope.r9mk.init($stateParams.bId)
                .then(loadSnap)
                .then(function(){
                    $scope.r9mk.loadPriceHistory()
                        .then(function(){
                            $scope.commute.priceStat = $scope.r9mk.priceStat;
                            $scope.commute.flatTypesStat = $scope.r9mk.flatTypesStat;
                        });
                })
                .then(function(){
                    $scope.r9mk.loadAvailFlatsQhistory()
                        .then(function(){
                            $scope.commute.availFlatsQhist = $scope.r9mk.availFlatsQhist;
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
    .controller('snapDatepicker', ['$scope', 'Commute', function($scope, Commute){
        $scope.commute = Commute;

        $scope.$watch('commute.stopDate', function(stopDate) {
            $scope.commute.selDate = +stopDate;
        });

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
    }])
    .controller('AboutAccordion', ['$scope', function ($scope) {
        $scope.status = {
            isFirstOpen: true
        };
    }])
    .controller('gui', ['$scope', '$location', function(scope, $location){
        scope.currYear = moment().format('YYYY');
        scope.$on('$locationChangeSuccess', function(){
            scope.hideDatePicker = $location.url() === '/about';
        });
    }])
    .controller('buildingWrapper', ['$scope', '$stateParams', 'nbsR9mk', 'Commute', function(scope, params, r9mk, commute){
        scope.bHeader = r9mk.buildings[params.bId].nameRu;
        scope.warning = !r9mk.buildings[params.bId].isConsistent;
        scope.commute = commute;
    }]);
