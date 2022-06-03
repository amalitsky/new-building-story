export const nbsAppConfig = (
  $stateProvider,
  $urlRouterProvider,
  $compileProvider,
) => {
  $stateProvider
    .state('r9mk', {
      url: '/r9mk/{bId:[1-3]}',
      templateUrl: 'partials/bd.html',
      controller: 'buildingWrapperController',
    })
    .state('r9mk.building', {
      url: '/',
      views: {
        building: {
          templateUrl(params) {
            return 'partials/bd' + params.bId + '.html';
          },
          controller: 'buildingController',
        },
      },
    })
    .state('about', {
      url: '/about',
      templateUrl: 'partials/about.html',
    });

  $urlRouterProvider
    .otherwise('/r9mk/3/');

  $compileProvider
    .commentDirectivesEnabled(false)
    .cssClassDirectivesEnabled(false);

  if (import.meta.env.PROD) {
    $compileProvider.debugInfoEnabled(false);
  }
}

nbsAppConfig.$inject = [
  '$stateProvider',
  '$urlRouterProvider',
  '$compileProvider'
];
