// Declare app level module which depends on filters, and services
angular.module('nbsApp', [
        //'ngRoute',
        'ui.router',
        'ui.bootstrap',
        'nbsApp.controllers',
        'nbsApp.filters',
        'nbsApp.services',
        'nbsApp.directives',
        'ui.bootstrap'
    ])
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('r9mk',{
                url: '/r9mk',
                templateUrl: 'partials/bd.html',
                //controller: 'buildCtrl'
            })
            .state('r9mk.building', {
                url: '/:bId',
                views: {
                    'building': {
                        templateUrl: function (params) {
                            return 'partials/bd' + params.bId + '.html';
                        },
                     controller: 'buildCtrl'
                    }
                }
            })
            .state('about', {
                url: '/about',
                templateUrl: 'partials/about.html'
            });

        $urlRouterProvider
            .otherwise('/r9mk/3');
    }])
    .config(['$tooltipProvider', function($tooltipProvider){
        $tooltipProvider.options({
            placement: 'top',
            animation: true,
            popupDelay: 200,
            appendToBody: true
            });
        }]);