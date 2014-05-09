'use strict';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl',
        ['$scope', '$http', '$routeParams', 'nbsR9mk', 'Commute',
            function($scope, $http, $routeParams, nbsR9mk, Commute) {
                $scope.hoveredFlat = { hovered:0 };
                $scope.r9mk = nbsR9mk;
                $scope.header = $scope.r9mk.buildings[$routeParams.bId].nameRu;
                $scope.commute = Commute;
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
                .done(function(){
                    $scope.commute.flatsStat = $scope.r9mk.flatsStat;
                    $scope.$apply();
                })
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

                $scope.$on('$destroy', function () {
                    $scope.r9mk.destroy();
                });
            }])
    .controller('nbsGui', ['$scope', '$http', '$routeParams', 'nbsR9mk', 'Commute',
        function($scope, $http, $routeParams, nbsR9mk, Commute){
        }]);