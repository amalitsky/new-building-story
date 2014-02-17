<!DOCTYPE html>
<html><head>
<title>new buildings appartments parser</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
body{
	font-family:Arial;
	font-size:12px;
	}
div.scriptExecTime{	
	position:fixed;
	color:red;
	padding:0.2em 0.3em;
	top:1em;right:1em;
	background-color:white;
	border:1px solid grey
	}
	
p.upd, pre{
	font-size:12px;
	background-color:#eee;
	border:1px solid #ccc
	}
</style>
</head><body><?
$currHour = gmdate("G"); $currMinute = gmdate("m");
//if($currHour >= 21 OR $currHour < 03) { exit('MSS'); } //Moscow sometimes sleep, let's stop bothering
//usleep (mt_rand(0,600)*1000000);  //we don't need english courtesy to be just in time
$time_start = microtime(true);
error_reporting(E_NOTICE);
gc_disable();
ob_start();
require ("./simple_html_dom.php"); 
function compareFlatIds ($a, $b){ return $a[4] - $b[4]; }
function compareFlats ($a, $b) { return strcmp(implode("-", $a), implode("-", $b) ); }
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
function parseRmk9($tableObj, $building){
	$tdElems = $tableObj -> find('table.housemod td.buildroom'); 
	if(!count($tdElems)){
		echo "<p>".gmdate("Y-m-d H:i:s T")." Error: File on address '".$building[1]."' for building '".$building[0]."' can't be parsed.</p>\r\n";
		return false;
		}	
	$flatsOnSale = array();
	foreach($tdElems as $key => $tdElem) {
		if( preg_match("~free.*?_([[:digit:]]{7,8})\">(<a href=\"\?id=([[:digit:]]{6})&build=(1708|1709|1710)\">.*)?[^<]*</td>~i", $tdElem->outertext, $matches)){
			$tmp = array();
			$tmp[2] = intval($building[0]);//internal building ID
			$tmp[4] = intval($matches[3]);//extId
			$tmp[5] = 1;//status 'onSale'(available), only this is applicapable
			$tmp[6] = intval($matches[1]);//price
			$flatsOnSale[] = $tmp;
			}
		}
	return $flatsOnSale;
	}

function saveLog($text){
	$text = "<div class='logEntity'>\r\n".$text."</div>\r\n";
	$i = 0;
	while(file_exists('./logs/log'.$i.'.html') && filesize('./logs/log'.$i.'.html') > 5242880){ $i++; }
	//if(!(file_exists($fileName)) || filesize($fileName) < 5242880) { break; }
	if(!file_put_contents('./logs/log'.$i.'.html', $text, FILE_APPEND | LOCK_EX)){
		echo "<p>Error: Can\'t save ouput to log file.</p>\r\n"; }
	};
	
function exportflats2js($bId){
	
	/*class snapshotExp {
	public $date, $list;
	function __construct($list) {
		$this->date = time();
		$this->list = $list;
		}
	}
	echo json_encode(new snapshotExp($list));*/
	};
	
$buildings = array( array (1, 'http://novokosino.ndv.ru/sale/?build=1708'), array (2, 'http://novokosino.ndv.ru/sale/?build=1709'));
	
$buildings = array(
	//array (1, './examples/k1example_05022014.htm'),
	//array (1, './examples/k1example_06022014.htm'),
	//array (1, './examples/k1example_07022014.htm'),
	//array (1, './examples/k1example_08022014.htm'),
	//array (1, './examples/k1example_10022014.htm'),
	//array (1, './examples/k1example_11022014.htm'),
	//array (1, './examples/k1example_12022014.htm'),
	//array (1, './examples/k1example_13022014.htm'),
	//array (1, './examples/k1example_14022014.htm'),
	//array (1, 'http://novokosino.ndv.ru/sale/?build=1708'),
	//array (2, './examples/k2example_05022014.htm'),
	//array (2, './examples/k2example_06022014.htm'),
	//array (2, './examples/k2example_07022014.htm'),
	//array (2, './examples/k2example_08022014.htm'),
	//array (2, './examples/k2example_10022014.htm'),
	//array (2, './examples/k2example_11022014.htm'),
	//array (2, './examples/k2example_12022014.htm'),
	//array (2, './examples/k2example_13022014.htm'),
	array (2, './examples/k2example_14022014.htm'),
	//array (2, 'http://novokosino.ndv.ru/sale/?build=1709'),
	//array (3, 'http://novokosino.ndv.ru/sale/?build=1710')
	);
	
