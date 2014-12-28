<?php
/** Functions for Crawlers output - logs, emails, dumps and so on
 *
 * PHP version 5
 *
 * @category File
 * @package  crawlar output
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 */

/**
 * Saves DOM object from source site to GZiped file
 *
 * @param string $str Main DOM element with all flats on website
 * @param integer $bId Internal building ID
 * @return bool
 */
function saveSiteDump($str, $bId){
    if(!file_put_contents("compress.zlib://".dirname(__FILE__)."/dumps/".$bId."/".date("Ymd_His").".html.gz", $str)) {
        echo "<p class='error'>Error: File dump for building $bId can't be saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
};

/**
 * Sends text from $str to support@icode.ru after crawler script execution
 *
 * @param string $str Email body
 * @param bool $hadErrors Flag for importance headers
 * @return bool
 */
function sendMailNotice($str, $hadErrors = false, $ifPearMail = false, $serverName = ""){
    $failMsg = "<p class='error'>Error: Email notice can't be send. [".__FUNCTION__."]</p>\r\n";
    $succMsg = "<p class='subresult'>Email has been sent. [".__FUNCTION__."]</p>\r\n";
    if (!$ifPearMail){
        ini_set('SMTP', 'mail.icode.ru');
        ini_set('sendmail_from', 'alert@icode.ru');
        $subject = 'New buildings apartments parser report';
        $headers = "From: icode Alerting Service<alert@icode.ru>\r\nMime-Version: 1.0\r\nContent-Type: text/html;charset=UTF-8\r\n";
        if($hadErrors) {
            $subject .= ' with errors';
            $headers .= "X-Priority: 1 (Highest)\r\nX-MSMail-Priority: High\r\nImportance: High";
        }
        if(!mb_send_mail('support@icode.ru', $subject, "<html><body>$str<p>From <strong>$serverName</strong></p></body></html>", $headers)){
            echo $failMsg;
            return false;
        }
        else { echo $succMsg; }
        return true;
    }
    else {//pear Mail where sendmail is disabled
        require_once 'Mail.php';
        $params = array();
        $headers = array();
        $params['host'] = 'mail.icode.ru';
        $params['port'] = '587';
        $params['auth'] = true;
        $params['username'] = 'alert@icode.ru';
        $params['password'] = 'fakcPa5$w0rd';
        $recipients = 'a.malitsky@gmail.com';
        $headers['From'] = 'icode Alerting Service <alert@icode.ru>';
        $headers['To'] = 'a.malitsky@gmail.com';
        $headers['Subject'] = 'New buildings apartments parser report';
        $headers['Content-Type'] = 'text/html;charset=UTF-8';
        if($hadErrors) {
            $headers['Subject'] .= ' with errors';
            $headers['X-Priority'] = '1 (Highest)';
            $headers['X-MSMail-Priority'] = 'High';
        }
        $mailObj = @Mail::factory('smtp', $params);
        if(!($mailObj -> send($recipients, $headers, "<html><body>$str<p>From <strong>$serverName</strong></p></body></html>"))){ echo $failMsg; return false; }
        else { echo $succMsg; }
        return true;
    }
}

/**
 * Saves log file with all crawler output to file with ability to make separate ones.
 *
 * @param string $text Output buffer of crawler
 */
function saveLog($text){
    $text = "<div class='logEntity'>$text</div>\r\n";
    $i = 0;
    while(file_exists(dirname(__FILE__)."/logs/log$i.html") && filesize(dirname(__FILE__)."/logs/log$i.html") > 1024*1024){
        $i++;
    }
    if(!file_put_contents(dirname(__FILE__)."/logs/log$i.html", $text, FILE_APPEND | LOCK_EX)){
        echo "<p class='error'>Error: Can't save output to log file. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
};
/**
 * Saves snapshot (flat statuses and prices) of building to given date to JSON and GZIPed JSON file
 *
 * @param object $db MYSQLi connector to database
 * @param integer $bId Internal building ID
 * @param integer|null Date of actuality
 * @return bool
 */

function exportDateSnapJSON($db, $bId, $date = NULL){
    $fileName = ($date ? date('Ymd', $date):'recent');

    $query = "SELECT flatId as id, flStatus as status, flPrice as price, UNIX_TIMESTAMP(snapDate) as updDate, UNIX_TIMESTAMP(tmp.startDate) as startDate FROM `snapshots` AS s INNER JOIN (SELECT MAX(snapId) as maxSnapId, MIN(snapDate) as startDate FROM `snapshots` WHERE bId='$bId'"
    .($date ? " AND snapDate <= '".date('Y-m-d 22:00:00', $date)."'":'')
    ." GROUP BY flatId) AS tmp ON tmp.maxSnapId = s.snapId ORDER BY id;";

    return exportQuery2JSON($db, $query, $bId, 'bd'.$bId.'_dump_'.$fileName);
}

/**
 *
 *
 * @param object $db MYSQLi connector to database
 * @param integer $bId Internal building ID
 * @param integer $flatId Internal flatId in corresponding building
 * @return bool
 */

function exportFlatHistoryJSON($db, $bId, $flatId){
    $query = "SELECT flStatus AS status, flPrice AS price, UNIX_TIMESTAMP(snapDate) AS date FROM snapshots WHERE flatId = '$flatId' AND bId='$bId' ORDER BY snapId;";
    return exportQuery2JSON($db, $query, $bId, "flats/$flatId");
}


/**
 *
 * @param Object $db Connection to MySQL database
 * @param integer $bId Internal id of the building
 */
function exportAvMeterPriceJSON($db, $bId){
    $query = "SELECT f.rooms AS rooms, DATE(s.snapDate) AS period, ROUND(AVG(s.flPrice/f.square)) AS price FROM `snapbackup` AS s JOIN `flats` AS f ON (s.flatId=f.id AND s.bId=f.bId) WHERE s.bId='$bId' GROUP BY period, rooms ORDER BY period ASC, rooms;";
    return exportQuery2JSON($db, $query, $bId, 'bd'.$bId."_price_hist");
}

/**
 *
 * @param Object $db Connection to MySQL database
 * @param integer $bId Internal id of the building
 */
function exportAvailFlatsQuantityHistoryJSON($db, $bId){
    $query = "SELECT f.rooms AS rooms, DATE_FORMAT(s.snapDate, '%Y%m') AS period, COUNT(DISTINCT f.id) AS flatsQ FROM `snapbackup` AS s JOIN `flats` AS f ON (s.bId=f.bId AND s.flatId=f.id) WHERE s.bId='$bId' GROUP BY period, rooms ORDER BY period ASC, rooms;";
    return exportQuery2JSON($db, $query, $bId, 'bd'.$bId."_availFlatsQ_hist");
}

function exportQuery2JSON($db, $query, $bId, $fileName){
    if(!($res = $db -> query($query))){
        echo "<p class='error'>Error: db query for JS export ($fileName) of building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    for ($fromdb = array(); $tmp = $res -> fetch_assoc();) {
        $fromdb[] = $tmp;
    }
    $res -> close();
    unset($tmp);

    if($fromdb){
        echo "<p class='subresult'>Exported ".count($fromdb)." records of building $bId to JSON ($fileName).</p>\r\n";
    }
    else {
        echo "<p class='error'>Error: Empty result returned from DB while making JSON export ($fileName), building $bId. [".__FUNCTION__."]</p>\r\n";
        return false;
    }

    $str = json_encode($fromdb);

    /*if(!file_put_contents(dirname(__FILE__)."/jsdb/bd".$bId."/".$fileName.".json", $str)) {
        echo "<p class='error'>Error: JSON export file ($fileName) for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }*/

    if(!file_put_contents("compress.zlib://".dirname(__FILE__)."/jsdb/bd".$bId."/".$fileName.".json.gz", $str)) {
        echo "<p class='error'>Error: JSON GZ export file ($fileName) for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }

    return true;
}