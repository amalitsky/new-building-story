import '../css/justified-nav.css';
import '../less/styles.less';
import '../less/bdTable.less';
import '../less/variables.less';
import _ from 'lodash';

import 'angular';
import * as router from 'angular-ui-router';
import * as bootstrap from 'angular-bootstrap';

import './app';

window.addEventListener('load', () => {
  angular.bootstrap('body', ['nbsApp']);
});