$i = 0;
$getReqContext = stream_context_create( array('http' => array( 'method' => 'GET',
		'header' => "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n".
			"Accept-Encoding: gzip, deflate\r\n"."Accept-Language:	ru-ru,en-us;q=0.8,ru;q=0.5,en;q=0.3\r\n"."Connection: keep-alive\r\n"."Referer: http://novokosino.ndv.ru/sale/\r\n"."User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")));
$soldFlats = array();
$newFlatsOnSale = array();
$flatsPricesUpd = array();
$updArr = array();
$backupArr = array();
$db = new mysqli("localhost", 'root', '', 'bcrawler');
if ($db->connect_errno) {
	echo "<p>Error: Failed to connect to MySQL: (" . $db->connect_errno . ") " . $db->connect_error ."</p>\r\n"; }
if(!($selectStmt = $db->prepare("SELECT extFlatId, flStatus, flPrice FROM `snapshots` WHERE snapId IN (SELECT MAX(snapId) FROM `snapshots` WHERE bId=? GROUP BY extFlatId) AND flStatus='1';"))) {
	echo "<p>Error: selectStmt prepare failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."<p>\r\n";
	}

foreach ($buildings as $building){//parsing, saving copy and counting differences between snapshots
	if(!($file = file_get_contents($building[1], false. $getReqContext))){
		echo "<p>".gmdate("Y-m-d H:i:s T")." Error: File on address '".$building[1]."' for building '".$building[0]."' can't be even loaded.</p>\r\n";
		continue;
		};
	$html = str_get_html($file);
	$table = $html -> find('table.housemodbigs', 0);
	$res[$i] = parseRmk9($table, $building);
	$table = $table -> outertext;
	if(!$res[$i]) { continue; }
	if(!$selectStmt->bind_param('i', $building[0])) {	
		echo "<p>Error: selectStmt binding parameters failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n"; }
	if(!$selectStmt->execute()) { echo "<p>Error: selectStmt execute failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n"; }
	if (!($fromdb[$i] = $selectStmt->get_result())) {
		echo "<p>Error: selectStmt getting result set failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n"; }
	$fromdb[$i] = $fromdb[$i]->fetch_all();
	foreach($fromdb[$i] as &$flat){//change flat format from db style to out-of-parser, needed for compareFlatPrices
		$flat[4] = $flat[0];
		$flat[5] = $flat[1];
		$flat[6] = $flat[2];
		$flat[2] = $building[0];
		unset($flat[0], $flat[1]);
		}
	unset($flat);
	$soldFlats = array_udiff($fromdb[$i], $res[$i], 'compareFlatIds'); //need only onSale status form DB
	foreach($soldFlats as &$flat){ $flat[5] = 3; } //change status to 'sold'
	$newFlatsOnSale = array_udiff($res[$i], $fromdb[$i], 'compareFlatIds'); //need only onSale status from DB
	$flatsOnSaleFromPrevCheck = array_udiff($res[$i], $newFlatsOnSale, 'compareFlatIds'); 
	$flatsPricesUpd = array_udiff($flatsOnSaleFromPrevCheck, $fromdb[$i], 'compareFlats');
	$updArr = array_merge($updArr, $soldFlats, $flatsPricesUpd, $newFlatsOnSale);
	$backupArr = array_merge($backupArr, $res[$i]);
	$soldQ = count($soldFlats);
	$newFlatsOnSaleQ = count($newFlatsOnSale);
	$flatsPricesUpdQ = count($flatsPricesUpd);
	/*echo '<pre>';
	if($soldQ) { echo "sold: <br>"; print_r($soldFlats); }
	if($newFlatsOnSaleQ) { echo "new on sale: <br>"; print_r($newFlatsOnSale); }
	if($flatsPricesUpdQ) { echo "changed price: <br>"; print_r($flatsPricesUpd); }
	if(count($updArr)) { echo "whole update array:<br>"; print_r($updArr); }
	echo '</pre>';*/
	
	if($soldQ || $newFlatsOnSaleQ || $flatsPricesUpdQ){
		if(file_put_contents("compress.zlib://./dumps/".$building[0]."/".gmdate("Ymd_His").".html.gz", $table) === 0) {
			echo "<p>Error: File dump for building '".$building[0]."' wasn't saved.</p>\r\n"; }
		}
	
	echo "<p class='result'>".gmdate("Y-m-d H:i:s T ")."<b>".count($res[$i])."</b> flats were found by parser flats on page '".$building[1]."' for building ".$building[0].".<br>\r\n ".count($fromdb[$i])." flats were loaded from last shapshot. <b>".($soldQ+$newFlatsOnSaleQ+$flatsPricesUpdQ)."</b> records will be saved: ".$soldQ." sold, ".$newFlatsOnSaleQ." put up on sale, ".$flatsPricesUpdQ." price changed.</p>\r\n\r\n";
	$i++;
	}
