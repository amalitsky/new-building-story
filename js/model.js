function R9mkModel(){
    "use strict";
    var self = this,
        logFail = function(xhr, text, error){
            console.log('R9mkModel: AJAX failed with message: "' + error + '".');
        };

    this.flLoaded = false;
    this.flats = {};
    this.snapsCache = {};
    this.flatsStat = [];
    this.priceStat = [];
    this.availFlatsQhist = [];
    this.buildings = {
        1:{
            name: "Novokosino, building 1",
            nameRu: "Первый корпус ЖК Новокосино",
            flatsQ: 1177,
            startDate: '2014-02-05',
            stopDate: undefined,
            isConsistent: false //show warning if building was not observed from early beginning
        },
        2:{
            name: "Novokosino, building 2",
            nameRu: "Второй корпус ЖК Новокосино",
            flatsQ: 864,
            startDate: '2014-02-05',
            stopDate: undefined,
            isConsistent: false
        },
        3:{
            name: "Novokosino, building 3",
            nameRu: "Третий корпус ЖК Новокосино",
            flatsQ: 817,
            startDate: '2014-03-20',
            stopDate: undefined,
            isConsistent: true
        }
    };

    this.init = function(bId){
        this.bId = bId;
        return $.ajax({
                url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_flats.json.gz",
                dataType: "json",
                context: self
            })
            .done(function(flats){
                this.flats = flats;
                this.flLoaded = true;
                })
            .fail(logFail);
        };

    this.loadPriceHistory = function(){
        return $.ajax({
            url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_price_hist.json.gz",
            dataType: "json",
            context: self
        }).done(function(data){
            this.priceStat = data;
        })
        .fail(logFail);
    };

    this.loadAvailFlatsQhistory = function(){
        return $.ajax({
            url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_availFlatsQ_hist.json.gz",
            dataType: "json",
            context: self
        }).done(function(data){
            this.availFlatsQhist = data;
        })
        .fail(logFail);
    };


    this.loadSnap = function(xhrObj){
        function clearFlat(flat){
            flat.status = undefined;
            flat.price = undefined;
            flat.updDate = undefined;
            flat.startDate = undefined;
            return flat;
        }
        var key,
            updatedFlats = {},// flatId: true
            flatsStatNum = { 1:0, 3:0 };

        xhrObj.forEach(function(flat){
            if(this.flats[flat.id] !== undefined){
                updatedFlats[flat.id] = true;
                this.flats[flat.id].price = +flat.price;
                this.flats[flat.id].status = +flat.status;
                this.flats[flat.id].updDate = +flat.updDate;
                this.flats[flat.id].startDate = +flat.startDate;
                flatsStatNum[this.flats[flat.id].status]++;
            }

        for (key in this.flats){
            if (!updatedFlats[key] && this.flats.hasOwnProperty(key) && this.flats[key].status){
                this.flats[key] = clearFlat(this.flats[key]);
            }
         }

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
        }, this);
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
            return y + m + d;
            }

        var fileName = dateToFileName();

        if (this.snapsCache[fileName]){
            //console.log('took snap from cache: ' + fileName);
            this.loadSnap(this.snapsCache[fileName]);
            return $.Deferred().resolve();
        }
        else {
            return $.ajax({
                url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_dump_" + fileName + ".json.gz",
                dataType: "json"
            })
            .done(function(data){
                //console.log('loaded snap: ' + fileName);
                self.snapsCache[fileName] = data;
                self.loadSnap(data);
                })
            .fail(logFail);
        }
    };

    this.destroy = function(){
        this.flLoaded = false;
        this.snapsCache = {};
        this.flats = {};
        this.flatsStat = [];
        this.priceStat = [];
        this.availFlatsQhist = [];
    };
}

