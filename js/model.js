function R9mkModel(){
    "use strict";
    var self = this;
    this.flLoaded = false;
    this.flats = [];
    this.flatsStat = [];
    this.priceStat = [];
    this.availFlatsQhist = [];
    this.buildings = {
        1:{
            name:"Novokosino, building 1",
            nameRu:"Первый корпус ЖК Новокосино",
            flatsQ:1177
        },
        2:{
            name:"Novokosino, building 2",
            nameRu:"Второй корпус ЖК Новокосино",
            flatsQ:864
        },
        3:{
            name:"Novokosino, building 3",
            nameRu:"Третий корпус ЖК Новокосино",
            flatsQ:817
        }
    };

    this.init = function(bId){
        this.bId = bId;
        return $.when(
            $.ajax({
                url:"/jsdb/bd" + this.bId + "_flats.json",
                dataType: "json"
            }),
            $.ajax({
                url:'jsdb/bd' + this.bId + '_dump_recent.json',
                dataType: "json"
            })
        ).done(function(flats, dump){
            self.flats = flats[0];
            self.flLoaded = true;
            self.loadSnap(dump[0]);
            });
        };

    this.loadPriceHistory = function(){
        return $.ajax({
            url:'jsdb/bd' + this.bId + '_price_hist.json',
            dataType: "json",
            context: self
        }).done(function(data){
            this.priceStat = data;
        });
    };

    this.loadAvailFlatsQhistory = function(){
        return $.ajax({
            url:'jsdb/bd' + this.bId + '_availFlatsQ_hist.json',
            dataType: "json",
            context: self
        }).done(function(data){
            this.availFlatsQhist = data;
        });
    };


    this.loadSnap = function(xhrObj){
        this.flatsStatNum = { 1:0, 3:0 };
        xhrObj.forEach(function(flat){
            if(this.flats[flat.id] !== undefined){
                this.flats[flat.id].price = +flat.price;
                this.flats[flat.id].status = +flat.status;
                this.flats[flat.id].updDate = +flat.updDate;
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

    this.destroy = function(){
        this.flLoaded = false;
        this.flatsStat = [];
        this.priceStat = [];
        this.flats = [];
        this.availFlatsQhist = [];
    }
}