$selectStmt->close();

if(count($updArr)){//save all updated flats to db
	usort($updArr,'compareFlatsByidAndBId');
	if(!($updStmt  = $db->prepare("INSERT INTO snapshots(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
		echo "<p>Error: updStmt prepare failed: (" . $updStmt->errno . ") " . $updStmt->error ."</p>\r\n"; }
	foreach ($updArr as &$flat){
		//echo("<p>Trying to save in database entity: bId='".$flat[2]."', extFlatId='".$flat[4]."', flStatus='".$flat[5]."', fPrice='".$flat[6]."'.</p>");
		$updStmt ->bind_param('iiii', $flat[2], $flat[4], $flat[5], $flat[6]);
		if (!$updStmt->execute()) { echo "<p>Error: updStmt execute failed: (" . $updStmt->errno . ") " . $updStmt->error. "</p>\r\n"; }
		}
	unset($flat);
	$updStmt->close();
	};

if(count($updArr) && count($backupArr)){//makes a copy of all flats onSale presented on a web site to an extra table
	usort($backupArr,'compareFlatsByidAndBId');
	if(!($updStmt  = $db->prepare("INSERT INTO snapbackup(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
		echo "<p>Error: updStmt prepare failed: (" . $updStmt->errno . ") " . $updStmt->error. "</p>\r\n"; }
	foreach ($backupArr as &$flat){
		//echo("<p>Going to save in backup database entity: bId='".$flat[2]."', extFlatId='".$flat[4]."', flStatus='".$flat[5]."', fPrice='".$flat[6]."'.</p>");
		$updStmt ->bind_param('iiii', $flat[2], $flat[4], $flat[5], $flat[6]);
		if (!$updStmt->execute()) { echo "<p>Error: updStmt execute failed: (" . $updStmt->errno . ") " . $updStmt->error ."</p>\r\n"; }
		}
	unset($flat);
	$updStmt->close();
	};
	
if(1 || count($updArr)){//export database to JSON
	if(!($expStmt  = $db->prepare("SELECT extFlatId, flStatus, flPrice, UNIX_TIMESTAMP(snapDate) FROM `snapshots` WHERE bId=? ORDER BY `snapId`;"))) {
		echo "<p>Error: expStmt prepare failed: (" . $expStmt->errno . ") " . $expStmt->error ."<p>\r\n"; }
	foreach ($buildings as $building){
		if(!$expStmt->bind_param('i', $building[0])) {	
			echo "<p>Error: expStmt binding parameters failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n"; }
		if(!$expStmt->execute()) { echo "<p>Error: expStmt execute failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n";
			}
		if (!($expVal = $expStmt->get_result())) {
			echo "<p>Error: expStmt getting result set failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n"; }
		$expVal = $expVal->fetch_all();
		//echo "<pre>"; print_r($expVal); echo "</pre>";
		file_put_contents('./jsdb/bd'.$building[0].'_full.json',json_encode($expVal));
		file_put_contents('compress.zlib://./jsdb/bd'.$building[0].'_full.json.gz',json_encode($expVal));
		}
	}

$db->close();
$time_end = microtime(true);
echo "<p class='execTime'>Script execution time: ".round($time_end - $time_start, 2)." s.</p>\r\n";
saveLog(ob_get_contents());
$output = ob_get_contents();
$ifErrors = stripos($output , 'error');
if($ifErrors !== false || ($currHour == 20 && $currMinute >= 30 && $currMinute < 45)){
	mb_language('UTF-8'); mb_internal_encoding('UTF-8');
	$subject = 'New buildings appartments parser report';
	$headers = "From: Icode Alerting Service<alert@icode.ru>\r\nMime-Version: 1.0\r\nContent-Type: text/html;charset=UTF-8\r\n";
	if($ifErrors !== false) {
		$subject .= ' with errors';
		$headers .= "X-Priority: 1 (Highest)\r\nX-MSMail-Priority: High\r\nImportance: High";
		}
	mb_send_mail('support@icode.ru', $subject, '<html><body>'.$output.'</body></html>', $headers);
	};

ob_end_flush(); 
//$time_end = microtime(true);
//echo '<div class="scriptExecTime">execution time: '.round($time_end - $time_start, 2).' s.</div>';
?></body></html>