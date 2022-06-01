import _ from 'lodash';
import moment from 'moment';
import * as $ from 'jquery';


angular.module('nbsApp.services', [])
    .factory('logAjaxFail', function(){
        return function(prefix){
            return function(rsp){
                console.log('%s HTTP request failed with response %O', prefix, rsp);
            };
        };
    })
    .factory('Flat', ['$http', '$q', 'logAjaxFail', function($http, $q, logAjaxFail){
        var flat = function(args){
            this.config = {};
            this.salesInfo = {};

            if(args.data && args.bId){
                this.bId = args.bId;
                this.config.id = +args.data.id;
                this.config.extId = +args.data.extId;
                this.config.floor = +args.data.floor;
                this.config.sectId = +args.data.sectId;
                this.config.num = +args.data.num;
                this.config.roomQ = +args.data.roomQ;
                this.config.square = +args.data.square;
                this.config.type = +args.data.type;
            }
            else{
                console.warn('Flat constructor didn\'t get data object or building Id in args %O. Can\'t create an object.', args);
            }
        };

        //building, API adress?
        flat.prototype.config = {
            id: 0,//db id
            extId: 0,//id from the source
            floor: 0,//starting from one
            nOnFloor: 0,
            roomQ: 0,//quantity of rooms
            sectId: 0,
            square: 0,
            type: 0
        };

        flat.prototype.salesInfo = {
            cleanHistory:[],
            startDate: {},
            stopDate: {},
            price: 0,
            status: 0
        };

        flat.prototype.cleanSalesInfo = function(){
            var self = this;
            _.each(this.salesInfo, function(property, key){
                delete self.salesInfo[key];
            });
        };

        flat.prototype.updateSalesInfo = function(salesInfo){
            this.salesInfo.price = +salesInfo.price;
            this.salesInfo.status = +salesInfo.status;
            this.salesInfo.stopDate = this.salesInfo.status === 3 && +salesInfo.updDate;
            this.salesInfo.startDate = +salesInfo.startDate;
        };

        flat.prototype.loadHistory = function(){
            var self = this;
            //console.log('flat.loadHistory: flat: %O', self);

            //status undefined means that there is no history for this flat
            if(typeof this.salesInfo.status !== 'undefined' && !self.salesInfo.cleanHistory) {
                return $http.get("https://nbs-static.amalitsky.com/json/bd" + self.bId + "/flats/" + self.config.id + ".json")
                    .then(function ({ data }) {
                        //TODO remove reverse - update server
                        self.salesInfo.cleanHistory = self.proccessHistoryAfterLoad(data.reverse());
                        self.salesInfo.fullHistory = data.reverse();
                    })
                    .catch(logAjaxFail('flat.loadHistory'));
            }
            else{
                return $q.when(true);//should be immediately resolved
            }
        };

        flat.prototype.proccessHistoryAfterLoad = function(arr){
            var lastPeriodKey, lastSoldKey;

            arr.forEach(function(val, key, arr){
                val.status = +val.status;
                val.date = +val.date;
                val.price = +val.price;
                val.prices = [{//need this when have one period with different prices
                    price: val.price,
                    date: val.date
                }];

                //need to filter out periods when flat was hidden(sold) less than for N days
                if(val.status === 3 && (typeof lastPeriodKey === 'undefined' ||
                    moment.unix(val.date).startOf('day').add(3, 'days')
                        .isBefore(moment.unix(arr[lastPeriodKey].startDate).startOf('day')))) {
                    lastSoldKey = key;
                }
                else{//onSale
                    if(typeof lastPeriodKey === 'undefined' || typeof lastSoldKey !== 'undefined'){
                        lastPeriodKey = key;
                        val.display = true;
                        val.startDate = val.date;
                        if(typeof lastSoldKey !== 'undefined'){
                            val.endDate = arr[lastSoldKey].date;
                        }
                    }
                    else{//shift start to earlier date if we have few following onSale statuses
                        arr[lastPeriodKey].startDate = val.date;
                        arr[lastPeriodKey].prices.push({//save price of filtered out snapshot in previous item
                            price: val.price,
                            date: val.date
                        });
                    }
                    lastSoldKey = undefined;
                }
            });

            arr = _.filter(arr, function(row){ return row.display; });

            arr.forEach(function(row){
                delete row.status;
                delete row.date;
                delete row.price;
                delete row.display;

                row.prices = _.uniq(row.prices, false, function(price){
                    return price.price;
                });
            });
            //console.log(arr);
            return arr;
        };

        flat.prototype.destroy = angular.noop;

        return flat;
    }])
    .service('nbsR9mk', ['$http', '$q', 'Flat', function($http, $q, Flat){
        var logFail = function(rsp, msg){
                console.log('R9mkModel: AJAX failed with response: %O and message: %s.', rsp, msg);
            };

        this.flLoaded = false;
        this.flats = {};
        this.snapsCache = {};
        this.flatsStat = [];
        this.priceStat = [];
        this.flatTypesStat = [];
        this.availFlatsQhist = [];
        this.buildings = {
            1:{
                name: "Novokosino, building 1",
                nameRu: "Первый корпус ЖК Новокосино",
                flatsQ: 1177,
                startDate: '2014-02-05',
                stopDate: undefined,
                isConsistent: false, //show warning if building was not observed from early beginning
                flatTypes: {0: 246, 1:557, 2:292, 3:82} //types of flat and it's quantity in the building
            },
            2:{
                name: "Novokosino, building 2",
                nameRu: "Второй корпус ЖК Новокосино",
                flatsQ: 864,
                startDate: '2014-02-05',
                stopDate: undefined,
                isConsistent: false,
                flatTypes: {0: 384, 1: 288, 2: 144, 3:48 }
            },
            3:{
                name: "Novokosino, building 3",
                nameRu: "Третий корпус ЖК Новокосино",
                flatsQ: 817,
                startDate: '2014-03-20',
                stopDate: undefined,
                isConsistent: true,
                flatTypes: {0: 326, 1:168, 2:154, 3:157, 4:12 }
            }
        };

        this.init = function(bId){
            var self = this;

            this.bId = bId;
            return $http.get("https://nbs-static.amalitsky.com/json/bd" + self.bId + "/bd" + self.bId + "_flats.json")
                .then(function({data: flats}){
                    //console.log('creation of new flats');
                    _.each(flats, function(flatConfig){
                        self.flats[flatConfig.id] = new Flat({ data: flatConfig, bId: self.bId });
                    });
                    self.flLoaded = true;
                    return true;
                })
                .catch(logFail);
        };

        this.loadPriceHistory = function(){
            var self = this;
            return $http.get("https://nbs-static.amalitsky.com/json/bd" + self.bId + "/bd" + self.bId + "_price_hist.json")
                .then(function({ data }){
                    self.priceStat = data;
                })
                .catch(logFail);
        };

        this.loadAvailFlatsQhistory = function(){
            var self = this;
            return $http.get("https://nbs-static.amalitsky.com/json/bd" + this.bId + "/bd" + this.bId + "_availFlatsQ_hist.json")
                .then(function({ data }){
                    self.availFlatsQhist = data;
                })
                .catch(logFail);
        };
        //we load current statuses for provided date - need to empty all sales date and update with new
        this.loadSnap = function(data){
            //console.log('loadSnap data: %O', data);
            var
                self = this,
                updatedFlats = {},// flatId: true
                flatsStatNum = { 1:0, 3:0 },
                flatsTypesStat = {
                    0: {1:0, 3:0},//studios
                    1: {1:0, 3:0},
                    2: {1:0, 3:0},
                    3: {1:0, 3:0},
                    4: {1:0, 3:0}
                };

            //loaded flat status can be either 1 or 3 and can't be zero
            data.forEach(function(flat){
                updatedFlats[flat.id] = true;

                self.flats[flat.id].updateSalesInfo(flat);

                flatsStatNum[self.flats[flat.id].salesInfo.status]++;
                flatsTypesStat[self.flats[flat.id].config.type][self.flats[flat.id].salesInfo.status]++;
            });

            _.each(self.flats, function(flat, key){
                if (!updatedFlats[key]){
                    flat.cleanSalesInfo();
                }
            });

            this.flatsStat = [
                {
                    stat:1,
                    q:flatsStatNum[1],
                    name:"в продаже"
                },
                {
                    stat:3,
                    q:flatsStatNum[3],
                    name:"продано"
                },
                {
                    stat:0,
                    q:(this.buildings[this.bId].flatsQ - flatsStatNum[1] - flatsStatNum[3]),
                    name:"придержано"
                }
            ];

            _.each(this.buildings[this.bId].flatTypes, function(quantity, type){
                type = +type;
                var haveHistory = 0;
                if(!flatsTypesStat[type]) {
                    //all flats of this type have no history yet
                    flatsTypesStat[type] = { 0: quantity };
                }
                else{
                    haveHistory = _.reduce(flatsTypesStat[type], function(base, quantity){
                        return base + quantity;
                    }, 0);
                }
                flatsTypesStat[type][0] = self.buildings[self.bId].flatTypes[type] - haveHistory;
            });

            this.flatTypesStat = [];

            this.flatTypesStat = _.map(flatsTypesStat, function(statObj, type){
                return {
                    name: (type === 0) ? "Cт" : (type + "-к"),
                    q: self.buildings[self.bId].flatTypes[type] || 0,
                    values: statObj
                };
            });
        };

        this.toDate = function(date){
            function dateToFileName(){
                if(!date) { return 'recent'; }
                if(!(date instanceof Date)){
                    date = new Date(date);
                }
                var d, m, y;
                d = date.getDate();
                if (d < 10) { d = '0' + d;}

                m = date.getMonth() + 1;
                if (m < 10) { m = '0' + m; }

                y = date.getFullYear();
                return '' + y + m + d;
            }

            var
                self = this,
                fileName = dateToFileName();

            if (this.snapsCache[fileName]){
                console.log('took snap from cache: ' + fileName);
                this.loadSnap(this.snapsCache[fileName]);
                return $q.when(true);
            }
            else {
                return $http.get("https://nbs-static.amalitsky.com/json/bd" + this.bId + "/bd" + this.bId + "_dump_" + fileName + ".json")
                    .then(function({ data }){
                        // console.log('loaded snap: ' + fileName);
                        self.snapsCache[fileName] = data;
                        self.loadSnap(data);
                    })
                    .catch(logFail);
            }
        };

        this.destroy = function(){
            var self = this;

            this.flLoaded = false;
            this.snapsCache = {};
            this.flatsStat = [];
            this.priceStat = [];
            this.availFlatsQhist = [];
            this.flatTypesStat = [];

            _.each(this.flats, function(flat, id){
                flat.destroy();
                delete self.flats[id];
            });
        };
    }])
    .value('Commute',
        {
            flatsStat: [], //graphs options
            priceStat: [],
            flatTypesStat: [],
            availFlatsQhist: [],
            selDate: undefined, //date picker options
            startDate: undefined,
            stopDate: undefined
        })
    .factory('popover',['$timeout', '$rootScope', function($timeout, $rootScope){
        var popover = function(config){
            /* config example, got redefined in a place of use */
            var self = this;

            this.config = {
                parent: [[50,50],[100,100]],
                className: '',
                position: 'bottom',
                repositioning: false,//if we pass html and don't know size of popover in advance
                width: 100,
                height: 100,
                //margin: 5,//from window borders
                carat: false,
                hide: {
                    outClick: true,
                    //mouseOut: true,
                    //timeout: false,
                    //innerClick: false,
                    //parentMouseOut,
                    onEscape: true,
                    onWinResize: true
                }
            };

            if(config){
                angular.extend(this.config, config);
            }

            if(config.hide && config.hide.parentMouseOut){
                config.hide.mouseOut = true;
            }

            //if parent was hidden by scroll event, let's hide popover
            this._onScrollListener = _.throttle(function(event){
                if(!self.isParentVisible($(event.target))){
                    self.hide();
                }
                else {
                    self.reposition();
                }
            }, 10);

            this.scrollableParents = [];

            this.popover = false;
            this.carat = false;

        };

        /* to distinguish clicks inside popover or outside */
        popover.prototype.elemIsInside = function(elem) {
            var carat = this.carat && (elem === this.carat[0] || this.carat.has(elem).length);
            return this.popover && (elem === this.popover[0] || this.popover.has(elem).length)
                || carat;
        };

        popover.prototype.hideOnBodyClick = function(e){
            //console.log('hideBodyOnClick execution: target: %O, popover parent: %O', e.target, this.parent);
            if(!this.elemIsInside(e.target) && (!this.parent || e.target !== this.parent[0])){
                this.hide();
            }
            /* click on the element, which evoked popover */
            if(this.parent && e.target === this.parent[0]){
                e.stopPropagation();
                e.preventDefault();
            }
        };

        popover.prototype.hideOnEscape = function(e){
            if (e.which === 27){
                this.hide();
                e.stopPropagation();
                e.preventDefault();
            }
        };

        popover.prototype.hideOnWindowResize = function(){
            this.hide();
        };

        //need this properties for event  listeners removal. The list here is for the reference only.
        popover.prototype._onBodyClickListener = undefined;
        popover.prototype._onEscapeListener = undefined;
        popover.prototype._onScrollListener = undefined;
        popover.prototype._onWindowResizeListener = undefined;
        popover.prototype._onParentMouseOutListener = undefined;
        popover.prototype._onMouseOutListener = undefined;

        /**
         * Checks if parent of popover is fully visible, otherwise we won't show or will hide Popover.
         * When we use it having onScroll event we don't need to check all scrollableParent, but one
         * from which we've got an event itself.
         *
         * @param target {Object} - jQuery object of event.target when use on scroll event
         * @returns {Boolean}
         * */
        popover.prototype.isParentVisible = function(target){
            //if box of the element is out of the view even for one pixel
            function isNotVisible (elm, parent){
                var
                    elmOffset = elm.offset(),
                    parentOffset = parent.scrollTop() || { top: $(document).scrollTop() },//for document element
                    elmHeight = elm.outerHeight(),
                    parentHeight = parent.outerHeight();

                return parentOffset.top + parentHeight < elmOffset.top + elmHeight || elmOffset.top < parentOffset.top;
            }

            var self = this, res;

            if(target){//check only scrolled parent
                res = isNotVisible(this.parent, target);
            }
            else {//check all scrollable parents
                res = _.any(this.scrollableParents, function (parent) {
                    return isNotVisible(self.parent, parent);
                });
            }

            //console.log('parent is visible call, target is %s defined, result: %s', (!target && 'not' || ''), !res);
            return !res;
        };

        //need to know where to put scroll event listeners
        popover.prototype._findScrollableParents = function(){
            function isScrollable(node){
                return node.css('overflow') === 'scroll' || node.css('overflow') === 'auto'
                    || node.css('overflowY') === 'scroll' || node.css('overflowY') === 'auto';
            }
            var
                node = this.parent,
                weAreDone,
                scrollableParents = [];

            if(this.parent) {
                while(!weAreDone && node && node[0] && node[0].tagName &&
                    !(node[0].tagName === 'HTML' || node[0].tagName === 'BODY')){
                    if (isScrollable(node)){
                        scrollableParents.push(node);
                    }
                    //no point in going deeper as scroll events on parents won't work for the fixed children
                    if(node.css('position') === 'fixed'){
                        weAreDone = true;
                        //console.log("we've found fixed ones");
                    }
                    //in case of absolutely positioned element should care only about offsetParent
                    else if(node.css('position') === 'absolute'){
                        node = node.offsetParent();
                    }
                    else{
                        node = node.parent();
                    }
                }
            }

            if(!weAreDone) {//if we are not inside fixed, should care about generic scroll
                scrollableParents.push($(window));
            }

            return scrollableParents;
        };

        popover.prototype._calcPosition = function(useActualSize){
            function clipValue(min, max, val){
                if(max < min){
                    console.warn('limitValue: max %i is less than min %i', max, min);
                }
                return Math.round(Math.min(max, Math.max(min, val)));
            }

            var
                parent = [[],[]],//[[0, 0],[50, 50]] top+left & bottom+right positions
                popover,
                carat = {
                    height: 10,
                    width: 10
                },
                carMargin = 5,
                parentPos,
                margin,//margin from window borders
                popPos = {},
                carPos = {};

            popover = {
                height: useActualSize && this.popover.outerHeight() || this.config.height,
                width: useActualSize && this.popover.outerWidth() || this.config.width
            };

            margin = (typeof this.config.margin !== 'undefined') ? this.config.margin : 0;

            if(this.parent){
                parentPos = this.parent.offset();
                parent = [
                    [parentPos.left, parentPos.top - $(window).scrollTop()],
                    [parentPos.left + this.parent.outerWidth(), parentPos.top - $(window).scrollTop() + this.parent.outerHeight()]
                ];
            }
            else{
                parent = this.config.parent;
            }

            /*if(useActualSize){
             console.log('useActualSize: width: %i, height: %i', popover.width, popover.height);
             }*/

            if(this.config.position === 'top'){
                popPos.bottom = $(window).height() - parent[0][1];
                if(this.config.carat){
                    carPos.bottom = popPos.bottom + carat.height + 2;
                    popPos.bottom += carat.height;
                }
                popPos.left = (parent[0][0] + parent[1][0])/2 - popover.width/2;
                carPos.left = (parent[0][0] + parent[1][0])/2 - carat.width;
            }
            else if (this.config.position === 'bottom'){
                popPos.top = parent[1][1];
                if(this.config.carat){
                    carPos.top = popPos.top - carat.height + 2;
                    popPos.top += carat.height;
                }
                popPos.left = (parent[0][0] + parent[1][0])/2 - popover.width/2;
                carPos.left = (parent[0][0] + parent[1][0])/2 - carat.width;
            }
            else if(this.config.position === 'left'){
                popPos.right = $(window).width() - parent[0][0];
                if(this.config.carat){
                    carPos.right = popPos.right + carat.width + 2;
                    popPos.right += carat.width;
                }
                popPos.top = (parent[0][1] + parent[1][1])/2 - popover.height/2;
                carPos.top = (parent[0][1] + parent[1][1])/2 - carat.height + 2;
            }
            else if(this.config.position === 'right'){
                popPos.left = parent[1][0];
                if(this.config.carat){
                    carPos.left = popPos.left - carat.width + 2;
                    popPos.left += carat.width;
                }
                popPos.top = (parent[0][1] + parent[1][1])/2 - popover.height/2;
                carPos.top = (parent[0][1] + parent[1][1])/2 - carat.height + 2;
            }

            //console.log('popover position top: %i, bottom: %i, window.scrollTop: %i', popPos.top, popPos.bottom, window.scrollTop);

            _.each(popPos, function(val, key){
                //check position to be inside inside viewport with set margins
                if(key === 'left' || key === 'right'){
                    val = clipValue(margin, $(window).width() - popover.width - margin, val);
                }
                else if (key === 'bottom' || key === 'top'){
                    val = clipValue(margin, $(window).height() - popover.height - margin, val);
                }
                popPos[key] = val;
            });

            if(this.config.carat){
                if(this.config.position === 'left' || this.config.position === 'right'){
                    carMargin = { vertical: margin, horizontal: -2*carat.width };
                }
                else{
                    carMargin = { vertical: -2*carat.width, horizontal: margin };
                }

                if(carPos.left){
                    carPos.left = clipValue(popPos.left + carMargin.horizontal, popPos.left + popover.width - carMargin.horizontal, carPos.left);
                }
                else{
                    carPos.right = clipValue(popPos.right + carMargin.horizontal, popPos.right + popover.width - carMargin.horizontal, carPos.right);
                }
                if(carPos.top){
                    carPos.top = clipValue(popPos.top + carMargin.vertical, popPos.top + popover.height - carMargin.vertical, carPos.top);
                }
                else{
                    carPos.bottom = clipValue(popPos.bottom + carMargin.vertical, popPos.bottom + popover.height - carMargin.vertical, carPos.bottom);
                }
            } else {//say no to environmental pollution
                carPos = undefined;
            }

            //console.log('popover init, parent: %O, position: %s, popover: %O, carat: %O, actualSize: ', parent, this.config.position, popPos, carPos, useActualSize);

            return [popPos, carPos];
        };

        popover.prototype.setOnScrollListeners = function(){
            var self = this;

            this.scrollableParents.forEach(function(parent){
                parent.scroll(self._onScrollListener);
            });
        };

        popover.prototype.removeScrollListeners = function(){
            var self = this;
            //console.log('removeScrollListeners');

            this.scrollableParents.forEach(function(parent){
                parent.unbind('scroll', self._onScrollListener);
            });
        };

        /* parent - element which evoked popover, optional */
        popover.prototype.init = function(parent){
            var
                self = this,
                pos;

            if(parent){
                this.parent = $(parent);
            }

            if(this.popover || this.carat){
                this.remove();
            }

            this.scrollableParents = this._findScrollableParents();

            pos = this._calcPosition();

            this.popover = $('<div/>')
                .addClass('popover ' + this.config.className)
                .css('display', 'none')
                .css(pos[0])
                .on('mouseleave', self.remove);

            if(this.config.html){
                this.popover
                    .html(this.config.html)
                    .appendTo('body');

                if(this.config.repositioning){
                    $timeout(function(){
                        self.reposition();
                    }, 0);
                    //console.log('reposition, popover width: %i', this.popover.outerWidth());
                }
            }

            if(this.config.carat){
                this.carat = $('<div/>')
                    .addClass('popoverCarat ' + this.config.className + ' ' + this.config.position)
                    .css('display', 'none')
                    .css(pos[1]);

                this.carat.appendTo('body');
            }
        };

        popover.prototype.setHideListeners = function(){
            var
                self = this,
                body = $('body')[0];

            if(this.config.hide) {
                if (this.config.hide['outClick']) {
                    //hook to be able to delete function after click
                    this._onBodyClickListener = this.hideOnBodyClick.bind(this);
                    body.addEventListener('click', this._onBodyClickListener, true);
                }

                if (this.config.hide['onEscape']) {
                    this._onEscapeListener = this.hideOnEscape.bind(this);
                    ['keydown', 'keyup'].forEach(function(eType){
                        body.addEventListener(eType, self._onEscapeListener, true);
                    });
                }

                if (this.config.hide['innerClick']) {
                    this.popover.click(function (e) {
                        $timeout(self.hide.bind(self));
                    });
                }

                if (this.config.hide['mouseOut']) {
                    this._onMouseOutListener = function(event){
                        var target = event.toElement;
                        if(!target ||
                            !(self.elemIsInside(target) || target === self.parent || self.parent.has(target).length)){
                            self.hide();
                        }
                    };
                    this.popover.on('mouseout', this._onMouseOutListener);
                    if(this.config.carat){
                        this.carat.on('mouseout', this._onMouseOutListener);
                    }
                }

                if (this.config.hide['parentMouseOut']) {
                    this._onParentMouseOutListener = function(event){
                        var target = event.toElement;
                        if(!event.toElement || !(self.elemIsInside(event.toElement) || target === self.parent || self.parent.has(target).length)){

                            self.hide();
                        }
                    };
                    this.parent.on('mouseout', this._onParentMouseOutListener);
                }

                if(this.config.hide['onWinResize']){
                    this._onWindowResizeListener = $rootScope.$on('repaint', this.hideOnWindowResize.bind(this));
                }
            }
        };

        popover.prototype.show = function(){
            var self = this;

            if(this.config.repositioning){
                $timeout(function(){
                    self.reposition();
                });
            }

            if(this.popover && this.popover.is(':hidden') && this.isParentVisible()){
                //console.log('show');
                this.popover.show();

                this.setOnScrollListeners();
                this.setHideListeners();
            }
            else{
                console.log('still visible');
            }
            if(this.carat){
                this.carat.show();
            }
        };
        //when we don't know popover size in advance have to check and update position after appending
        popover.prototype.reposition = function(){
            var pos;

            if(!this.popover){ return; }

            pos = this._calcPosition(true);

            this.popover.css(pos[0]);//offset takes only top and left

            //console.log('reposition: %i', pos[0].top);

            if(this.config.carat){
                this.carat.css(pos[1]);
            }
        };

        popover.prototype.removeHideListeners = function(){
            var
                self = this,
                body = $('body')[0];

            if(this.config.hide) {
                if (this.config.hide['outClick']) {
                    body.removeEventListener('click', this._onBodyClickListener, true);
                    delete this._onBodyClickListener;
                }

                if (this.config.hide['onEscape']) {
                    //need timeout here to handle (stopPropagation) keyup event coming right after keypress
                    $timeout(function() {
                        ['keydown', 'keyup'].forEach(function (eType) {
                            body.removeEventListener(eType, self._onEscapeListener, true);
                        });
                    });
                    delete this._onEscapeListener;
                }

                if (this.config.hide['mouseOut']) {
                    this.popover.unbind('mouseout', this._onMouseOutListener);
                    if(this.config.carat){
                        this.carat.unbind('mouseout', this._onMouseOutListener);
                    }
                    delete this._onMouseOutListener;
                }

                if (this.config.hide['parentMouseOut']) {
                    this.parent.unbind('mouseout', this._onParentMouseOutListener);
                    delete this._onParentMouseOutListener;
                }

                if(this.config.hide['onWinResize']){
                    this._onWindowResizeListener();//angularJS $on listener, other way to remove
                    delete this._onWindowResizeListener;
                }
            }
        };

        popover.prototype.hide = function(){
            //console.log('popover hide, carat: %s, carat is visible: %s', this.carat, this.carat.is(':visible'));
            if(this.popover && this.popover.is(':visible')){
                this.popover.hide();
                this.removeScrollListeners();
                this.removeHideListeners();
            }
            if(this.carat){
                this.carat.hide();
            }
        };

        popover.prototype.remove = function(){
            if(this.popover){
                this.hide();
                this.popover.remove();
                this.popover = false;
            }
            if(this.carat){
                this.carat.remove();
                this.carat = false;
            }
        };

        return popover;
    }]);
