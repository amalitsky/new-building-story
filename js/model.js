function R9mkModel(bId){
    "use strict";
    var self = this;
    this.flLoaded = false;
    this.buildings = {
        1:{
            name:"Novokosino, building 2",
            nameRu:"Первый корпус ЖК Новокосино"
        },
        2:{
            name:"Novokosino, building 2",
            nameRu:"Второй корпус ЖК Новокосино"
        },
        3:{
            name:"Novokosino, building 3",
            nameRu:"Третий корпус ЖК Новокосино"
        }
    };

    this.init = function(){
        return $.ajax({
            url:"/jsdb/bd" + bId + "_flats_recent.json",
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
            url:'jsdb/bd' + bId + '_full.json.gz',
            dataType: "json",
            context: self
        })
        .done(function(data) { this.loadSnap(data); });
    };
    this.loadSnap = function(xhrObj){
        xhrObj.forEach(function(row){
            if(this.flats[row.extFlatId] !== undefined){
                this.flats[row.extFlatId].price = +row.flPrice;
                this.flats[row.extFlatId].status = +row.flStatus;
            }
        }, this);

    };

    //init(bId);
    //load price stats
    //count info about sales status
}

