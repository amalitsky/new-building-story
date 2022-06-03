export function buildingController($scope, $stateParams, nbsR9mk, Commute) {
    function loadSnap() {
        const { stopDate, selDate: selectedDate } = $scope.commute;

        // had moment wrapper
        const date = selectedDate > stopDate ? false : selectedDate;

        return nbsR9mk.toDate(date)
          .then(() => {
              $scope.commute.flatTypesStat = nbsR9mk.flatTypesStat;
              $scope.commute.flatsStat = nbsR9mk.flatsStat;
          });
    }

    // checks 'commute.selDate' for being in the right interval and modifies if needed
    function filterSelectedDate() {
        const date = new Date($scope.commute.selDate); // Date type or string

        const { startDate, stopDate } = $scope.commute; //moment type

        if (!date) {
          throw Error('Wrong date');
        }

        if (date > stopDate) {
            $scope.commute.selDate = new Date(stopDate);

            return false;
        } else if (date < startDate) {
            $scope.commute.selDate = new Date(startDate);

            return false;
        }

        // returns true if selDate was not modified by filter
        return true;
    }

    const buildingId = $scope.bId = $stateParams.bId;
    const buildingSpec = nbsR9mk.buildings[buildingId];

    $scope.commute = Commute;

    $scope.header = buildingSpec.nameRu;

    if (buildingSpec.startDate) {
        $scope.commute.startDate = new Date(buildingSpec.startDate);
    } else {
        throw Error(`No start date for the building "${ buildingId }"`);
    }

    if (buildingSpec.stopDate) {
        $scope.commute.stopDate = new Date(buildingSpec.stopDate);
    }
    else { //i'd like to show local 'today' day active for any timezone if !stopDate
        $scope.commute.stopDate = new Date();
    }

    // had moment wrapper
    $scope.commute.selDate = $stateParams.date || new Date();

    filterSelectedDate();

    nbsR9mk.init($stateParams.bId)
      .then(loadSnap)
      .then(() => {
          nbsR9mk.loadPriceHistory()
            .then(() => {
                $scope.commute.priceStat = nbsR9mk.priceStat;
                $scope.commute.flatTypesStat = nbsR9mk.flatTypesStat;
            });
      })
      .then(() => {
          nbsR9mk.loadAvailFlatsQhistory()
            .then(() => {
                $scope.commute.availFlatsQhist = nbsR9mk.availFlatsQhist;
            });
      });

    $scope.$watch('commute.selDate', function(val, prevVal){
        if (val === prevVal) { return; }

        if (filterSelectedDate()) {
            loadSnap();
        }
    });

    $scope.$on('$destroy', function () {
        nbsR9mk.destroy();
    });
}

buildingController.$inject = [
  '$scope',
  '$stateParams',
  'nbsR9mk',
  'Commute',
];

buildingController.$name = 'buildingController';

export function guiController(scope, $location, commute) {
  scope.commute = commute;

  scope.currYear = (new Date()).getFullYear();

  scope.$on('$locationChangeSuccess', function(){
    scope.hideDatePicker = $location.url() === '/about';
  });
}

guiController.$inject = [
  '$scope',
  '$location',
  'Commute',
];

guiController.$name = 'guiController';

export function buildingWrapperController(scope, params, r9mk, commute) {
  scope.bHeader = r9mk.buildings[params.bId].nameRu;
  scope.warning = !r9mk.buildings[params.bId].isConsistent;
  scope.commute = commute;
}

buildingWrapperController.$inject = [
  '$scope',
  '$stateParams',
  'nbsR9mk',
  'Commute',
];

buildingWrapperController.$name = 'buildingWrapperController';
