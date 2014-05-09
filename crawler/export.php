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
$nbsCrConf = array();
error_reporting(E_ALL);
require_once dirname(__FILE__)."/../nbs_conf.php";
//require_once dirname(__FILE__)."../crawler_lb.php";
require_once dirname(__FILE__)."/../db.php";
require_once dirname(__FILE__)."/../output.php";
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