// Declare app level module which depends on filters, and services
angular.module('nbsApp', [
        'ngRoute',
        'ui.bootstrap',
        'nbsApp.controllers',
        'nbsApp.filters',
        'nbsApp.services',
        'nbsApp.directives',
        'ui.bootstrap'
    ])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/r9mk/:bId/:date?',{
            templateUrl: function (params) {
                return 'partials/bd' + params.bId + '.html';
                },
            controller: 'buildCtrl'
        })
        .when('/about',{
            templateUrl: 'partials/about.html',
            controller: ''
        })
        .otherwise({redirectTo: '/r9mk/3'});
    }])
    .config(['$tooltipProvider', function($tooltipProvider){
        $tooltipProvider.options({
            placement: 'top',
            animation: true,
            popupDelay: 200,
            appendToBody: true
            });
        }]);