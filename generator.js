function repeatePlease(str, quantity){
	"use strict";
	var res = "";
	while(quantity > 0) { res += str; quantity--; }
	return res;
	}

// to escape sex with full matrix of [planId, bId, sectId, floor] set array indexes hardly
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

//function addSectionPrototype(objArr){ objArr.forEach( function(section){ section.prototype = sectionPrototype; }); }
//sections.forEach(addSectionPrototype);

	/*function maxNumberFlatsOfSection(sectionId){
		function max (prev, elem){ return Math.max(prev, elem.length); }
		var columns = floorPlans[buildingId][sectionId].length;
		console.log("columns: " + columns);
		return columns;
		}*/
//sec2plans format: { bId:x, sectId:c, floorId:v, planId: b }
function drawTable(bId){
	"use strict";
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
	/*function floorBuilder(base, elem){
		
		var str,
		flatType = (elem[0] === 1 && elem[1] < 34)? 0 : elem[0]; //zero for studio
		str = base + "<td class='flat roomsNum_" + flatType + "'>";
		str += "<div class='popup'>" + spellRoomNumber(flatType) + ", " + elem[1] + "<br>цена: " + "<br>номер: " +  "</div></td>";
		return str;
		}*/
	function buildSectionColumnsLegend(plan){
		function builder(base, elem){
			var str = base + "<td><font>";
			str += (elem[0] === 1 && elem[1] < 34)?"C":elem[0];
			str += "</font></td>";
			return str;
			}
		return "<tr class='sectionColumnsLegend'><td class='floor'>&nbsp;</td>" + plan.reduce(builder,"") + "</tr>";
		}
	var
		plan, i, str = "<table class='building'><tr>", rows, columns, planIdsOfSection, plansOfSection,
		flatsOnFloor = [],
		sections = sections2.filter( function(section) { return section.bId === bId; });//add order of sections
		rows = sections.reduce( function (prevValue, section){ return Math.max(prevValue, section.floorsTo); }, 0);
	sections.forEach( function (section) {
		
		planIdsOfSection = sections2plans.filter( function (entity) { //not unique, a lot of same planIds here
			return entity.bId === bId && entity.sectId === section.sectId; });
			
		//need try so save only unique planIds of this section for speeding up next function
			
		columns = planIdsOfSection.reduce( function (tmpVal, entity){
			var roomsOnPlanQ = plans.filter( function (plan) {
				return plan.planId === entity.planId; } )[0].plan.length;
			return Math.max(tmpVal, roomsOnPlanQ);
			},0);//max flatQonPlan in this section
		
		str += "<td class='section'><table class='section'>";
		str += buildSectionColumnsLegend(getPlanOfCurrSection(section.sectId, section.floorsFrom));
		
		
		for (i = section.floorsTo; i >= section.floorsFrom; i--){
			plan = getPlanOfCurrSection(section.sectId,  i);
			flatsOnFloor = flats.filter( function (flat) { //ordering?
				return flat.bId === bId && flat.sectId === section.sectId && flat.floor === i;
				});
			str += "<tr><td class='floor'>" + i + "</td>";
			str += flatsOnFloor.reduce( function(base, flat) {
				var str,
				flatType = (flat.roomsQ === 1 && flat.square < 34)? 0 : flat.roomsQ; //zero for studios
				str = base + "<td class='flat roomsNum_" + flatType + "'><img src='./window" + ((flat.flatNumber%4.25)?"_darkgrey":"") + "_2.gif' />"; //"<div class='window'></div>"
				str += "<div class='popup'>" + spellRoomNumber(flatType) + ", " + flat.square + "м<br>цена: " + "<br>номер: " + flat.flatNumber + "</div></td>";
				return str;
				}, "");
			//str += "<tr>" + "<td class='floor'>" + i + "</td>" + plan.reduce(floorBuilder,"");
			str += (columns>plan.length)?("<td colspan='" + (columns - plan.length) + "'>&nbsp;</td>"):"";
			str += "</tr>";
			}
		for (i; i >= 1; i--){// добавляем нежилые этажи чтобы с первого
			if(i === 1) { str += buildSectionColumnsLegend(getPlanOfCurrSection(section.sectId, section.floorsFrom)); }
			else { str += "<tr class='emptyFloor'>" + "<td class='floor'>&nbsp;</td>" + "<td colspan='" + columns + "'>&nbsp;</td></tr>"; }
			}
		str += "</table></td>";
		});
	return str+"</tr></table>";
	}
	
/*
0 - never available
1 - available
2 - fixed
3 - sold out
*/
/*
flatId
+extFaltId
floor(?)
numberOnPlan
roomsQ
square
building
section
?curStatus
?curPrice
-link
*/
//sec2plans format: { bId:x, sectId:c, floorId:v, planId: b }
function buildTable(bId){
	var
		table = [], planId, plan, i, j,
		flatExtId = buildings2.filter( function(building) { return building.bId === bId; })[0].flatStartExtId,
		flatId = 0,
		sections = sections2.filter( function(section) { return section.bId === bId; });
	for (i = 0; i < sections.length; i++){
		for(j = sections[i].floorsFrom; j <= sections[i].floorsTo; j++){
			planId = sections2plans.filter( function(entity) {
				return entity.bId === bId && entity.sectId === sections[i].sectId && entity.floorId === j;
				})[0].planId;
			plan = plans.filter( function(plan) { return plan.planId === planId; })[0].plan;
			plan.forEach( function(flat, flatNonPlan) {
				table.push({
					flatId:flatId,
					flatExtId:flatExtId + flatId,
					flatNumber:flatId+1,//???
					floor:j,
					numberOnFloor: flatNonPlan + 1,
					roomsQ:flat[0],
					square:flat[1],
					bId:bId,
					sectId:sections[i].sectId,
					});
				flatId++;
				});
			} 
		}
	return table;
	}