'use strict';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl',
        ['$scope', '$http', '$routeParams', 'nbsR9mk', 'Commute',
            function($scope, $http, $routeParams, nbsR9mk, Commute) {
                $scope.hoveredFlat = { hovered:0 };
                $scope.flatsStat = Commute;
                $scope.flatsStat.test = true;
                console.log(Commute);
                $scope.setHoveredFlat = function(flId, popupPos){
                    var flat = { hovered:0, popupPos:0 };
                    if(flId && popupPos && $scope.r9mk.flats){
                        flat = $scope.r9mk.flats[flId];
                        flat.hovered = 1;
                        flat.popupPos = popupPos;
                    }
                    $scope.$apply(function(){
                        $scope.hoveredFlat = flat;
                    });
                };
                $scope.r9mk = nbsR9mk($routeParams.bId);
                $scope.header = $scope.r9mk.buildings[$routeParams.bId].nameRu;
                $scope.r9mk.init().done(function(){
                    $scope.r9mk.loadRecent().
                        done(function(){
                            $scope.flatsStat = {arr:[7,8,9]};
                            //console.log($scope.flatsStat);
                            //console.log(commute.flatsStat);
                            $scope.$apply(); });
                });

            }])
    .controller('nbsGui', ['$scope', '$http', '$routeParams', 'nbsR9mk', 'Commute', '$timeout',
        function($scope, $http, $routeParams, nbsR9mk, Commute, $timeout){
            $scope.flatsStat = Commute;
            $timeout(function(){console.log('me');console.log($scope.flatsStat)}, 100);
            //$scope.toDateObj = angular.element("#datePicker")[0].value;
            $scope.$watch('flatsStat',
                function(val){
                    console.log(val);
                });
        }]);