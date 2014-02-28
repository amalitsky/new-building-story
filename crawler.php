<!DOCTYPE html>
<html><head>
<title>new buildings apartments parser</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
body{
	font-family:Arial, serif;
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
	
pre{
	font-size:12px;
	background-color:#eee;
	border:1px solid #ccc
	}
</style>
</head><body><?php
/**
 * Get and parse information from external websites. Started by cron every 15 minutes
 * PHP Version 5
 *
 * @category File
 * @package  Crawler
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 *
 */
date_default_timezone_set("UTC");
$currHour = date("G");
$currMinute = date("m");
//if($currHour >= 21 OR $currHour < 03) { exit('MSS'); } //Moscow sometimes sleep, let's stop bothering
//usleep (mt_rand(0,600)*1000000);  //we don't need english courtesy to be just in time
$time_start = microtime(true);
error_reporting(E_NOTICE);
gc_disable();
ob_start();
require_once "./simple_html_dom.php";
require_once "./crawler_lb.php";
function saveLog($text){
	$text = "<div class='logEntity'>\r\n".$text."</div>\r\n";
	$i = 0;
	while(file_exists('./logs/log'.$i.'.html') && filesize('./logs/log'.$i.'.html') > 5242880){ $i++; }
	if(!file_put_contents('./logs/log'.$i.'.html', $text, FILE_APPEND | LOCK_EX)){
		echo "<p>Error: Can't save output to log file.</p>\r\n"; }
	};

function exportflats2js(){
	
	/*class snapshotExp {
	public $date, $list;
	function __construct($list) {
		$this->date = time();
		$this->list = $list;
		}
	}
	echo json_encode(new snapshotExp($list));*/
	};
	
$buildings = array(
    array (1, 'http://novokosino.ndv.ru/sale/?build=1708'),
    array (2, 'http://novokosino.ndv.ru/sale/?build=1709')
    );

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
	//array (2, './examples/k2example_14022014.htm'),
	array (2, 'http://novokosino.ndv.ru/sale/?build=1709'),
	//array (3, 'http://novokosino.ndv.ru/sale/?build=1710')
	);
	
$i = 0;
$getReqContext = stream_context_create( array('http' => array( 'method' => 'GET',
		'header' => "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n".
			"Accept-Encoding: gzip, deflate\r\n"."Accept-Language:	ru-ru,en-us;q=0.8,ru;q=0.5,en;q=0.3\r\n"."Connection: keep-alive\r\n"."Referer: http://novokosino.ndv.ru/sale/\r\n"."User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")));
$snaps = array();
$updArr = array();
$backupArr = array();
$db = new mysqli("localhost", 'app_crawler', 'Hja72_sdW', 'bcrawler');
if ($db->connect_errno) {
	echo "<p>Error: Failed to connect to MySQL: (" . $db->connect_errno . ") " . $db->connect_error ."</p>\r\n"; }
//taking last snapshot of each presented flat and filter them by status = 'onSale'
if(!($selectStmt = $db->prepare("SELECT extFlatId, flPrice FROM snapshots WHERE snapId IN (SELECT MAX(snapId) FROM snapshots WHERE bId=? GROUP BY extFlatId) AND flStatus='1';"))) {
	echo "<p>Error: selectStmt prepare failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."<p>\r\n";
	}


foreach ($buildings as $building){//parsing, saving copy and counting differences between snapshots
	if(!($file = file_get_contents($building[1], false. $getReqContext))){
		echo "<p>".date("Y-m-d H:i:s T")." Error: File on address <i>".$building[1]."</i> for building '".$building[0]."' can't be even loaded.</p>\r\n";
		continue;
		};
	$html = str_get_html($file);
	$table = $html -> find('table.housemodbigs', 0);
	$fromWeb[$i] = flatsOnSaleRmk9($table, $building[0], $building[0]);
	$table = $table -> outertext;
	if(!$fromWeb[$i]) { continue; }
	if(!$selectStmt->bind_param('i', $building[0])) {
		echo "<p>Error: selectStmt binding parameters failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n";
        }
	if(!$selectStmt->execute()) {
           echo "<p>Error: selectStmt execute failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n";
        }
	if (!($fromdb[$i] = $selectStmt->get_result())) {
		echo "<p>Error: selectStmt getting result set failed: (" . $selectStmt->errno . ") " . $selectStmt->error ."</p>\r\n";
        }
	$fromdb[$i] = $fromdb[$i]->fetch_all();

    foreach($fromdb[$i] as &$flat){//change flat format from db style to out-of-parser, needed for compareFlatPrices
		$flat[4] = $flat[0];//extFlatId
		$flat[5] = 1;//flStatus
		$flat[6] = $flat[1];//flPrice
		$flat[2] = $building[0];//bId
		unset($flat[0], $flat[1]);
		}
	unset($flat);

    $snaps[$i] = snapshotsComparePrepare($fromdb[$i], $fromWeb[$i]);

	/*$soldFlats = array_udiff($fromdb[$i], $fromWeb[$i], 'compareFlatIds');
	foreach($soldFlats as &$flat){ $flat[5] = 3; } //change status to 'sold'
	$newFlatsOnSale = array_udiff($fromWeb[$i], $fromdb[$i], 'compareFlatIds');
	$flatsOnSaleFromPrevCheck = array_udiff($fromWeb[$i], $newFlatsOnSale, 'compareFlatIds');
	$flatsPricesUpd = array_udiff($flatsOnSaleFromPrevCheck, $fromdb[$i], 'compareFlats');*/

    $updArr = array_merge($updArr, $snaps[$i]["sold"], $snaps[$i]["newOnSale"], $snaps[$i]["prevOnSaleUpdPrice"]);
    $backupArr = array_merge($backupArr, $fromWeb[$i]);

    $soldQ = count($snaps[$i]["sold"]);
	$newOnSaleQ = count($snaps[$i]["newOnSale"]);
	$prevOnSaleUpdPriceQ = count($snaps[$i]["prevOnSaleUpdPrice"]);
	$updQ = $soldQ + $newOnSaleQ + $prevOnSaleUpdPriceQ;

	if($updQ){
		if(file_put_contents("compress.zlib://./dumps/".$building[0]."/".date("Ymd_His").".html.gz", $table) === 0) {
			echo "<p>Error: File dump for building '".$building[0]."' wasn't saved.</p>\r\n"; }
		}
	
	echo "<p class='result'>".date("Y-m-d H:i:s T ")."<b>".count($fromWeb[$i])."</b> flats were found by parser flats on page <i>".$building[1]."</i> for building ".$building[0].".<br>\r\n ".count($fromdb[$i])." flats were loaded from last snapshot. <b>".$updQ."</b> records will be saved: ".$soldQ." sold, ".$newOnSaleQ." put up on sale, ".$prevOnSaleUpdPriceQ." price changed.</p>\r\n\r\n";
	$i++;
	}
