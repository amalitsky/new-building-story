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
    .directive('nbsPopover', [ '$nbsTooltip', function ( $tooltip ) {
        return $tooltip( 'nbsPopover', 'nbsPopover', 'mouseenter' );
    }])
    .directive('nbsPopoverPopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { flat: '=', placement: '@', animation: '&', isOpen: '&' },
            templateUrl: '/partials/flatPopover.html'
        };
    })
    .directive('saleStatusChart', function () {
        function link(scope, elem){
            function countFlats(data){
                var key, res = 0;
                for (key in data) {
                    res += data[key].q;
                }
                return res;
            }
            /*var data = [
                {stat:1, q:172, name:"в продаже" },
                {stat:3, q:151, name:"продано" },
                {stat:0, q:494, name:"не было" }
            ];*/
            var flatQ = countFlats(scope.data);
            console.log(flatQ);
            var width = 340, height = 150, radius = Math.min(width, height) / 2;
            var color = d3.scale.ordinal().range(["#5cb85c", "#f0ad4e", "#d9534f"]);
            var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0);
            var pie = d3.layout.pie().sort(null).value(function(d) { return d.q; });
/*
            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            var g = svg.selectAll(".arc")
                .data(pie(scope.data))
                .enter().append("g")
                .attr("class", "arc");

            g.append("path").attr("d", arc)
                .attr('stroke','#ffffff')
                .style("fill", function(d) { return color(d.data.name); });

            g.append("text")
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("fill","white")
                .attr("class","pieChartLabels")
                .style("text-anchor", "middle")
                .text(function(d) { return Math.round (d.data.q*100/flatQ)+'%'; });

            var legend = svg.append("g").attr("class","legend");

            legend.selectAll("g").data(scope.data)
                .enter().append('g')
                .each(function(d,i){
                    var g = d3.select(this);
                    g.append("rect")
                        .attr("x", 80)
                        .attr("y", -25 + i*25)
                        .attr("width", 10)
                        .attr("height",10)
                        .style("fill",color(d.name));

                    g.append("text")
                        .attr("x", 80 + 18)
                        .attr("y", -17 + i*25)
                        .attr("height",30)
                        .attr("width",100)
                        .style("fill",'black')
                        .text(d.name);*/
                //});
        }
        return {
            restrict: 'EA',
            scope: { data: "=" },
            link:link
        };
    });