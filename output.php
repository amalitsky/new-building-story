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
 * Saves last snapshot to JSON and GZIPed JSON file
 *
 * @param object $db MYSQLi connector to database
 * @param string $bId Internal building ID
 * @return bool
 */

function exportSnapJSON($db, $bId){
    if(!($res = $db -> query("SELECT flatId as id, flStatus as status, flPrice as price, UNIX_TIMESTAMP(snapDate) as updDate FROM snapshots WHERE snapId in (SELECT MAX(snapId) FROM snapshots WHERE bId=$bId GROUP BY flatId) ORDER BY flatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    //$fromdb = $res -> fetch_all();
    for ($fromdb = array(); $tmp = $res -> fetch_assoc();) { $fromdb[] = $tmp; }
    $res -> close();
    unset($tmp);
    if($fromdb){ echo "<p class='subresult'>Exported ".count($fromdb)." apartments of building $bId to JSON.</p>\r\n";}
    else {
        echo "<p class='error'>Error: Empty result returned from DB while making JSON export, building $bId. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    $str = json_encode($fromdb);
    if(!file_put_contents(dirname(__FILE__)."/jsdb/bd".$bId."_dump_recent.json", $str)) {
        echo "<p class='error'>Error: JSON snapshot file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    if(!file_put_contents("compress.zlib://".dirname(__FILE__)."/jsdb/bd".$bId."_dump_recent.json.gz", $str)) {
        echo "<p class='error'>Error: JSON GZ snapshot file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
}

/**
 * Sends text from $str to support@icode.ru after crawler script execution
 *
 * @param string $str Email body
 * @param bool $hadErrors Flag for importance headers
 * @return bool
 */
function sendMailNotice($str, $hadErrors = false, $ifPearMail = false){
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
        if(!mb_send_mail('support@icode.ru', $subject, "<html><body>$str</body></html>", $headers)){ echo $failMsg; return false; }
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
        if(!($mailObj -> send($recipients, $headers, "<html><body>$str</body></html>"))){ echo $failMsg; return false; }
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
    while(file_exists(dirname(__FILE__)."/logs/log$i.html") && filesize(dirname(__FILE__)."/logs/log$i.html") > 1024*1024){ $i++; }
    if(!file_put_contents(dirname(__FILE__)."/logs/log$i.html", $text, FILE_APPEND | LOCK_EX)){
        echo "<p class='error'>Error: Can't save output to log file. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
};

/**
 *
 * @param Object $db Connection to MySQL database
 * @param integer $bId Internal id of the building
 */
function exportAvMeterPriceJSON($db, $bId){
    if(!($res = $db -> query("SELECT f.rooms AS rooms, DATE(s.snapDate) AS week, ROUND(AVG(s.flPrice/f.square)) AS price4meter, COUNT(DISTINCT f.id) AS flatsQ FROM `snapbackup` AS s JOIN `flats` AS f ON (s.flatId=f.id AND s.bId=f.bId)
WHERE s.bId='$bId' GROUP BY week, rooms ORDER BY week ASC, rooms;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    for ($fromdb = array(); $tmp = $res -> fetch_assoc();) {
        $fromdb[] = $tmp;
    }
    $res -> close();
    unset($tmp);
    if($fromdb){
        echo "<p class='subresult'>Exported ".count($fromdb)." flat price stat records of building $bId to JSON.</p>\r\n";
    }
    else {
        echo "<p class='error'>Error: Empty result returned from DB while making JSON parse stat export, building $bId. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    $str = json_encode($fromdb);
    if(!file_put_contents(dirname(__FILE__)."/jsdb/bd".$bId."_price_stat.json", $str)) {
        echo "<p class='error'>Error: JSON flat price stat file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    if(!file_put_contents("compress.zlib://".dirname(__FILE__)."/jsdb/bd".$bId."_price_stat.json.gz", $str)) {
        echo "<p class='error'>Error: JSON GZ flat price stat file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
}