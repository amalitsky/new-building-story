'use strict';

angular.module('nbsApp.directives', ['d3'])
    .directive('nbsFlat', ['$position', '$timeout', function($position, $timeout) {
    function link(scope, elem, attr){
        var overTimeout;
        elem.mouseover(function (event){ if (event.relatedTarget && (event.target.isEqualNode(event.relatedTarget.parentNode) ||
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
    .directive('saleStatusChart', ['d3Service', 'Commute', function (d3, commute) {
        function link(scope, elem){
            function countFlats(data){
                var key, res = 0;
                for (key in data) {
                    res += data[key].q;
                }
                return res;
            }
            scope.data = commute;
            var width = 340, height = 160, radius = Math.min(width, height) / 2;
            var color = d3.scale.ordinal().range(["#5cb85c", "#f0ad4e", "#d9534f"]);
            var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0);
            var g;
            var legend;
            var pie;
            var flatQ;

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + 75 + "," + height / 2 + ")");

            scope.$watch('data.flatsStat', function(data){
                if(data.length === 0) { return;}
                flatQ = countFlats(data);
                svg.selectAll('*').remove();
                pie = d3.layout.pie().sort(null).value(function(d) { return d.q; });
                g = svg.selectAll(".arc")
                    .data(pie(data))
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
                    .text(function(d) {
                        var res = Math.round(d.data.q*100/flatQ);
                        return (res>8)?res+"%":'';
                    });

                legend = svg.append("g")
                    .attr("class","legend")
                    .selectAll("g").data(data)
                    .enter().append('g')
                    .each(function(d,i){
                        var g = d3.select(this);
                        g.append("rect")
                            .attr("x", 80)
                            .attr("y", -30 + i*25)
                            .attr("width", 10)
                            .attr("height", 10)
                            .style("fill",color(d.name));

                        g.append("text")
                            .attr("x", 80 + 18)
                            .attr("y", -21 + i*25)
                            .attr("height", 30)
                            .attr("width", 100)
                            .style("fill",'black')
                            .text(d.name);
                    });

            });
        }
        return {
            restrict: 'EA',
            scope: { data: "=" },
            link:link
        };
    }])
    .directive('priceHistoryChart', ['d3Service', 'Commute', function(d3, commute){
        function link(scope, elem){
            scope.data = commute;
            var margin = {top: 10, right: 30, bottom: 20, left: 40},
                width = 330 - margin.left - margin.right,
                height = 170 - margin.top - margin.bottom;
            var dateFormat = d3.time.format("%d.%m");
            var parseDate = d3.time.format("%Y-%m-%d").parse;
            var x = d3.time.scale().range([0, width]).nice();
            var y = d3.scale.linear().range([height, 0]).nice();
            var flType;
            var weeks = {},// {"201401":true; }
                flatTypes = {};// {"0":true; "2":true }

            var color = d3.scale.ordinal()
                .range(["#57B7FF", "#A19EFF", "#FFB252", "#8CDC66", "#FF616B"]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickSize(-height, 0)
                .tickPadding(7)
                .ticks(5)
                .tickFormat(dateFormat);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickPadding(7)
                .tickSize(-width, 0)
                .ticks(5);

            var line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) { return x(d.week); })
                .y(function(d) { return y(d.price); });

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var div = d3.select(elem[0]).append("div")
                .classed({'tooltip':true, 'top':true})
                .style("opacity", 0);

            div.append("div").attr("class","tooltip-arrow");
            div.append("div").attr("class","tooltip-inner");

            //var data = JSON.parse('[{"0":"132819","1":"114199","2":"104038","3":"101815","0q":"82","1q":"58","2q":"24","3q":"54","4q":"2","week":"201412"},{"0":"133002","1":"113951","2":"103549","3":"101800","4":"85000","0q":"99","1q":"79","2q":"25","3q":"54","4q":"2","week":"201413"},{"0":"133363","1":"113558","2":"103741","3":"101989","4":"85000","0q":"110","1q":"51","2q":"26","3q":"60","4q":"1","week":"201414"},{"0":"133515","1":"113466","2":"103967","3":"101875","0q":"100","1q":"41","2q":"23","3q":"54","week":"201415"},{"0":"133474","1":"113563","2":"103974","3":"101699","0q":"94","1q":"41","2q":"20","3q":"49","week":"201416"},{"0":"133822","1":"113956","2":"105028","3":"102156","0q":"144","1q":"45","2q":"44","3q":"81","week":"201417"}]');
            //var data = JSON.parse('[{"0":"141001","1":"106736","2":"102964","3":"100210","0q":"2","1q":"5","2q":"16","3q":"10","week":"201405"},{"0":"139883","1":"107950","2":"102728","3":"98891","0q":"4","1q":"1","2q":"20","3q":"5","week":"201406"},{"0":"142352","2":"104200","3":"100050","0q":"2","2q":"6","3q":"3","week":"201408"},{"0":"142352","2":"105210","3":"102139","0q":"2","2q":"15","3q":"3","week":"201409"},{"0":"142232","1":"112450","2":"105277","3":"102419","0q":"3","1q":"2","2q":"11","3q":"5","week":"201410"},{"0":"141232","1":"98068","2":"106087","3":"104245","0q":"3","1q":"1","2q":"17","3q":"7","week":"201411"},{"0":"141558","1":"112650","2":"105663","3":"104047","0q":"4","1q":"1","2q":"12","3q":"6","week":"201412"},{"0":"140358","1":"118900","2":"106116","3":"103599","0q":"3","1q":"1","2q":"12","3q":"7","week":"201413"},{"0":"140117","1":"115940","2":"105988","3":"103595","0q":"3","1q":"3","2q":"12","3q":"5","week":"201414"},{"0":"139890","1":"116212","2":"105721","3":"103814","0q":"4","1q":"5","2q":"16","3q":"4","week":"201415"},{"0":"139811","1":"116415","2":"105536","3":"103870","0q":"4","1q":"3","2q":"17","3q":"5","week":"201416"},{"0":"139546","1":"117076","2":"105391","3":"104040","0q":"4","1q":"3","2q":"13","3q":"5","week":"201417"}]');
            //var data = JSON.parse('[{"rooms":"1","week":"201405","price4meter":"108417","flatsQ":"17"},{"rooms":"2","week":"201405","price4meter":"102459","flatsQ":"20"},{"rooms":"3","week":"201405","price4meter":"101388","flatsQ":"21"},{"rooms":"1","week":"201406","price4meter":"108585","flatsQ":"8"},{"rooms":"2","week":"201406","price4meter":"102551","flatsQ":"22"},{"rooms":"3","week":"201406","price4meter":"101339","flatsQ":"18"},{"rooms":"0","week":"201408","price4meter":"140315","flatsQ":"3"},{"rooms":"1","week":"201408","price4meter":"109450","flatsQ":"1"},{"rooms":"2","week":"201408","price4meter":"103685","flatsQ":"17"},{"rooms":"3","week":"201408","price4meter":"102230","flatsQ":"14"},{"rooms":"0","week":"201409","price4meter":"142498","flatsQ":"4"},{"rooms":"1","week":"201409","price4meter":"112450","flatsQ":"2"},{"rooms":"2","week":"201409","price4meter":"105327","flatsQ":"19"},{"rooms":"3","week":"201409","price4meter":"103211","flatsQ":"14"},{"rooms":"0","week":"201410","price4meter":"143719","flatsQ":"4"},{"rooms":"1","week":"201410","price4meter":"112450","flatsQ":"1"},{"rooms":"2","week":"201410","price4meter":"105416","flatsQ":"19"},{"rooms":"3","week":"201410","price4meter":"103093","flatsQ":"12"},{"rooms":"0","week":"201411","price4meter":"142879","flatsQ":"4"},{"rooms":"1","week":"201411","price4meter":"112513","flatsQ":"4"},{"rooms":"2","week":"201411","price4meter":"105745","flatsQ":"19"},{"rooms":"3","week":"201411","price4meter":"103404","flatsQ":"8"},{"rooms":"0","week":"201412","price4meter":"142146","flatsQ":"4"},{"rooms":"1","week":"201412","price4meter":"112566","flatsQ":"5"},{"rooms":"2","week":"201412","price4meter":"105717","flatsQ":"17"},{"rooms":"3","week":"201412","price4meter":"103406","flatsQ":"10"},{"rooms":"0","week":"201413","price4meter":"141999","flatsQ":"5"},{"rooms":"1","week":"201413","price4meter":"112715","flatsQ":"6"},{"rooms":"2","week":"201413","price4meter":"105518","flatsQ":"16"},{"rooms":"3","week":"201413","price4meter":"103194","flatsQ":"8"},{"rooms":"0","week":"201414","price4meter":"142212","flatsQ":"4"},{"rooms":"1","week":"201414","price4meter":"112351","flatsQ":"5"},{"rooms":"2","week":"201414","price4meter":"105599","flatsQ":"17"},{"rooms":"3","week":"201414","price4meter":"103582","flatsQ":"4"},{"rooms":"0","week":"201415","price4meter":"142334","flatsQ":"4"},{"rooms":"1","week":"201415","price4meter":"112295","flatsQ":"5"},{"rooms":"2","week":"201415","price4meter":"105761","flatsQ":"20"},{"rooms":"3","week":"201415","price4meter":"103900","flatsQ":"2"},{"rooms":"0","week":"201416","price4meter":"141512","flatsQ":"3"},{"rooms":"1","week":"201416","price4meter":"112466","flatsQ":"5"},{"rooms":"2","week":"201416","price4meter":"105548","flatsQ":"18"},{"rooms":"3","week":"201416","price4meter":"103900","flatsQ":"2"},{"rooms":"0","week":"201417","price4meter":"141081","flatsQ":"4"},{"rooms":"1","week":"201417","price4meter":"114646","flatsQ":"4"},{"rooms":"2","week":"201417","price4meter":"105920","flatsQ":"18"},{"rooms":"3","week":"201417","price4meter":"104218","flatsQ":"2"}]');

            scope.$watch('data.priceStat', function(data){
                if(!data || data.length === 0) { return; }
                weeks = {};
                flatTypes = {};
                svg.selectAll('*').remove();
                data.forEach(function(entity) {
                    if(!flatTypes[entity.rooms]){
                        flatTypes[entity.rooms] = true;
                    }
                    if(!weeks[entity.week]){
                        weeks[entity.week] = parseDate(entity.week);
                    }
                });
                color.domain(d3.keys(flatTypes));
                var roomsQ = color.domain().map(function(roomsQu){
                    return {
                        name: roomsQu,
                        values: data
                            .filter(function(entity){ return entity.rooms === roomsQu; })
                            .map(function(d) {
                                return {
                                    week: weeks[d.week],
                                    price: Math.round(d.price4meter / 1000),
                                    flatsQ: d.flatsQ
                                };
                            })
                    };
                });

                x.domain( d3.extent(d3.values(weeks)));

                y.domain([
                    d3.min(roomsQ, function(c) { return d3.min(c.values,
                        function(v) { return v.price; }); }) * 0.99,
                    d3.max(roomsQ, function(c) { return d3.max(c.values,
                        function(v) { return v.price; }); }) * 1.01
                ]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                flType = svg.selectAll(".flType")
                    .data(roomsQ)
                    .enter().append("g")
                    .attr("class", "flType");

                flType.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line(d.values); })
                    .style("stroke", function(d) { return color(d.name); })
                    .on("mouseover", function (d, i) {

                        var m = d3.mouse(this);

                        d3.select(this).style("stroke-width","3.5");

                        div[0][0].children[1].innerHTML =
                            d3.time.format("%e %b")(x.invert(m[0])) +
                            "</br>" + Math.round(y.invert(m[1])) + ' 000 р/м<sup>2</sup>';

                        div.style("left", m[0] + 12 + "px")
                            .style("top", m[1] + 14 + "px");

                        div.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                    })
                    .on("mouseout", function (d) {
                        d3.select(this).style("stroke-width","2");
                        div.transition()
                            .duration(200)
                            .style("opacity", 0)
                            .each('end', function(){
                                div.style("left", -100 + "px")
                                .style("top", -100 + "px");
                            });
                    });

                flType.append("text")
                    .datum(function(d) { return {
                        name: d.name,
                        value: d.values[d.values.length - 1]};
                    })
                    .attr("transform", function(d) {
                        return "translate(" + x(d.value.week) + "," + y(d.value.price) + ")";
                    })
                    .attr("x", ".2em")
                    .attr("dy", function(d){
                        var res = 0.3;
                        if(d.name === '3') {
                            res = 0.8;
                        }
                        else if(d.name === '2'){
                            res = 0;
                        }
                        else if(d.name === '4'){
                            res = -0.1;
                        }
                        return res + "em";})
                    .text(function(d) { return (d.name === '0')?'S':d.name; });
            });
        }
        return {
            restrict: 'A',
            scope: { data: "=" },
            link:link
        };
}]);