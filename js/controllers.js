'use strict';

angular.module('nbsApp.controllers', [])
    .controller('buildCtrl',
        ['$scope', '$http', '$routeParams', 'nbsR9mk', 'nbsScope',
            function($scope, $http, $routeParams, nbsR9mk, nbsScope) {
                $scope.activeFlat = 111;
                $scope.r9mk = nbsR9mk($routeParams.bId);
                $scope.header = $scope.r9mk.buildings[$routeParams.bId].nameRu;
                $scope.r9mk.init().done(function(){
                    $scope.r9mk.loadRecent().
                        done(function(){
                            $scope.$apply(); });
                });

            }])
    .controller('nbsGui', ['$scope', '$http', '$routeParams', 'nbsR9mk', 'nbsScope',
        function($scope, $http, $routeParams, nbsR9mk, nbsScope){
            $scope.test = nbsScope;
            $scope.toDateObj = angular.element("#datePicker")[0].value;
            $scope.$watch('$scope.toDateObj.value',
                function(val){
                    $scope.toDate = val; });
        }]);