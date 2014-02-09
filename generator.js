//to avoid hardcoding of full matrix [planId, bId, sectId, floor]. 
//result sec2plans format: { bId:x, sectId:c, floorId:v, planId: b }
function sec2plans(){
	"use strict";
	function getPlanId(bId, sectId, floor){
	var planId = sectId;
	switch (bId){
		case 1:
			planId--;
			if(sectId === 6) { if(floor >= 7) {planId += 2;} else if(floor === 6) { planId += 1; } }
			break;
		case 2: planId += 7; break;
		case 3: planId += 10; break;
		default: return false;
		}
	return planId;
	}
	var arr = [];
	sections2.forEach( function(section){
		var i;
		for (i = section.floorsFrom; i <= section.floorsTo; i++){
			arr.push({ bId: section.bId, sectId: section.sectId, floorId: i, planId: getPlanId(section.bId, section.sectId, i) });
			}
		});
	return arr;
	}

//flat status: 0 - never available, 1 - available, 2 - fixed, 3 - sold out
//sec2plans format: { bId:x, sectId:c, floorId:v, planId: b }
function makeFlatsArray(bId){
	var
		table = [], planId, plan, i, flatId = 0, flatExtId, flatLog = [];
		sections = sections2.filter( function(section) { return section.bId === bId; });
	flatExtId = buildings2.filter( function(building) { return building.bId === bId; })[0].flatStartExtId
	for (i = 0; i < sections.length; i++){
		for(j = sections[i].floorsFrom; j <= sections[i].floorsTo; j++){
			planId = sections2plans.filter( function(entity) {
				return entity.bId === bId && entity.sectId === sections[i].sectId && entity.floorId === j;
				})[0].planId;
			plan = plans.filter( function(plan) { return plan.planId === planId; })[0].plan;
			plan.forEach( function(flat, flatNonPlan) {
				flatLog = snapObj.list.filter( function (entity) {  return entity[0] === (flatExtId + flatId); });
				//if(flatLog.length > 0) { console.log(flatLog); }
				curStatus = (flatLog.length > 0)? flatLog[flatLog.length - 1][1]:0;
				curPrice = (flatLog.length > 0)? flatLog[flatLog.length - 1][2]:0;
				//if (flatLog.length > 0) console.log(curStatus + ", " + curPrice);
				table.push({
					flatId:flatId,
					flatExtId:flatExtId + flatId,
					flatNumber:flatId+1,
					floor:j,
					numberOnFloor: flatNonPlan + 1,
					roomsQ:flat[0],
					square:flat[1],
					bId:bId,
					sectId:sections[i].sectId,
					curStatus:curStatus,
					curPrice:curPrice
					});
				flatId++;
				});
			} 
		}
	return table;
	}

function parseSnapShot(text){
	var snapObj = JSON.parse(text);	
	}
	
