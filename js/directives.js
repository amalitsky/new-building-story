'use strict';

angular.module('nbsApp.directives', [])
    .directive('nbsFlat', ['$position', '$timeout', function($position, $timeout) {
    function link(scope, elem, attr){
        var overTimeout;
        elem.mouseover(function (event){
            if(event.relatedTarget && (event.target.isEqualNode(event.relatedTarget.parentNode) ||
                event.relatedTarget.isEqualNode(event.target.parentNode))
                ) { return; }
            var position = $position.offset( $(event.target) );
            if(overTimeout) {
                $timeout.cancel(overTimeout);
            }
            overTimeout = $timeout(function (){
            scope.setHoveredFlat(flatN, position);
            });
        });
        elem.mouseout(function(event){
            if(event.relatedTarget && (event.target.isEqualNode(event.relatedTarget.parentNode) ||
                event.relatedTarget.isEqualNode(event.target.parentNode))
                ) { return; }
            if(overTimeout) {
                $timeout.cancel(overTimeout);
            }
            //if(scope.hoveredFlat.hovered){
            scope.setHoveredFlat(undefined);
            //}
        });
        var flatN = attr.nbsFlat, flat = {};

        scope.$watch('r9mk.flats[' + flatN + ']',
            function (flat){
                if(typeof flat !== 'undefined') {
                    scope.flat = flat;
                }
        });
    }
    return {
        controller:function ($scope){},
        scope: true,
        link: link
    };
    }])
    .directive( 'nbsPopover', [ '$nbsTooltip', function ( $tooltip ) {
        return $tooltip( 'nbsPopover', 'nbsPopover', 'mouseenter' );
    }])
    .directive( 'nbsPopoverPopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { flat: '=', placement: '@', animation: '&', isOpen: '&' },
            templateUrl: '/partials/flatPopover.html'
        };
    });
;