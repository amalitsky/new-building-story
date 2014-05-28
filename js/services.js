"use strict";

angular.module('nbsApp.services', [])
    .service('nbsR9mk', R9mkModel)
    .provider('$nbsTooltip', function () {
        // The default options tooltip and popover.
        var defaultOptions = {
            placement: 'right',
            animation: true,
            popupDelay: 250,
            appendToBody: true
        };

        // Default hide triggers for each show trigger
        var triggerMap = {
            'mouseenter': 'mouseleave',
            'click': 'click',
            'focus': 'blur'
        };

        // The options specified to the provider globally.
        var globalOptions = {};

        /**
         * `options({})` allows global configuration of all tooltips in the
         * application.
         *
         *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $tooltipProvider ) {
   *     // place tooltips left instead of top by default
   *     $tooltipProvider.options( { placement: 'left' } );
   *   });
         */
        this.options = function( value ) {
            angular.extend( globalOptions, value );
        };

        /**
         * This allows you to extend the set of trigger mappings available. E.g.:
         *
         *   $tooltipProvider.setTriggers( 'openTrigger': 'closeTrigger' );
         */
        this.setTriggers = function setTriggers ( triggers ) {
            angular.extend( triggerMap, triggers );
        };

        /**
         * This is a helper function for translating camel-case to snake-case.
         */
        function snake_case(name){
            var regexp = /[A-Z]/g;
            var separator = '-';
            return name.replace(regexp, function(letter, pos) {
                return (pos ? separator : '') + letter.toLowerCase();
            });
        }

        /**
         * Returns the actual instance of the $tooltip service.
         * TODO support multiple triggers
         */
        this.$get = [ '$window', '$compile', '$timeout', '$parse', '$document', '$position', '$interpolate', function ( $window, $compile, $timeout, $parse, $document, $position, $interpolate ) {
            return function $tooltip ( type, prefix, defaultTriggerShow ) {
                var options = angular.extend( {}, defaultOptions, globalOptions );

                /**
                 * Returns an object of show and hide triggers.
                 *
                 * If a trigger is supplied,
                 * it is used to show the tooltip; otherwise, it will use the `trigger`
                 * option passed to the `$tooltipProvider.options` method; else it will
                 * default to the trigger supplied to this directive factory.
                 *
                 * The hide trigger is based on the show trigger. If the `trigger` option
                 * was passed to the `$tooltipProvider.options` method, it will use the
                 * mapped trigger from `triggerMap` or the passed trigger if the map is
                 * undefined; otherwise, it uses the `triggerMap` value of the show
                 * trigger; else it will just use the show trigger.
                 */
                function getTriggers ( trigger ) {
                    var show = trigger || options.trigger || defaultTriggerShow;
                    var hide = triggerMap[show] || show;
                    return {
                        show: show,
                        hide: hide
                    };
                }

                var directiveName = snake_case( type );

                var startSym = $interpolate.startSymbol();
                var endSym = $interpolate.endSymbol();
                var template =
                    '<div '+ directiveName + '-popup ' +
                        'title="'+startSym+'tt_title'+endSym+'" '+
                        'content="'+startSym+'tt_content'+endSym+'" '+
                        'placement="'+startSym+'tt_placement'+endSym+'" '+
                        'animation="tt_animation" '+
                        'is-open="tt_isOpen"'+
                        '>'+
                        '</div>';

                return {
                    restrict: 'EA',
                    scope: true,
                    compile: function (tElem, tAttrs) {
                        var tooltipLinker = $compile( template );

                        return function link ( scope, element, attrs ) {
                            var tooltip;
                            var transitionTimeout;
                            var popupTimeout;
                            var watchTimeout;
                            var appendToBody = angular.isDefined( options.appendToBody ) ? options.appendToBody : false;
                            var positionTooltip = function (){
                                var position,
                                    ttWidth,
                                    ttHeight,
                                    ttPosition;
                                // Get the position of the directive element.
                                position = scope.hoveredFlatCached.popupPos;

                                if(!tooltip){ return; }
                                // Get the height and width of the tooltip so we can center it.
                                ttWidth = tooltip.prop( 'offsetWidth' );
                                ttHeight = tooltip.prop( 'offsetHeight' );

                                // Calculate the tooltip's top and left coordinates to center it with
                                // this directive.

                                if(position.left + ttWidth + 30 > $(window).innerWidth()){
                                    scope.tt_placement = "left";
                                }
                                else {
                                    scope.tt_placement = "right";
                                }

                                switch ( scope.tt_placement ) {
                                    case 'right':
                                        ttPosition = {
                                            top: position.top + position.height / 2 - ttHeight / 2,
                                            left: position.left + position.width
                                        };
                                        break;
                                    case 'bottom':
                                        ttPosition = {
                                            top: position.top + position.height,
                                            left: position.left + position.width / 2 - ttWidth / 2
                                        };
                                        break;
                                    case 'left':
                                        ttPosition = {
                                            top: position.top + position.height / 2 - ttHeight / 2,
                                            left: position.left - ttWidth
                                        };
                                        break;
                                    default:
                                        ttPosition = {
                                            top: position.top - ttHeight,
                                            left: position.left + position.width / 2 - ttWidth / 2
                                        };
                                        break;
                                }

                                ttPosition.top += 'px';
                                ttPosition.left += 'px';

                                // Now set the calculated positioning.
                                tooltip.css( ttPosition );

                            };

                            scope.tt_isOpen = false;
                            scope.tt_animation =  options.animation;
                            scope.tt_content = type;
                            scope.tt_placement = options.placement;
                            scope.tt_popupDelay = options.popupDelay;

                            // Show the tooltip with delay if specified, otherwise show it immediately
                            function showTooltipBind() {
                                if ( scope.tt_popupDelay ) {
                                    if(popupTimeout){ $timeout.cancel(popupTimeout); }
                                    popupTimeout = $timeout( show, scope.tt_popupDelay, false );
                                    popupTimeout.then(function(reposition){reposition();});
                                } else { show()(); }
                            }

                            function hideTooltipBind () { scope.$apply(function () { hide(); }); }

                            // Show the tooltip popup element.
                            function show() {
                                if ( ! scope.tt_content ) { return angular.noop; }
                                createTooltip();

                                // If there is a pending remove transition, we must cancel it, lest the
                                // tooltip be mysteriously removed.
                                if ( transitionTimeout ) { $timeout.cancel( transitionTimeout ); }

                                // Set the initial positioning.
                                tooltip.css({ top: 0, left: 0, display: 'block' });

                                // Now we add it to the DOM because need some info about it. But it's not
                                // visible yet anyway.
                                if ( appendToBody ) { $document.find( 'body' ).append( tooltip ); }
                                else { element.after( tooltip ); }

                                positionTooltip();

                                // And show the tooltip.
                                scope.tt_isOpen = true;
                                scope.$digest(); // digest required as $apply is not called

                                // Return positioning function as promise callback for correct
                                // positioning after draw.
                                return positionTooltip;
                            }

                            // Hide the tooltip popup element.
                            function hide() {
                                // First things first: we don't show it anymore.
                                scope.tt_isOpen = false;
                                //if tooltip is going to be shown after delay, we must cancel this
                                $timeout.cancel( popupTimeout );

                                // And now we remove it from the DOM. However, if we have animation, we
                                // need to wait for it to expire beforehand.
                                //if ( scope.tt_animation ) {
                                  //  transitionTimeout = $timeout(removeTooltip, 50);
                                //} else {
                                removeTooltip();
                                //}
                            }

                            function createTooltip() {
                                // There can only be one tooltip element per directive shown at once.
                                if (tooltip) { removeTooltip(); }
                                tooltip = tooltipLinker(scope, function () {});
                                // Get contents rendered into the tooltip
                                scope.$digest();
                            }

                            function removeTooltip() {
                                if (tooltip) {
                                    tooltip.remove();
                                    tooltip = null;
                                }
                            }

                            scope.$watch('hoveredFlat', function (hovFlat , prev){
                                if(prev.extFlatId !== hovFlat.extFlatId || prev.hovered !== hovFlat.hovered){
                                    var show2 = function(){
                                        scope.hoveredFlatCached = hovFlat;
                                        if(hovFlat.status !== 3) { scope.hoveredFlatCached.updDate = false; }
                                        showTooltipBind();
                                        };
                                    if(hovFlat.hovered === 1){
                                        if (watchTimeout){ watchTimeout.then(show2); }
                                        else { watchTimeout = $timeout(show2); }
                                    }
                                    else {
                                        if (watchTimeout){ $timeout.cancel(watchTimeout); }
                                        watchTimeout = $timeout(hideTooltipBind);
                                    }
                                }
                            });
                            if ( appendToBody ) {
                                scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess () {
                                    if ( scope.tt_isOpen ) {
                                        hide();
                                    }
                                });
                            }

                            // Make sure tooltip is destroyed and removed.
                            scope.$on('$destroy', function onDestroyTooltip() {
                                $timeout.cancel( transitionTimeout );
                                $timeout.cancel( popupTimeout );
                                //unregisterTriggers();
                                removeTooltip();
                            });
                        };
                    }
                };
            };
        }];
    })
    .value('Commute',
        {
            flatsStat: [], //graphs options
            priceStat: [],
            flatTypesStat: [],
            availFlatsQhist: [],
            selDate: undefined, //date picker options
            startDate: undefined,
            stopDate: undefined
        }
    );