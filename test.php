<!DOCTYPE html>
<html>
<style>
div.scriptExecTime{	
	position:fixed;
	color:red;
	padding:0.2em 0.3em;
	top:1em;right:1em;
	background-color:white;
	border:1px solid grey
	}
</style>
<body><?
error_reporting(E_NOTICE);
$time_start = microtime(true); 
//function compareFllatSnapsByextFlatId ($a, $b){ return $a[4] - $b[4]; }
function compareFlatIds ($a, $b){ return $a[4] - $b[4]; }
function compareFlatPrices ($a, $b) { return strcmp(implode("-", $a), implode("-", $b) ); }
function compareFlatsByIdAndBId($a, $b) {
	if($a[2] > $b[2]){ $res = 1;}
	else if ($a[2] < $b[2]) { $res = -1;}
	else {
		if ($a[4] > $b[4]) { $res = 1;}
		else if ($a[4] < $b[4]) { $res = -1;}
		else { $res = 0; }
		}
	return $res;
	} 

require ("./simple_html_dom.php");

//flat status: 0 - never available, 1 - available(on Sale), 2 - fixed, 3 - sold out
$sources = array ('./examples/k1example_05022014.htm', 
	'./examples/k1example_06022014.htm',
	//'./examples/k1example_07022014.htm','./examples/k1example_08022014.htm','./examples/k1example_10022014.htm','./examples/k1example_11022014.htm', './examples/k1example_12022014.htm'
	);

//$sources = array ('./examples/k2example_05022014.htm', './examples/k2example_06022014.htm', './examples/k2example_07022014.htm', './examples/k2example_08022014.htm','./examples/k2example_10022014.htm','./examples/k2example_11022014.htm','./examples/k2example_12022014.htm');

function parseRmk9($address){
	$html = file_get_html($address);
	$tdElems = $html -> find('table.housemodbigs table.housemod td.buildroom');
	$flatsOnSale = array();
	foreach($tdElems as $key => $tdElem) {
		if( preg_match("~free.*?_([[:digit:]]{7,8})\">(<a href=\"\?id=([[:digit:]]{6})&build=(1708|1709|1710)\">.*)?[^<]*</td>~i", $tdElem->outertext, $matches)){
			$tmp = array();
			switch (intval($matches[4])){
				case 1708: $bId = 1; break;
				case 1709: $bId = 2; break;
				case 1710: $bId = 3; break;
				//default:
				}
			$tmp[2] = rand(1, 3);//building
			$tmp[4] = intval($matches[3]);//extId
			//$tmp[5] = 1;//status 'onSale'/available
			$tmp[6] = intval($matches[1]);//price
			$flatsOnSale[] = $tmp;
			}
		}
		unset($tdElem);
	return $flatsOnSale;
	}

$i = 0; $res = array();
foreach ($sources as $source){
	$res[$i] = parseRmk9($source);
	if($i === 0) { $i++; continue; }
	echo "<b>день ".($i+1)."</b>".$source."<br>";
	$soldFlats = array_udiff($res[$i-1], $res[$i], 'compareFlatIds');
	$newFlatsOnSale = array_udiff($res[$i], $res[$i-1], 'compareFlatIds'); 
	$flatsOnSaleFromPrevCheck = array_udiff($res[$i], $newFlatsOnSale, 'compareFlatIds'); 
	$flatsPricesUpd = array_udiff($flatsOnSaleFromPrevCheck, $res[$i-1], 'compareFlatPrices');
	$summ = array_merge($soldFlats, $newFlatsOnSale, $flatsPricesUpd);
	echo "<pre>";
	usort($summ,'compareFlatsByIdAndBId');
	print_r($summ);
	//if(count($soldFlats)) { echo "ушли: <br>"; print_r($soldFlats); }
	//if(count($newFlatsOnSale)) { echo "появились: <br>"; print_r($newFlatsOnSale); }
	//if(count($flatsPricesUpd)) { echo "изменилась цена: <br>"; print_r($flatsPricesUpd); }
	echo "</pre>";	
	$i++;
	}


//res 0 - select extId, price from db where bId AND status=1
//usort($soldFlats, "compareFlatIds");
//usort($newFlatsOnSale, "compareFlatIds");
//print_r($res[0]);
//print_r($res[1]);

$time_end = microtime(true);
echo '<div class="scriptExecTime">execution time: '.round($time_end - $time_start, 2).' s.</div>';
?></body></html>