'use strict';

angular.module('nbsApp.directives', ['ui.bootstrap'])
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

            var flatN = attr.nbsFlat;

            scope.$watch('r9mk.flats[' + flatN + ']',
                function (flat){
                    if(typeof flat !== 'undefined') {
                        scope.flat = flat;
                    }
            });
        }
        return {
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
            templateUrl: 'partials/flatPopover.html'
        };
    })
    .directive('saleStatusChart', ['Commute', function (commute) {
        function link(scope, elem){
            function countFlats(data){
                var key, res = 0;
                for (key in data) {
                    res += data[key].q;
                }
                return res;
            }
            scope.data = commute;
            var width = 360, height = 170, radius = Math.min(width, height) / 2,
                color = d3.scale.ordinal().range(["#5cb85c", "#f0ad4e", "#d9534f"]),
                arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0),
                g,
                legend,
                pie,
                flatQ,

                svg = d3.select(elem[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + 75 + "," + height / 2 + ")");

            scope.$watch('data.flatsStat', function(data){
                //console.log(data);
                if(data.length === 0) { return; }
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
                        return (res>8)?res + "%":'';
                    });

                legend = svg.append("g")
                    .attr("class","legend")
                    .selectAll("g").data(data)
                    .enter().append('g')
                    .each(function(d, i){
                        var g = d3.select(this);

                        g.append("rect")
                            .attr("x", 100)
                            .attr("y", -50 + i*25)
                            .attr("width", 10)
                            .attr("height", 10)
                            .style("fill",color(d.name));

                        g.append("text")
                            .attr("x", 100 + 18)
                            .attr("y", -41 + i*25)
                            .attr("height", 30)
                            .attr("width", 100)
                            .style("fill",'black')
                            .text(d.name);
                    });

            });
        }
        return {
            restrict: 'A',
            scope: { },
            link:link
        };
    }])
    .directive('saleStatusChart2', ['Commute', function (commute) {
        function link(scope, elem){

            scope.data = commute;
            /*dataset2 = [
                {
                    name: "Cт",
                    q: 326,
                    values:{"0":154,"1":134,"3":38}
                },
                {
                    name: "1-к",
                    q: 168,
                    values:{"0":61,"1":35,"3":72}
                },
                {
                    name: "2-к",
                    q: 154,
                    values:{"0":88,"1":39,"3":27}
                },
                {
                    name: "3-к",
                    q: 157,
                    values: {"0":54,"1":76,"3":27}
                },
                {
                    name: "4-к",
                    q: 12,
                    values: {"0":10,"1":0,"3":2}
                }
                ],*/
            var arr  = [],
                saleStatText = { 0:"придержано", 1:"в продаже", 3:"продано" },
                flatQ,
                width = 250,
                height = 170,
                color, color2,
                arc, arc2,
                radius = Math.min(width, height) / 2,
                legend,
                svg = d3.select(elem[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + 100 + "," + height / 2 + ")"),
                pie = d3.layout.pie().sort(null).value(function(d) { return d.q; }),
                g;
                
            scope.$watch('data.flatTypesStat', function(data, prevData){
                if(data.length === 0 || data === prevData) { return; }
                color = d3.scale.ordinal()
                    .range(["#57B7FF", "#A19EFF", "#FFB252", "#8CDC66", "#FF616B"]);
                color2 = d3.scale.ordinal().range(["yellow", "#25da29"]);
                arc = d3.svg.arc().outerRadius(radius).innerRadius(0.2 * radius);
                arc2 = d3.svg.arc().outerRadius(radius).innerRadius(0.8 * radius);
                svg.selectAll('*').remove();
                arr = [];
                flatQ = d3.sum(data, function(val) { return val.q; });
                data.forEach(function(elem){
                    var trans = [], key;
                    for (key in elem.values){
                        trans.push({
                            text: saleStatText[key] + " " + Math.floor(elem.values[key]*100/elem.q) + "% " + elem.name,
                            q:elem.values[key]
                        });
                    }
                    arr = arr.concat(trans.reverse());
                });

                g = svg.selectAll(".arc")
                    .data(pie(data))
                    .enter().append("g")
                    .attr("class", "arc");

                g.append("path").attr("d", arc)
                    .style("fill", function(d) { return color(d.data.name); });

                g.append("text")
                    .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                    .attr("fill","white")
                    .attr("class","pieChartLabels")
                    .style("text-anchor", "middle")
                    .text(function(d) {
                        var res = Math.floor(d.data.q*100/flatQ);
                        return (res>8)?res + "%":'';
                    });

                g.append("svg:title")
                    .text(function(d){
                        return "всего " + d.data.name + ": " + d.data.q;
                    });

                g = svg.selectAll(".arc2")
                    .data(pie(arr))
                    .enter().append("g")
                    .attr("class", "arc2");

                g.append("path").attr("d", arc2)
                    .attr("fill", function(d, i) {
                        var res;
                        if((i % 3) === 2){
                            res = color(i/3 + 2);
                        }
                        else {res = color2(i); }
                        return res;
                    })
                    .attr("stroke", function(d, i){
                        if(i%3 !== 2) { return 'white'; }
                        else { return ''; }
                    });

                g.append('svg:title')
                    .text(function(d) {
                        return d.data.text;
                    });

                legend = svg.append("g")
                    .attr("class","legend")
                    .selectAll("g").data(data.reverse())
                    .enter().append('g')
                    .each(function(d, i){
                        var g = d3.select(this);
                        if(d.q === 0 ) { return ''; }
                        g.append("rect")
                            .attr("x", 110)
                            .attr("y", -50 + i*25)
                            .attr("width", 12)
                            .attr("height", 12)
                            .style("fill",color(d.name));

                        g.append("text")
                            .attr("x", 110 + 18)
                            .attr("y", -40 + i*25)
                            .attr("height", 30)
                            .attr("width", 100)
                            .style("fill",'black')
                            .text(d.name);
                        g.append("svg:title")
                            .text(function(d){
                                return (d.name === '0')?'студии': d.name + '-комнатные';
                        });
                    });
            });
        }
        return {
            restrict: 'A',
            scope: { },
            link:link
        };
    }])
    .directive('priceHistoryChart', ['Commute', function(commute){
        function link(scope, elem){
            scope.data = commute;
            var margin = {top: 10, right: 30, bottom: 20, left: 40},
                width = 360 - margin.left - margin.right,
                height = 170 - margin.top - margin.bottom,
                dateFormat = d3.time.format("%d.%m"),
                parseDate = d3.time.format("%Y-%m-%d").parse,
                x = d3.time.scale().range([0, width]).nice(),
                y = d3.scale.linear().range([height, 0]).nice(),
                flType,
                periods = {},// {"201401":true; }
                roomsQ = {},
                data2 = [],

                color = d3.scale.ordinal()
                    .range(["#57B7FF", "#A19EFF", "#FFB252", "#8CDC66", "#FF616B"]),

                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickSize(-height, 0)
                    .tickPadding(7)
                    .ticks(5)
                    .tickFormat(dateFormat),

                yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .tickPadding(7)
                    .tickSize(-width, 0)
                    .ticks(5),

                line = d3.svg.line()
                    .interpolate("basis")
                    .x(function(d) { return x(d.week); })
                    .y(function(d) { return y(d.price); }),

                svg = d3.select(elem[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

                div = d3.select(elem[0]).append("div")
                    .classed({'tooltip':true, 'top':true})
                    .style("opacity", 0);

            div.append("div").attr("class","tooltip-arrow");
            div.append("div").attr("class","tooltip-inner");

            /* data = JSON.parse('[{"rooms":"1","week":"201405","price4meter":"108417","flatsQ":"17"}]') */

            scope.$watch('data.priceStat', function(data){
                if(!data || data.length === 0) { return; }
                periods = {};
                roomsQ = {};
                svg.selectAll('*').remove();
                data.forEach(function(entity) {
                    if(!roomsQ[entity.rooms]){
                        roomsQ[entity.rooms] = true;
                    }
                    if(!periods[entity.period]){
                        periods[entity.period] = parseDate(entity.period);
                    }
                });

                color.domain(d3.keys(roomsQ));

                data2 = color.domain().map(function(roomsQ){
                    return {
                        name: roomsQ,
                        values: data
                            .filter(function(entity){ return entity.rooms === roomsQ; })
                            .map(function(d) {
                                return {
                                    week: periods[d.period],
                                    price: Math.round(d.price / 1000)
                                };
                            })
                    };
                });

                x.domain(d3.extent(d3.values(periods)));

                y.domain([
                    d3.min(data2, function(c) {
                        return d3.min(c.values, function(v) {
                            return v.price;
                        });
                    }) * 0.99,
                    d3.max(data2, function(c) {
                        return d3.max(c.values, function(v) {
                            return v.price;
                        });
                    }) * 1.01
                ]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("руб/м2");

                flType = svg.selectAll(".flType")
                    .data(data2)
                    .enter().append("g")
                    .attr("class", "flType");

                flType.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line(d.values); })
                    .style("stroke", function(d) { return color(d.name); })
                    .on("mouseover", function () {
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
                    .on("mouseout", function () {
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
                    .text(function(d) { return (d.name === '0')?'Ст':d.name + "К"; });
            });
        }
        return {
            restrict: 'A',
            scope: { },
            link:link
        };
    }])
    .directive('availFlatsQChart', ['Commute', function(commute){
        function link(scope, elem){
            scope.data = commute;
            function hoverText(roomsQ, num){
                return ((roomsQ === "0")?"студии":roomsQ + "-комнатные") + ": " + num;
            }

            var dateFormat = d3.time.format("%B"),
                parseDate = d3.time.format("%Y%m%d").parse,
                roomsQ = {},
                periods = {},
                legend,
                month,
                div = d3.select(elem[0]).append("div")//tooltip
                    .classed({'tooltip':true, 'top':true})
                    .style("opacity", 0),

                margin = { top: 10, right: 30, bottom: 20, left: 40 },
                width = 360 - margin.left - margin.right,
                height = 170 - margin.top - margin.bottom,

                x = d3.scale.ordinal().rangeRoundBands([0, width], 0.5),
                y = d3.scale.linear().rangeRound([height, 0]),

                color = d3.scale.ordinal()
                    .range(["#99d3ff", "#bab8ff", "#FFBB66", "#bbeaa4", "#FF7a83"]),
                   //.range(["#57B7FF", "#A19EFF", "#FFB252", "#8CDC66", "#FF616B"]),
                   //.range(["#b9e1FF", "#e1e0ff", "#ffd299", "#d8f3cb", "#ffd0d3"]),

                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(5)
                    .tickSize(0,0,0)
                    .tickPadding(5)
                    .tickFormat(dateFormat),

                yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .tickSize(4,0,0)
                    .ticks(5),

                svg = d3.select(elem[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            div.append("div").attr("class","tooltip-arrow");
            div.append("div").attr("class","tooltip-inner");

            /* data = [{"rooms":"1","period":"201405","flatsQ":"17"}] */

            scope.$watch('data.availFlatsQhist', function(data){
                if(!data || data.length === 0) { return; }
                //console.log(data);
                periods = {};
                roomsQ = {};

                svg.selectAll('*').remove();

                data.forEach(function(entity) {
                    if(!roomsQ[entity.rooms]){
                        roomsQ[entity.rooms] = true;
                    }
                    if(!periods[entity.period]){
                       periods[entity.period] = true;
                    }
                });

                color.domain(d3.keys(roomsQ));

                data = d3.keys(periods).map(function(period){
                    var res = { types:[] }, y0 = 0;
                    color.domain().forEach(function (roomsQ){
                        var needle = data.filter(function(entity){
                            return entity.period === period && entity.rooms === roomsQ;
                        });
                        res[roomsQ] = 0;
                        if(needle.length > 0){
                            res[roomsQ] = needle[0].flatsQ;
                        }
                        res.types.push({
                            name: roomsQ,
                            flatsQ:hoverText(roomsQ, res[roomsQ]),
                            y0: y0,
                            y1: y0 += +res[roomsQ]
                        });
                    });
                    res.total = res.types[res.types.length - 1].y1;
                    res.period = parseDate(period + "01");
                    return res;
                });

                x.domain(data.map(function(d) { return d.period; }));
                y.domain([0, d3.max(data, function(d) { return d.total; })]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("квартир в продаже");

                month = svg.selectAll(".month")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "g")
                    .attr("transform", function(d) { return "translate(" + x(d.period) + ",0)"; });

                month.selectAll("rect")
                    .data(function(d) { return d.types; })
                    .enter().append("rect")
                    .attr("width", x.rangeBand())
                    .attr("y", function(d) { return y(d.y1); })
                    .attr("height", function(d) { return y(d.y0) - y(d.y1); })
                    .style("fill", function(d) { return color(d.name); })
                    .append("svg:title")
                    .text(function(d){
                        return d.flatsQ;
                    });

                legend = svg.selectAll(".legend")
                    .data(color.domain().slice().reverse())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) { return "translate(0," + i * 16 + ")"; });

                legend.append("rect")
                    .attr("x", width - 35)
                    .attr("width", 12)
                    .attr("height", 12)
                    .style("fill", color)
                    .append("svg:title")
                    .text(function(d){
                        return (d === '0')?'студии':d+'-комнатные';
                    });

                legend.append("text")
                    .attr("x", width)
                    .attr("y", 6)
                    .attr("dy", ".35em")
                    .style("text-anchor", "end")
                    .text(function(d) { return (d === '0')?'Ст':d+'-к'; });
            });
        }
        return {
            restrict: 'A',
            scope: {},
            link:link
        }
    }]);