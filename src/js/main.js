import 'angular';

import '../less/styles.less';

import { appName } from './app';

window.addEventListener('load', () => {
  angular.bootstrap('body', [appName], {
    strictDi: true
  });
});

