<?php
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
$currHour = date("G"); $currMinute = date("m");
//if($currHour >= 21 OR $currHour < 03) { exit('MSS'); } //Moscow sometimes sleep, let's stop bothering
//usleep (mt_rand(0,600)*1000000);  //we don't need english courtesy to be just in time
$time_start = microtime(true);
error_reporting(E_ALL);
//gc_disable();
ob_start();
require_once "./crawler_lb.php";
require_once "./db.php";
require_once "./output.php";

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
	//array (2, './examples/k2example_05022014.htm'),
	//array (2, './examples/k2example_06022014.htm'),
	//array (2, './examples/k2example_07022014.htm'),
	//array (2, './examples/k2example_08022014.htm'),
	//array (2, './examples/k2example_10022014.htm'),
	//array (2, './examples/k2example_11022014.htm'),
	//array (2, './examples/k2example_12022014.htm'),
    array (2, './examples/k2example_13022014.htm'),
	//array (2, './examples/k2example_14022014.htm'),
    //array (1, 'http://novokosino.ndv.ru/sale/?build=1708'),
	//array (2, 'http://novokosino.ndv.ru/sale/?build=1709'),
	//array (3, 'http://novokosino.ndv.ru/sale/?build=1710')
	);

$getReqContext = stream_context_create( array('http' => array( 'method' => 'GET',
		'header' => "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n".
			"Accept-Encoding: gzip, deflate\r\n"."Accept-Language:	ru-ru,en-us;q=0.8,ru;q=0.5,en;q=0.3\r\n"."Connection: keep-alive\r\n"."Referer: http://novokosino.ndv.ru/sale/\r\n"."User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")));
$snaps = array(); $fromdb = array(); $fromWeb = array();
$db = mysqli_init();
$db -> options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
$db -> real_connect("localhost", 'app_crawler', 'Hja72_sdW', 'bcrawler');
if ($db -> connect_errno) {
	echo "<p>Error: Failed to connect to MySQL: (".$db->connect_errno.") ".$db->connect_error ."</p>\r\n"; }

for ($i = 0; $i < count($buildings); $i++){//parsing, saving copy and counting differences between snapshots
    $bId = $buildings[$i][0];
    $table = r9mkLoadFileAndGetTable($buildings[$i][1], $getReqContext);
    $fromWeb[$i] = r9mkExtractFlatsOnSale($table, $bId);
	if(!$fromWeb[$i]) { continue; }
    $fromdb[$i] = r9mkLoadSnapFromDB($db, $bId);
    $snaps[$i] = r9mkSnapsComparePrepare($fromdb[$i], $fromWeb[$i]);

    //$updArr = array_merge($updArr, $snaps[$i]["sold"], $snaps[$i]["newOnSale"], $snaps[$i]["prevOnSaleUpdPrice"]);
    //$backupArr = array_merge($backupArr, $fromWeb[$i]);

    $soldQ = count($snaps[$i]["sold"]);
	$newOnSaleQ = count($snaps[$i]["newOnSale"]);
	$prevOnSaleUpdPriceQ = count($snaps[$i]["prevOnSaleUpdPrice"]);
	$updQ = $soldQ + $newOnSaleQ + $prevOnSaleUpdPriceQ;

	if($updQ){
        saveSiteDump($bId, $table -> C14N());
        updateSnapDB($db, array_merge($snaps[$i]["sold"], $snaps[$i]["newOnSale"], $snaps[$i]["prevOnSaleUpdPrice"]), $bId);
        saveBackupSnapDB($db, $fromWeb[$i], $bId);
        exportSnapJSON($db, $bId);
		}
	
	echo "<p class='result'>".date("Y-m-d H:i:s T ")."<b>".count($fromWeb[$i])."</b> flats were found by parser flats on page <i>".$buildings[$i][1]."</i> for building ".$bId.".<br>\r\n ".count($fromdb[$i])." flats were loaded from last snapshot. <b>".$updQ."</b> records will be saved: ".$soldQ." sold, ".$newOnSaleQ." put up on sale, ".$prevOnSaleUpdPriceQ." price changed.</p>\r\n";
	}
$db->close();
$output = ob_get_contents();
$ifErrors = stripos($output , 'error') || stripos($output, 'warning');
if($ifErrors !== false || ($currHour === 20 && $currMinute >= 30 && $currMinute < 45)){ sendMailNotice($output, $ifErrors); };
$time_end = microtime(true); echo "<p class='execTime'>Script execution time: ".round($time_end - $time_start, 2)." s.</p>\r\n";
saveLog(ob_get_contents());
ob_end_flush();//change to end_clean