//sec2plans format: { bId:x, sectId:c, floorId:v, planId: b }
function drawTable(bId){
	"use strict";
	function formatPrice(val){
		
		}
		
	function buildFloorsColumn(floorNumOfNextSection){
		var i, str = "<table class='floorsIdColumn'>";
		for(i = floorNumOfNextSection; i > 1; i--){ str += "<tr><td>" + i + "</td></tr>"; }
		return str + "<tr><td>&nbsp;</td></tr></table>";
		}
	function getPlanOfCurrSection(sectId, floorId){
		var planId = sections2plans.filter( function (entity){
			return entity.bId === bId && entity.sectId === sectId && entity.floorId === floorId;
			})[0].planId;
		return plans.filter( function (plan){ return plan.planId === planId; })[0].plan;
		}
	function spellRoomNumber(type){
			var res = "";
			switch (type){
				case 0: res = "студия"; break;
				case 1: res = "однушка"; break;
				case 2: res = "двушка"; break;
				case 3: res = "трёшка"; break;
				case 4: res = "четвёрка"; break;				
				}
			return res;
			}
	function buildSectionColumnsLegend(plan){
		function builder(base, elem){
			var str = base + "<td><font>";
			str += (elem[0] === 1 && elem[1] < 34)?"C":elem[0];
			str += "</font></td>";
			return str;
			}
		var str = "<tbody class='sectionColumnsLegend'><tr>" + plan.reduce(builder,"") + "</tr></tbody>";
		return str;
		}
	function floorBuilder(base, flat){
		var str,
		flatType = (flat.roomsQ === 1 && flat.square < 34)? 0 : flat.roomsQ; //zero for studios
		str = base + "<td class='flat roomsNum_" + flatType + "'><img src='./window.gif' class='";
		//switch(Math.round((Math.random()*2))){
		switch(flat.curStatus){
			case 0: str += "notAvail"; break;
			case 1: str += "sold"; break;
			case 2: str += "avail";
			}
		str += "' />"; //"<div class='window'></div>"
		str += "<div class='popup'>" + spellRoomNumber(flatType) + ", " + flat.square + "м<br>цена: " + flat.curPrice + "<br>цена за метр: " + (flat.curPrice/flat.square).toFixed(0) + "<br>номер: " + flat.flatNumber + "</div></td>";
		return str;
		}
	var
		plan, i, str = "<table class='building'><tr>", rows, columns, planIdsOfSection,
		flatsOnFloor = [], uniquePlanIdsOfSection, alreadyHaveThisPlanId,
		sections = sections2.filter( function(section) { return section.bId === bId; });//add order of sections
		rows = sections.reduce( function (prevValue, section){ return Math.max(prevValue, section.floorsTo); }, 0);
	sections.forEach( function (section) {
		uniquePlanIdsOfSection = [];
		alreadyHaveThisPlanId = [];
		planIdsOfSection = sections2plans.filter( function (entity) { //not unique, a lot of same planIds here
			return entity.bId === bId && entity.sectId === section.sectId; });
		planIdsOfSection.forEach( function (entity){//select only unique plans for current section
			if(!alreadyHaveThisPlanId[entity.planId]){
				alreadyHaveThisPlanId[entity.planId] = true;
				uniquePlanIdsOfSection.push(entity);
				}
			});
		columns = uniquePlanIdsOfSection.reduce( function (tmpVal, entity){//max flatQonPlan in this section
			var roomsOnPlanQ = plans.filter( function (plan) { return plan.planId === entity.planId; })[0].plan.length;
			return Math.max(tmpVal, roomsOnPlanQ);
			},0);
		if(section.sectId > 1) { str += "<td class='floors'>" + buildFloorsColumn(section.floorsTo) + "</td>"; }
		str += "<td class='section'><table class='section'><tbody class='flats'>";
		for (i = section.floorsTo; i >= section.floorsFrom; i--){
			plan = getPlanOfCurrSection(section.sectId, i);
			flatsOnFloor = flats.filter( function (flat) { //ordering?
				return flat.bId === bId && flat.sectId === section.sectId && flat.floor === i;
				});
			flatsOnFloor.sort( function (a, b) { return a.numberOnFloor - b.numberOnFloor; });
			str += "<tr>" + flatsOnFloor.reduce(floorBuilder, ""); //"<td class='floor'>" + i + "</td>";
			str += (columns > plan.length)?("<td colspan='" + (columns - plan.length) + "'>&nbsp;</td>"):"";
			str += "</tr>";
			}
		for (i; i > 1; i--){ //adding empty floors
			str += "<tr class='emptyFloor'><td colspan='" + columns + "'>&nbsp;</td></tr>"; } //<td class='floor'>" + i + "</td>" + "
		str += "</tbody>" + buildSectionColumnsLegend(getPlanOfCurrSection(section.sectId, section.floorsFrom)) + "</table></td>";
		});
	return str + "</tr></table>";
	}