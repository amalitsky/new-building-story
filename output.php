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
    if(!($res = $db -> query("SELECT extFlatId, flStatus, flPrice, UNIX_TIMESTAMP(snapDate) FROM snapshots WHERE snapId in (SELECT MAX(snapId) FROM snapshots WHERE bId=$bId GROUP BY extFlatId) ORDER BY extFlatId;"))){
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
    if(!file_put_contents(dirname(__FILE__)."/jsdb/bd".$bId."_full.json", $str)) {
        echo "<p class='error'>Error: JSON snapshot file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    if(!file_put_contents("compress.zlib://".dirname(__FILE__)."/jsdb/bd".$bId."_full.json.gz", $str)) {
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
function sendMailNotice($str, $hadErrors = false){//TODO add ability to send through SMTP server
    //mb_language('uni'); mb_internal_encoding('UTF-8');
    $subject = 'New buildings apartments parser report';
    $headers = "From: Icode Alerting Service<alert@icode.ru>\r\nMime-Version: 1.0\r\nContent-Type: text/html;charset=UTF-8\r\n";
    if($hadErrors) {
        $subject .= "with errors";
        $headers .= "X-Priority: 1 (Highest)\r\nX-MSMail-Priority: High\r\nImportance: High";
    }
    if(!mb_send_mail('support@icode.ru', $subject, "<html><body>$str</body></html>", $headers)){
        echo "<p class='error'>Error: Email notice can't be send. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    else { echo "<p class='subresult'>Email has been sent. [".__FUNCTION__."]</p>\r\n"; }
    return true;
}

/**
 * Saves log file with all crawler output to file with ability to make separate ones.
 *
 * @param string $text Output buffer of crawler
 */
function saveLog($text){
    $text = "<div class='logEntity'>$text</div>\r\n";
    $i = 0;
    while(file_exists(dirname(__FILE__)."/logs/log$i.html") && filesize(dirname(__FILE__)."/logs/log$i.html") > 5242880){ $i++; }
    if(!file_put_contents(dirname(__FILE__)."/logs/log$i.html", $text, FILE_APPEND | LOCK_EX)){
        echo "<p class='error'>Error: Can't save output to log file. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
};
