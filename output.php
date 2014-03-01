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

function saveSiteDump($bId, $str){
    if(!file_put_contents("compress.zlib://./dumps/".$bId."/".date("Ymd_His").".html.gz", $str)) {
        echo "<p>Error: File dump for building $bId can't be saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
};

function exportSnapJSON($db, $bId){
    if(!($res = $db -> query("SELECT extFlatId, flStatus, flPrice, UNIX_TIMESTAMP(snapDate) FROM snapshots WHERE snapId in (SELECT MAX(snapId) FROM snapshots WHERE bId=$bId GROUP BY extFlatId) ORDER BY extFlatId;"))){
        echo "<p>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }//check order by
    //for($fromdb = array(); $row = $res -> fetch_assoc(); $fromdb[] = $row);
    $fromdb = $res -> fetch_all();
    $res -> close();
    $str = json_encode($fromdb);
    if(!file_put_contents("./jsdb/bd".$bId."_full.json", $str)) {
        echo "<p>Error: JSON snapshot file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    if(!file_put_contents("compress.zlib://./jsdb/bd".$bId."_full.json.gz", $str)) {
        echo "<p>Error: JSON GZ snapshot file for building $bId wasn't saved. [".__FUNCTION__."]</p>\r\n";
        return false;
        }
    return true;
}

function sendMailNotice($str, $hadErrors = false){
    mb_language('UTF-8'); mb_internal_encoding('UTF-8');
    $subject = 'New buildings apartments parser report';
    $headers = "From: Icode Alerting Service<alert@icode.ru>\r\nMime-Version: 1.0\r\nContent-Type: text/html;charset=UTF-8\r\n";
    if($hadErrors) {
        $subject .= "with errors";
        $headers .= "X-Priority: 1 (Highest)\r\nX-MSMail-Priority: High\r\nImportance: High";
    }
    if(!mb_send_mail('support@icode.ru', $subject, "<html><body>$str</body></html>", $headers)){
        echo "<p>Error: Email notice can't be send. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    return true;
}

function saveLog($text){
    $text = "<div class='logEntity'>\r\n$text</div>\r\n";
    $i = 0;
    while(file_exists('./logs/log'.$i.'.html') && filesize('./logs/log'.$i.'.html') > 5242880){ $i++; }
    if(!file_put_contents('./logs/log'.$i.'.html', $text, FILE_APPEND | LOCK_EX)){
        echo "<p>Error: Can't save output to log file.</p>\r\n"; }
};
