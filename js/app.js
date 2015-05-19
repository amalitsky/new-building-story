angular.module('nbsApp', [
        'ui.router',
        'ui.bootstrap',
        'nbsApp.controllers',
        'nbsApp.filters',
        'nbsApp.services',
        'nbsApp.directives'
    ])
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('r9mk',{
                url: '/r9mk/{bId:[1-3]}',
                templateUrl: 'partials/bd.html',
                controller: 'buildingWrapper'
            })
            .state('r9mk.building', {
                url: '/show',
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
            .otherwise('/r9mk/3/show');
    }]);
