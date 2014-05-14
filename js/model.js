function R9mkModel(){
    "use strict";
    var self = this;
    this.flLoaded = false;
    this.flats = {};
    this.flatsOnly = [];
    this.flatsStat = [];
    this.priceStat = [];
    this.availFlatsQhist = [];
    this.buildings = {
        1:{
            name: "Novokosino, building 1",
            nameRu: "Первый корпус ЖК Новокосино",
            flatsQ: 1177,
            startDate: '2014-02-05',
            stopDate:undefined
        },
        2:{
            name: "Novokosino, building 2",
            nameRu: "Второй корпус ЖК Новокосино",
            flatsQ: 864,
            startDate: '2014-02-05',
            stopDate:undefined
        },
        3:{
            name: "Novokosino, building 3",
            nameRu: "Третий корпус ЖК Новокосино",
            flatsQ: 817,
            startDate: '2014-03-20',
            stopDate: undefined

        }
    };

    this.init = function(bId){
        this.bId = bId;
        return $.ajax({
                url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_flats.json.gz",
                dataType: "json"
            })
            /*$.ajax({
                url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_dump_recent.json.gz",
                dataType: "json"
            })*/
            .done(function(flats){
                self.flats = flats;
                self.flLoaded = true;
                //self.loadSnap(dump[0]);
                });
        };

    this.loadPriceHistory = function(){
        return $.ajax({
            url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_price_hist.json.gz",
            dataType: "json",
            context: self
        }).done(function(data){
            this.priceStat = data;
        });
    };

    this.loadAvailFlatsQhistory = function(){
        return $.ajax({
            url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_availFlatsQ_hist.json.gz",
            dataType: "json",
            context: self
        }).done(function(data){
            this.availFlatsQhist = data;
        });
    };


    this.loadSnap = function(xhrObj){
        this.flatsStatNum = { 1:0, 3:0 };
        this.clearFlats();
        xhrObj.forEach(function(flat){
            if(this.flats[flat.id] !== undefined){
                this.flats[flat.id].price = +flat.price;
                this.flats[flat.id].status = +flat.status;
                this.flats[flat.id].updDate = +flat.updDate;
                this.flats[flat.id].startDate = +flat.startDate;
                this.flatsStatNum[this.flats[flat.id].status]++;
            }
        this.flatsStat = [
            {
                stat:1,
                q:this.flatsStatNum[1],
                name:"в продаже"
            },
            {
                stat:3,
                q:this.flatsStatNum[3],
                name:"продано"
            },
            {
                stat:0,
                q:(this.buildings[this.bId].flatsQ - this.flatsStatNum[1] - this.flatsStatNum[3]),
                name:"не было"
            }
        ];
        }, this);
    };

    this.clearFlats = function(){
        var key;
        for (key in this.flats){
           if (this.flats.hasOwnProperty(key)) {
               this.flats[key].status = 0;
           }
        }
    }

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
        return $.ajax({
            url:"jsdb/bd" + this.bId + "/bd" + this.bId + "_dump_" + dateToFileName() + ".json.gz",
            dataType: "json"
        })
        .done(function(data){
            self.loadSnap(data);
            });
    }

    this.destroy = function(){
        this.flLoaded = false;
        this.flatsStat = [];
        this.priceStat = [];
        this.flats = [];
        this.availFlatsQhist = [];
    }
}

