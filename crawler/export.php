<?php
/**
 * Exports some data from DB to JSON files. Started by cron once or twice a day
 * PHP Version 5
 *
 * @category File
 * @package  Crawler
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 *
 */
$time_start = microtime(true);
date_default_timezone_set("UTC");
$nbsCrConf = array();
error_reporting(E_ALL);
require_once dirname(__FILE__)."/../nbs_conf.php";
require_once dirname(__FILE__)."/../db.php";
require_once dirname(__FILE__)."/../output.php";

echo "<p>Export run on ".date("Y-m-d H:i:s T").".</p>";

$db = mysqli_init();
$db -> real_connect($nbsCrConf['dbServer'], $nbsCrConf['dbLogin'], $nbsCrConf['dbPassword'], $nbsCrConf['dbName']);
if ($db -> connect_errno) {
    echo "<p>Error: Failed to connect to MySQL: (".$db->connect_errno.") ".$db->connect_error ."</p>\r\n"; }

$bIds = [1, 2, 3];

for ($i = 0; $i < count($bIds); $i++){
    //exportSnapJSON($db, $bIds[$i]);
    exportAvMeterPriceJSON($db,$bIds[$i]);
    exportAvailFlatsQuantityHistoryJSON($db,$bIds[$i]);
}

$db -> close();

$output = ob_get_contents();
sendMailNotice($output, false, $nbsCrConf['pearMail'], $nbsCrConf['serverName']);
$time_end = microtime(true);
echo "<p class='execTime'>Execution time: ".round($time_end - $time_start, 2)." s.</p>";
saveLog(ob_get_contents());
ob_end_flush();