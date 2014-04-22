"use strict";
/**
 * Return array only with unique values of received flat array with Numbers or Strings
 **/
var unique = function(arr){
    var values = {}, res = [];
    arr.forEach(function(elem){
        if(!(values.hasOwnProperty(elem))){
            values[elem] = true;
            res.push(elem);
        }
    });
    return res;
}

var r9mk = {
    buildingProto: {
        fillFloorPlans:function(){
            this.sections.forEach(function(elem, key, sections){
                var floor, flPlans = [];
                for (floor = elem.floorsFrom; floor <= elem.floorsTo; floor++){
                    flPlans[floor] = this.plans[this.getPlanId(key, floor)];
                }
                sections[key].floorPlans = flPlans;
            }, this);
        },
        getPlanId: function(sectId, floor){ return sectId; },
        makeFlats: function (){
            var flatId = 0;
            this.flats = [];
            this.flats4export = {};
            this.sections.forEach(function(section, key, sections){
                var floor, flatObj;
                sections[key].flats = [];
                for(floor = section.floorsFrom; floor <= section.floorsTo; floor++){
                    section.floorPlans[floor].forEach(function(flat, numberOnPlan) {
                        flatObj = {
                            bId: this.bId,
                            floor: floor,
                            //flatId:flatId,
                            flatExtId: this.flatStartExtId + flatId,
                            flatNumber: flatId+1,
                            numberOnFloor: numberOnPlan + 1,
                            roomsQ: flat[0],
                            square: flat[1],
                            type:(flat[0] === 1 && flat[1] < 34)? 0 : flat[0],
                            curStatus: undefined,
                            curPrice: undefined
                        };
                        this.flats[this.flatStartExtId + flatId] = flatObj;
                        this.flats4export[this.flatStartExtId + flatId] = flatObj;
                        sections[key].flats.push(flatObj);
                        flatId++;
                    }, this);
                };
            }, this);
        }
    },
    buildings: [
        {
            bId: 1,
            extBid: 1708,
            flatStartExtId:126496,
            link:"novokosino.ndv.ru/sale/?build=1708",
            name:"Novokosino, building 1",
            nameRu:"Первый корпус ЖК Новокосино",
            sections:[
                { bId:1, sectId:1, flatsNfrom:1, flatsQ:144, floorsFrom: 2, floorsTo: 25, floorPlans: [], flats: [] },
                { bId:1, sectId:2, flatsNfrom:145, flatsQ:240, floorsFrom: 2, floorsTo: 25 },
                { bId:1, sectId:3, flatsNfrom:385, flatsQ:240, floorsFrom: 2, floorsTo: 25 },
                { bId:1, sectId:4, flatsNfrom:625, flatsQ:240, floorsFrom: 2, floorsTo: 25 },
                { bId:1, sectId:5, flatsNfrom:865, flatsQ:264, floorsFrom: 2, floorsTo: 25 },
                { bId:1, sectId:6, flatsNfrom:1129, flatsQ:49, floorsFrom: 2, floorsTo: 11 }
            ],
            plans: [
                [[2,69.12], [3,94.29], [2,63.36], [2,63.33], [3,92.79], [2,68.62]],
                [[1,30.37], [1,42.5], [2,69.4], [1,46.24],[1,46.24],[1,46.24],[1,46.24],[2,69.39],[1,41.2],[1,30.5]],
                [[1,30.37], [1,42.5], [2,69.39], [1,46.24],[1,46.24],[1,46.24],[1,46.24],[2,69.39],[1,42.32],[1,30.37]],
                [[1,30.36], [1,42.33], [2,69.4], [1,46.24],[1,46.24],[1,46.24],[1,46.24],[2,69.31],[1,42.33],[1,30.36]],
                [[2,69.54], [1,42.37], [2,74.16], [1,46.24],[1,46.24],[1,46.24],[1,46.24],[1,32.72],[3,78.12],[1,33.59],[1,33.59]],
                [[3,81.85], [1,30.08], [1,30.08], [1,31.13], [1,47.12], [2,57.81]],
                [[3,83.15], [1,30.05], [1,30.05], [1,31.05], [1,47]],
                [[3,83.15], [1,30.05], [1,30.05], [1,31.05]]
            ],
            flats: [],
            getPlanId:function(sectId, floor){
                var planId = sectId;
                if(sectId === 5) {
                    if(floor >= 7) { planId += 2; }
                    else if(floor === 6) { planId += 1; }
                }
                return planId;
            }
        },
        {
            bId: 2,
            extBid: 1709,
            flatStartExtId: 127673,
            link:"novokosino.ndv.ru/sale/?build=1709",
            name:"Novokosino, building 2",
            nameRu:"Второй корпус ЖК Новокосино",
            sections:[
                { bId:2, sectId:1, flatsNfrom:1, flatsQ:240, floorsFrom: 2, floorsTo: 25 },
                { bId:2, sectId:2, flatsNfrom:241, flatsQ:312, floorsFrom: 2, floorsTo: 25 },
                { bId:2, sectId:3, flatsNfrom:553, flatsQ:312, floorsFrom: 2, floorsTo: 25 }
            ],
            plans: [
                [[2,74.89], [3,89.37], [3,83.58], [2,64.76], [1,45.43], [1,45.43], [1,45.43], [1,45.43], [2,69.53], [2,74.25]],
                [[1,50.29], [1,48.37],[1,43.55],[1,29.57],[1,28.76],[1,29.14],[1,29.14],[1,29.14],[1,29.14],[1,29.32],[2,64.73],[1,29.43],[1,49.25]],
                [[1,50.13],[1,49.46],[1,43.08],[1,29.57],[1,28.76],[1,29.14],[1,29.14],[1,29.14],[1,29.14],[1,29.32],[2,64.73],[1,30.18],[1,49.9]]
            ]
        },
        {
            bId: 3,
            extBid: 1710,
            flatStartExtId: 188761,
            isActive: 0,
            link:"novokosino.ndv.ru/sale/?build=1710",
            name:"Novokosino, building 3",
            nameRu:"Третий копус ЖК Новокосино",
            sections:[
                { bId:3, sectId:1, flatsNfrom:1, flatsQ:70, floorsFrom: 3, floorsTo: 16 },
                { bId:3, sectId:2, flatsNfrom:71, flatsQ:64, floorsFrom: 3, floorsTo: 18 },
                { bId:3, sectId:3, flatsNfrom:135, flatsQ:168, floorsFrom: 2, floorsTo: 25 },
                { bId:3, sectId:4, flatsNfrom:303, flatsQ:168, floorsFrom: 2, floorsTo: 25 },
                { bId:3, sectId:5, flatsNfrom:471, flatsQ:168, floorsFrom: 2, floorsTo: 25 },
                { bId:3, sectId:6, flatsNfrom:639, flatsQ:60, floorsFrom: 2, floorsTo: 13 },
                { bId:3, sectId:7, flatsNfrom:699, flatsQ:60, floorsFrom: 2, floorsTo: 13 },
                { bId:3, sectId:8, flatsNfrom:759, flatsQ:60, floorsFrom: 2, floorsTo: 13 }
            ],
            plans:[
                [[3,95.1], [1,45.6], [1,30.6], [1,45.6], [2,72]],
                [[2,74.8], [1,45.8], [1,39.6], [2,58.4]],
                [[3,91.8], [1,28.9], [1,29.6], [1,29.6], [1,47.4], [2,75.4], [3,85.7]],
                [[3,95.4], [1,30.1], [1,30.9], [1,30.9], [1,30.9], [1,30.30], [3,96.3]],
                [[2,70.56], [2,65.8], [1,47.7], [1,29.6], [1,29.6], [1,28.8], [2,74.09]],
                [[3,84.2], [1,45.9], [1,44.2], [1,29.9], [4,121.5]],
                [[3, 89.7], [1,32.7], [1,48.3], [1,47.8], [3,96.7]],
                [[3,78.5], [1,32.1], [1,47.1], [1,31.9], [2,68.8]],
                [[3,91.8], [1,28.9], [1,29.6], [1,29.6], [1,47.4], [2,75.4]] //second floor of third section
            ],
            getPlanId:function(sectId, floor){
                var planId = sectId;
                if(sectId === 2 && floor === 2) { planId = 8; }
                return planId;
            }
        }
    ],
    n:0,
    init:function(bId){
        this.n = bId;
        this.buildings.forEach(function(building, key, buildings){
            buildings[key] = $.extend({}, this.buildingProto, building);
            buildings[key].fillFloorPlans();
            buildings[key].makeFlats();
        }, this);
    },
    drawTable:function(bId){
        function formatPrice(val){}
        function buildFloorsColumn(floorNumOfNextSection){
            var i, str = "<table class='floorsIdColumn'>";
            for(i = floorNumOfNextSection; i > 1; i--){ str += "<tr><td>" + i + "</td></tr>"; }
            return str + "<tr><td>&nbsp;</td></tr></table>";
        }
        function spellRoomNumber(type){
            var res;
            switch (type){
                case 0: res = "studio"; break;
                case 1: res = "1BR"; break;
                case 2: res = "2BR"; break;
                case 3: res = "3BR"; break;
                case 4: res = "4BR"; break;
            }
            return res;
        }
        function buildSectionColumnsLegend(plan){
            function builder(base, flat){
                var
                    flType = (flat[0] === 1 && flat[1] < 34)?0:flat[0],
                    str = base + "<td class='roomsNum_" + flType + "'>";
                str += (flType === 0)?"S":flType;
                str += "</td>";
                return str;
            }
            var str = "<tbody class='sectionColumnsLegend'><tr>" + plan.reduce(builder,"") + "</tr></tbody>";
            return str;
        }
        function floorBuilder(base, flat){
            var str;
            str = base + "<td id='flat_" + flat.flatExtId + "' class='flat roomsNum_" + flat.type + "'><img src='img/window.png' class='";
            //switch(Math.round((Math.random()*2))){
            switch(flat.curStatus){
                case 0: str += "notAvail"; break;
                case 1: str += "sold"; break;
                case 2: str += "avail"; break;
                default: str += "notAvail";
            }
            str += "' />"; //"<div class='window'></div>"
            //str += "<div class='popup'>" + spellRoomNumber(flat.type) + ", " + flat.square + "м<br>цена: " + flat.curPrice + "<br>цена за метр: " + (flat.curPrice/flat.square).toFixed(0) + "<br>номер: " + flat.flatNumber + "</div>";
            str += "</td>";
            return str;
        }
        var str = "<table class='building'><tr>";

        this.buildings[bId].sections.forEach(function (section, key) {
            var
                flatsOnFloor = [],
                maxColumnsNum,
                floor;

            maxColumnsNum = section.floorPlans.reduce(function(prevVal, plan){
                var l = plan.length;
                return (prevVal > l)?prevVal:l;
            }, 0);

            if(key > 0) {
                str += "<td class='floors'>" + buildFloorsColumn(section.floorsTo) + "</td>";
            }
            str += "<td class='section'><table class='section'>";
            str += "<tbody class='flats'>";

            for (floor = section.floorsTo; floor >= section.floorsFrom; floor--){
                flatsOnFloor = section.flats.filter( function (flat) { return flat.floor === floor; });
                str += "<tr>" + flatsOnFloor.reduce(floorBuilder, "");
                str += (maxColumnsNum > flatsOnFloor.length)?("<td colspan='" + (maxColumnsNum - flatsOnFloor.length) + "'>&nbsp;</td>"):"";
                str += "</tr>";
            }

            for (; floor > 1; floor--){ //adding empty floors
                str += "<tr class='emptyFloor'><td colspan='" + maxColumnsNum + "'>&nbsp;</td></tr>"; } //<td class='floor'>" + i + "</td>" + "
            str += "</tbody>" + buildSectionColumnsLegend(section.floorPlans[section.floorsFrom + 1]) + "</table></td>";
        });
        return str + "</tr></table>";
    },
    loadSnaps:function(xhrObj){
        var snap = xhrObj,
            bId = this.n - 1;
        snap.forEach(function(row){
            if(this.flats[row.extFlatId] !== undefined){
                this.flats[row.extFlatId].curPrice = +row.flPrice;
                this.flats[row.extFlatId].curStatus = +row.flStatus;
            }
        }, this.buildings[bId]);
        //this.updateTable();
    },
    updateTable:function(){
        var bId = this.n-1;
        function status2className(status){
            var className = 'notAvail';
            if(status === 1) { className = 'avail'; }
            else if (status === 3) { className = 'sold'; }
            return className;
        }
        this.buildings[bId].flats.forEach(function(flat){
            var className, id;
            if(flat.curStatus !== undefined){
                className = status2className(flat.curStatus);
                id = '#flat_' + flat.flatExtId;
                $(id  + '> img').not('[class=' + className + ']').attr("class", className);
            }
        });
    }
};