$selectStmt->close();

if(1 || count($updArr)){
    //save all updated flats to snapshots db
	usort($updArr,'compareFlatsByidAndBId');
	if(!($updStmt  = $db->prepare("INSERT INTO snapshots(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
		echo "<p>Error: updStmt prepare failed: (" . $updStmt->errno . ") " . $updStmt->error ."</p>\r\n"; }
	foreach ($updArr as &$flat){
		//echo("<p>Trying to save in database entity: bId='".$flat[2]."', extFlatId='".$flat[4]."', flStatus='".$flat[5]."', fPrice='".$flat[6]."'.</p>");
		$updStmt ->bind_param('iiii', $flat[2], $flat[4], $flat[5], $flat[6]);
		if (!$updStmt->execute()) {
            echo "<p>Error: updStmt execute failed: (" . $updStmt->errno . ") " . $updStmt->error. "</p>\r\n"; }
		}
	unset($flat);
	$updStmt->close();

    if(count($backupArr)){//makes a copy of all flats onSale presented on a web site to an extra table
        usort($backupArr,'compareFlatsByidAndBId');
        if(!($updStmt  = $db->prepare("INSERT INTO snapbackup(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
            echo "<p>Error: updStmt prepare failed: (" . $updStmt->errno . ") " . $updStmt->error. "</p>\r\n"; }
        foreach ($backupArr as &$flat){
            //echo("<p>Going to save in backup database entity: bId='".$flat[2]."', extFlatId='".$flat[4]."', flStatus='".$flat[5]."', fPrice='".$flat[6]."'.</p>");
            $updStmt ->bind_param('iiii', $flat[2], $flat[4], $flat[5], $flat[6]);
            if (!$updStmt->execute()) {
                echo "<p>Error: updStmt execute failed: (" . $updStmt->errno . ") " . $updStmt->error ."</p>\r\n"; }
            }
        unset($flat);
        $updStmt->close();
        };

    //export database to JSON
    if(!($expStmt  = $db->prepare("SELECT extFlatId, flStatus, flPrice, UNIX_TIMESTAMP(snapDate) FROM snapshots WHERE bId=? ORDER BY snapId;"))) {
        echo "<p>Error: expStmt prepare failed: (" . $expStmt->errno . ") " . $expStmt->error ."<p>\r\n"; }
    foreach ($buildings as $building){
        if(!$expStmt->bind_param('i', $building[0])) {
            echo "<p>Error: expStmt binding parameters failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n"; }
        if(!$expStmt->execute()) {
            echo "<p>Error: expStmt execute failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n"; }
        if (!($expVal = $expStmt->get_result())) {
            echo "<p>Error: expStmt getting result set failed: (" . $expStmt->errno . ") " . $expStmt->error ."</p>\r\n"; }
        $expVal = $expVal->fetch_all();
        //echo "<pre>"; print_r($expVal); echo "</pre>";
        if(file_put_contents('./jsdb/bd'.$building[0].'_full.json',json_encode($expVal)) === 0) {
            echo "<p>Error: JSON snapshot file for building '".$building[0]."' wasn't saved.</p>\r\n"; }
        if(file_put_contents('compress.zlib://./jsdb/bd'.$building[0].'_full.json.gz',json_encode($expVal)) === 0) {
            echo "<p>Error: JSON(GZ) snapshot file for building '".$building[0]."' wasn't saved.</p>\r\n";
            }
        }
    };

$db->close();
$time_end = microtime(true);
echo "<p class='execTime'>Script execution time: ".round($time_end - $time_start, 2)." s.</p>\r\n";
saveLog(ob_get_contents());
$output = ob_get_contents();
$ifErrors = stripos($output , 'error');
if($ifErrors !== false || ($currHour === 20 && $currMinute >= 30 && $currMinute < 45)){
	mb_language('UTF-8'); mb_internal_encoding('UTF-8');
	$subject = 'New buildings apartments parser report';
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