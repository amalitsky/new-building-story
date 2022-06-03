import uiRouterModuleName from '@uirouter/angularjs';

import { nbsAppConfig } from './app-config';
import { buildingController, buildingWrapperController, guiController } from './controllers.js';

import './directives.js';
import './filters.js';
import './services.js';

export const appName = 'nbsApp';

const nbsApp = angular.module(appName, [
  uiRouterModuleName,
  'nbsApp.filters',
  'nbsApp.services',
  'nbsApp.directives'
]);

nbsApp.config(nbsAppConfig);

const controllers = [
  buildingController,
  buildingWrapperController,
  guiController,
]

controllers.forEach(controller => {
  nbsApp.controller(controller.$name, controller);
});
