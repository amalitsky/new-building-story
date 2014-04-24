'use strict';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl',
        ['$scope', '$http', '$routeParams', 'nbsR9mk',
            function($scope, $http, $routeParams, nbsR9mk) {
                $scope.hoveredFlat = { hovered:0 };
                $scope.setHoveredFlat = function(flId, popupPos){
                    var flat = { hovered:0, popupPos:0 };
                    if(flId && popupPos){
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
                            $scope.$apply(); });
                });

            }])
    .controller('nbsGui', ['$scope', '$http', '$routeParams', 'nbsR9mk',
        function($scope, $http, $routeParams, nbsR9mk){
            $scope.toDateObj = angular.element("#datePicker")[0].value;
            $scope.$watch('$scope.toDateObj.value',
                function(val){
                    $scope.toDate = val; });
        }]);