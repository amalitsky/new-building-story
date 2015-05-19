'use strict';

angular.module('nbsApp.directives', ['ui.bootstrap'])
    .directive('nbsFlat', ['$compile', '$timeout', '$templateCache', 'popover', function ($compile, $timeout, $templateCache, PopoverClass) {
        function link(scope, elem, attr) {
            var
                overTimeout,
                popoverTemplate, popoverConfig, popover,
                flatN = +attr.nbsFlat;

            popoverTemplate = $templateCache.get('partials/flatPopover.html:popover');

            popoverConfig = {
                className: 'flatInfo',
                repositioning: true,
                carat: true,
                position: 'right',
                hide:{
                    parentMouseOut: true
                }
            };

            popover = new PopoverClass(popoverConfig);

            popover.hide = function(){
                var self = this;
                PopoverClass.prototype.hide.call(this);
                $timeout(function(){
                    self.remove();
                });
            };

            /*var historyDebug = function(flat, type){
                var str, format = 'DD/MM/YY';
                if(type) {
                    str = flat.full_history.reduce(function (base, row) {
                        return base + moment.unix(row.date).format(format) + ' - ' + (row.status === 1 ? 'onSale' : 'sold') + ' (' + row.price + ')' + ' < ';
                    }, '');
                }
                else{
                    str = flat.history_displ.reduce(function (base, row) {
                        return base + moment.unix(row.startDate).format(format) + ' - ' + (row.endDate ? moment.unix(row.endDate).format(format) : 'now') + '(' + row.prices.length + ')' + ' < ';
                    }, '');
                }
                return str;
            };*/

            elem.mouseover(function (event) {
                if (event.relatedTarget && (event.target.isEqualNode(event.relatedTarget.parentNode) ||
                    event.relatedTarget.isEqualNode(event.target.parentNode))) {
                    return;
                }

                if(scope.r9mk.flats[flatN]){
                    scope.r9mk.flats[flatN].loadHistory();

                    if (overTimeout) {
                        $timeout.cancel(overTimeout);
                    }
                    overTimeout = $timeout(function () {
                        popover.config.html = $compile(popoverTemplate)(scope);
                        popover.init(elem);
                        popover.show();
                    }, 99);
                }
                //console.log('Flat %s: displ_hist: %s, full_hist: %s', flatN, historyDebug(scope.flat, 1), historyDebug(scope.flat));
            });

            elem.mouseout(function (event) {
                //console.log(event.toElement);
                if (event.relatedTarget && (event.target.isEqualNode(event.relatedTarget.parentNode) ||
                    event.relatedTarget.isEqualNode(event.target.parentNode))) {
                    return;
                }
                if (overTimeout) {
                    $timeout.cancel(overTimeout);
                    overTimeout = undefined;
                }
            });

            scope.$watch('r9mk.flats[' + flatN + ']',
                function (flat) {
                    if (typeof flat !== 'undefined') {
                        scope.flat = flat;
                    }
                }, true);
        }

        return {
            scope: true,
            link: link
        };
    }])
    //ordinary pie chart
    .directive('saleStatusChart', ['Commute', function (commute) {
        function link(scope, elem) {
            function countFlats(data) {
                var key, res = 0;
                for (key in data) {
                    res += data[key].q;
                }
                return res;
            }

            var
                width = 360, height = 170,
                radius, className,
                arc, g, chart, legend,
                pie, flatQ, svg;

            scope.data = commute;

            radius = Math.min(width, height) / 2;
            className = d3.scale.ordinal().range(['available', 'sold', 'hold']);
            arc = d3.svg.arc().outerRadius(radius - 2).innerRadius(Math.round((radius - 2) *.2));

            svg = d3.select(elem[0]).append('svg')
                .attr({'width': width, 'height': height})
                .append('g')
                .attr('transform', 'translate(' + 80 + ',' + height / 2 + ')');

            chart = svg.append('g')
                .attr({
                    'class': 'chart',
                    'transform': 'translate(' + Math.floor(width/10) + ')'
                });

            pie = d3.layout.pie().sort(null)
                .value(function (d) { return d.q; });

            chart
                .append('circle')
                .attr({
                    r: radius - 1,
                    'class': 'background'
                });

            chart
                .append('circle')
                .attr({
                    r: Math.round((radius - 2) * 0.2) - 1,
                    'class': 'inner-background'
                });

            legend = svg.append('g')
                .attr({
                    'class': 'legend',
                    'transform': 'translate(140, -35)'
                });

            scope.$watch('data.flatsStat', function (data) {
                if (!data || !data.length) { return; }
                flatQ = countFlats(data);

                chart.selectAll('*:not(.background):not(.inner-background)').remove();

                g = chart
                    .selectAll('.arc-sale-type')
                    .data(pie(data))
                    .enter().append('g')
                    .attr('class', function (d) {
                        return 'arc-sale-type ' + className(d.data.name);
                    });

                g.append('path').attr('d', arc);

                g.append('text')
                    .attr({
                        'transform': function (d) {
                            return "translate(" + arc.centroid(d) + ")";
                        },
                        'class': 'pieChartLabels'
                    })
                    .text(function (d) {
                        var res = Math.round(d.data.q * 100 / flatQ);
                        return (res > 8) ? res + "%" : '';
                    });

                legend
                    .selectAll('g').data(data)
                    .enter().append('g')
                    .each(function (d, i) {
                        var g = d3.select(this);

                        g.append('rect')
                            .attr({
                                'x': 0,
                                'y': 0 + i * 25,
                                'width': 12,
                                'height': 12,
                                'class': className(d.name)
                            });

                        g.append('text')
                            .attr({
                                'x': 18,
                                'y': 9 + i * 25,
                                'height': 30,
                                'width': 100
                            })
                            .text(d.name);
                    });
            });
        }

        return {
            restrict: 'A',
            scope: {},
            link: link
        };
    }])
    //tricky pie chart
    .directive('saleStatusChart2', ['Commute', function (commute) {
        function link(scope, elem) {

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
            var arr = [],
                saleStatText = {0: "придержано", 1: "в продаже", 3: "продано"},
                flatQ,
                width = 360, height = 170,
                saleStatus, flatType,
                arc, arc2, radius, pie,
                svg, chart, legend, g;

            scope.data = commute;

            flatType = d3.scale.ordinal()
                .range(['flat0br', 'flat1br', 'flat2br', 'flat3br', 'flat4br']);

            saleStatus = d3.scale.ordinal().range(['sold', 'available', 'hold']);

            radius = Math.min(width, height) / 2;

            arc = d3.svg.arc().outerRadius(radius - 1).innerRadius(0.2 * (radius - 0));
            arc2 = d3.svg.arc().outerRadius(radius - 1).innerRadius(0.8 * (radius - 0));

            pie = d3.layout.pie().sort(null).value(function (d) {
                return d.q;
            });

            svg = d3.select(elem[0]).append("svg")
                .attr({
                    'width': width,
                    'height': height
                })
                .append("g")
                .attr("transform", "translate(" + 100 + "," + height / 2 + ")");

            chart = svg.append('g')
                .attr({
                    'class': 'chart',
                    'transform': 'translate(' + Math.floor(width/10) + ')'
                });

            chart
                .append('circle')
                .attr({
                    r: radius,
                    'class': 'background'
                });

            chart
                .append('circle')
                .attr({
                    r: Math.round((radius - 2) * 0.2) - 1,
                    'class': 'inner-background'
                });

            legend = svg.append('g').attr({
                'class': 'legend',
                'transform': 'translate(140, -70)'
            });

            scope.$watch('data.flatTypesStat', function (data, prevData) {
                if (!data || !data.length || data === prevData) {
                    return;
                }

                chart.selectAll('*:not(.background):not(.inner-background)').remove();

                arr = [];

                flatQ = d3.sum(data, function (val) {
                    return val.q;
                });

                data.forEach(function (elem) {
                    var trans = [], key;
                    for (key in elem.values) {
                        trans.push({
                            text: saleStatText[key] + " " + Math.floor(elem.values[key] * 100 / elem.q) + "% " + elem.name,
                            q: elem.values[key]
                        });
                    }
                    arr = arr.concat(trans.reverse());
                });

                g = chart.selectAll(".arc-flat-type")
                    .data(pie(data))
                    .enter().append("g")
                    .attr('class', function (d) {
                        return 'arc-flat-type ' + flatType(d.data.name);
                    });

                g.append('path').attr('d', arc);

                g.append('text')
                    .attr({
                        'transform': function (d) {
                            return 'translate(' + arc.centroid(d) + ')';
                        },
                        'class': 'pieChartLabels white'
                    })
                    .text(function (d) {
                        var res = Math.floor(d.data.q * 100 / flatQ);
                        return (res > 8) ? res + "%" : '';
                    });

                g.append("svg:title")
                    .text(function (d) {
                        return "всего " + d.data.name + ": " + d.data.q;
                    });

                g = chart.selectAll('.arc-sale-type')
                    .data(pie(arr))
                    .enter().append('g')
                    .attr('class', function (d, i) {
                        return 'arc-sale-type inner ' + saleStatus(i);
                    });

                g.append('path').attr('d', arc2);

                g.append('svg:title')
                    .text(function (d) {
                        return d.data.text;
                    });

                legend
                    .selectAll('g').data(data.reverse())
                    .enter().append('g')
                    .each(function (d, i) {
                        var g = d3.select(this);
                        if (d.q === 0) {
                            return '';
                        }
                        g.append('rect')
                            .attr({
                                'x': 0,
                                'y': i * 25,
                                'width': 12,
                                'height': 12,
                                'class': flatType(d.name)
                            });

                        g.append("text")
                            .attr({
                                'x': 18,
                                'y': 10 + i * 25,
                                'height': 30,
                                'width': 100
                            })
                            .text(d.name);

                        g.append("svg:title")
                            .text(function (d) {
                                return (d.name === 'Cт') ? 'студии' : d.name + '-комнатные';
                            });
                    });
            });
        }

        return {
            restrict: 'A',
            scope: {},
            link: link
        };
    }])
    .directive('priceHistoryChart', ['Commute', function (commute) {
        function link(scope, elem) {
            var margin, width, height,
                parseDate, x, y,
                flType, periods = {},// {"201401":true; }
                roomsQ = {}, data2 = [],
                flatType, xAxis, yAxis,
                line, svg, div;

            scope.data = commute;

            margin = {top: 10, right: 30, bottom: 20, left: 40};
            width = 360 - margin.left - margin.right;
            height = 170 - margin.top - margin.bottom;
            parseDate = d3.time.format("%Y-%m-%d").parse;
            x = d3.time.scale().range([0, width]).nice();
            y = d3.scale.linear().range([height, 0]).nice();

            flatType = d3.scale.ordinal()
                .range(['flat0br', 'flat1br', 'flat2br', 'flat3br', 'flat4br']);

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickSize(-height, 0)
                .tickPadding(7)
                .ticks(6)
                .tickFormat(d3.time.format("%b"));

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickPadding(7)
                .tickSize(-width, 0)
                .ticks(5);

            line = d3.svg.line()
                .interpolate("basis")
                .x(function (d) {
                    return x(d.week);
                })
                .y(function (d) {
                    return y(d.price);
                });

            svg = d3.select(elem[0]).append("svg")
                .attr({
                    "width": width + margin.left + margin.right,
                    "height": height + margin.top + margin.bottom
                })
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            div = d3.select(elem[0]).append("div")
                .classed({'tooltip': true, 'top': true})
                .style("opacity", 0);

            div.append("div").attr("class", "tooltip-arrow");
            div.append("div").attr("class", "tooltip-inner");

            /* data = JSON.parse('[{"rooms":"1","week":"201405","price4meter":"108417","flatsQ":"17"}]') */

            scope.$watch('data.priceStat', function (data) {
                if (!data || data.length === 0) {
                    return;
                }

                periods = {};
                roomsQ = {};

                svg.selectAll('*').remove();

                data.forEach(function (entity) {
                    if (!roomsQ[entity.rooms]) {
                        roomsQ[entity.rooms] = true;
                    }
                    if (!periods[entity.period]) {
                        periods[entity.period] = parseDate(entity.period);
                    }
                });

                flatType.domain(d3.keys(roomsQ));

                data2 = flatType.domain().map(function (roomsQ) {
                    return {
                        name: roomsQ,
                        values: data
                            .filter(function (entity) {
                                return entity.rooms === roomsQ;
                            })
                            .map(function (d) {
                                return {
                                    week: periods[d.period],
                                    price: Math.round(d.price / 1000)
                                };
                            })
                    };
                });

                x.domain(d3.extent(d3.values(periods)));

                y.domain([
                    d3.min(data2, function (c) {
                        return d3.min(c.values, function (v) {
                            return v.price;
                        });
                    }) * 0.99,
                    d3.max(data2, function (c) {
                        return d3.max(c.values, function (v) {
                            return v.price;
                        });
                    }) * 1.01
                ]);

                svg.append("g")
                    .attr({
                        "class": "x axis",
                        "transform": "translate(0," + height + ")"
                    })
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr({
                        "transform": "rotate(-90)",
                        "y": 6,
                        "dy": ".71em"
                    })
                    .style("text-anchor", "end")
                    .text("т.руб/м2");

                flType = svg.selectAll(".flType")
                    .data(data2)
                    .enter().append("g")
                    .attr("class", "flType");

                flType.append("path")
                    //.attr("class", "line")
                    .attr("d", function (d) {
                        return line(d.values);
                    })
                    .attr("class", function (d) {
                        return 'line ' + flatType(d.name);
                    })
                    .on("mouseover", function () {
                        var m = d3.mouse(this);
                        d3.select(this).style("stroke-width", "3.5");

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
                        d3.select(this).style("stroke-width", "2");
                        div.transition()
                            .duration(200)
                            .style("opacity", 0)
                            .each('end', function () {
                                div.style("left", -100 + "px")
                                    .style("top", -100 + "px");
                            });
                    });

                flType.append("text")
                    .datum(function (d) {
                        return {
                            name: d.name,
                            value: d.values[d.values.length - 1]
                        };
                    })
                    .attr("transform", function (d) {
                        return "translate(" + x(d.value.week) + "," + y(d.value.price) + ")";
                    })
                    .attr("x", ".2em")
                    .text(function (d) {
                        return (d.name === '0') ? 'Ст' : d.name + "К";
                    });
            });
        }

        return {
            restrict: 'A',
            scope: {},
            link: link
        };
    }])
    .directive('availFlatsQChart', ['Commute', function (commute) {
        function link(scope, elem) {
            function hoverText(roomsQ, num) {
                return ((roomsQ === "0") ? "студии" : roomsQ + "-комнатные") + ": " + num;
            }

            var
                margin, width, height,
                x, y, dateFormat,
                roomsQ = {}, periods = {},
                legend, month,
                div, svg,
                xAxis, yAxis, parseDate,
                flatType;

            scope.data = commute;

            dateFormat = d3.time.format("%b");
            parseDate = d3.time.format("%Y%m%d").parse;

            div = d3.select(elem[0]).append("div")//tooltip
                .classed({'tooltip': true, 'top': true})
                .style("opacity", 0);

            margin = {top: 10, right: 30, bottom: 20, left: 40};
            width = 360 - margin.left - margin.right;
            height = 170 - margin.top - margin.bottom;

            x = d3.scale.ordinal().rangeRoundBands([0, width], 0.5);
            y = d3.scale.linear().rangeRound([height, 0]);

            flatType = d3.scale.ordinal()
                .range(['flat0br', 'flat1br', 'flat2br', 'flat3br', 'flat4br']);

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(5)
                .tickSize(0, 0, 0)
                .tickPadding(5)
                .tickFormat(dateFormat);

            yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickSize(4, 0, 0)
                .ticks(5);

            svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            div.append("div").attr("class", "tooltip-arrow");
            div.append("div").attr("class", "tooltip-inner");

            legend = svg.append('g').attr({
                'class': 'legend',
                'transform': 'translate(285)'
            });

            /* data = [{"rooms":"1","period":"201405","flatsQ":"17"}] */

            scope.$watch('data.availFlatsQhist', function (data) {
                if (!data || data.length === 0) {
                    return;
                }
                //console.log(data);
                periods = {};
                roomsQ = {};

                svg.selectAll('*:not(.legend)').remove();

                data.forEach(function (entity) {
                    if (!roomsQ[entity.rooms]) {
                        roomsQ[entity.rooms] = true;
                    }
                    if (!periods[entity.period]) {
                        periods[entity.period] = true;
                    }
                });

                flatType.domain(d3.keys(roomsQ));

                data = d3.keys(periods).map(function (period) {
                    var res = {types: []}, y0 = 0;
                    flatType.domain().forEach(function (roomsQ) {
                        var needle = data.filter(function (entity) {
                            return entity.period === period && entity.rooms === roomsQ;
                        });
                        res[roomsQ] = 0;
                        if (needle.length > 0) {
                            res[roomsQ] = needle[0].flatsQ;
                        }
                        res.types.push({
                            name: roomsQ,
                            flatsQ: hoverText(roomsQ, res[roomsQ]),
                            y0: y0,
                            y1: y0 += +res[roomsQ]
                        });
                    });
                    res.total = res.types[res.types.length - 1].y1;
                    res.period = parseDate(period + "01");
                    return res;
                });

                x.domain(data.map(function (d) {
                    return d.period;
                }));
                y.domain([0, d3.max(data, function (d) {
                    return d.total;
                })]);

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
                    .attr("transform", function (d) {
                        return "translate(" + x(d.period) + ",0)";
                    });

                month.selectAll("rect")
                    .data(function (d) {
                        return d.types;
                    })
                    .enter().append("rect")
                    .attr("width", x.rangeBand())
                    .attr("y", function (d) {
                        return y(d.y1);
                    })
                    .attr("height", function (d) {
                        return y(d.y0) - y(d.y1);
                    })
                    .attr("class", function (d) {
                        return flatType(d.name);
                    })
                    .append("svg:title")
                    .text(function (d) {
                        return d.flatsQ;
                    });

                legend.selectAll("g")
                    .data(flatType.domain().slice().reverse())
                    .enter().append("g")
                    .each(function(d, i){
                        var g = d3.select(this);

                        g.append('rect')
                            .attr({
                                'x': 0,
                                'y': i * 25,
                                'width': 12,
                                'height': 12,
                                'class': flatType(d)
                            });

                        g.append("text")
                            .attr({
                                'x': 18,
                                'y': 10 + i * 25,
                                'height': 30,
                                'width': 100
                            })
                            .text(function (d) {
                                return (d === '0') ? 'Ст' : d + '-к';
                            });

                        g.append("svg:title")
                            .text(function (d) {
                                return (d === '0') ? 'студии' : d + '-комнатные';
                            });
                    });

            });
        }

        return {
            restrict: 'A',
            scope: {},
            link: link
        }
    }]);
