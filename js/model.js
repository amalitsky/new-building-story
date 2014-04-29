function R9mkModel(bId){
    "use strict";
    var self = this;
    this.flLoaded = false;
    this.flatsStat = [];
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

    this.init = function(){
        return $.ajax({
            url:"/jsdb/bd" + bId + "_flats.json",
            dataType: "json",
            context: self
        })
        .done(function(data){
            this.flats = data;
            this.flLoaded = true;
            });
        };
    this.loadRecent = function(){
        return $.ajax({
            url:'jsdb/bd' + bId + '_dump_recent.json',
            dataType: "json",
            context: self
        })
        .done(function(data) { this.loadSnap(data); });
    };
    this.loadSnap = function(xhrObj){
        this.flatsStat = { 1:0, 3:0 };
        xhrObj.forEach(function(flat){
            if(this.flats[flat.id] !== undefined){
                this.flats[flat.id].price = +flat.price;
                this.flats[flat.id].status = +flat.status;
                this.flats[flat.id].updDate = +flat.updDate;
                this.flatsStat[this.flats[flat.id].status]++;
            }
        this.flatsStat = [
            {stat:1, q:172, name:"в продаже" },
            {stat:3, q:151, name:"продано" },
            {stat:0, q:494, name:"не было" }
        ];
        }, this);
        //console.log(this.flatsStat);
    };

    //init(bId);
    //load price stats
    //count info about sales status
}

