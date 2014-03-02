<?php
/**
 * Created by PhpStorm.
 * User: amalitsky
 * Date: 01/03/14
 * Time: 9:12 PM
 */
require_once dirname(__FILE__)."/../crawler_lb.php";
require_once dirname(__FILE__)."/../db.php";
require_once dirname(__FILE__)."/../output.php";

function ifDBsnapsAreEqual($db, $tbName, $expTbName, $bId){
    if(!($res = $db -> query("SELECT extFlatId, flStatus as status, flPrice as price FROM $tbName WHERE bId=$bId ORDER BY extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
    }
    $countedFlats = $res -> fetch_all(MYSQLI_ASSOC);
    $res -> free();
    if(!($res = $db -> query("SELECT extFlatId, flStatus as status, flPrice as price FROM $expTbName WHERE bId=$bId ORDER BY extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
    }
    $expFlats = $res -> fetch_all(MYSQLI_ASSOC);
    array_udiff($expFlats, $countedFlats, 'compareFlats');
    return true;
}

class TestCrawlerIntegration extends PHPUnit_Framework_TestCase {
    public function testCrawlerR9mk(){
        $bId = 1; $link = dirname(__FILE__)."/../examples/k1example_05022014.htm";
        $db = mysqli_init();
        $db -> options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
        $db -> real_connect('localhost', 'app_crawler', 'Hja72_sdW', 'bcrawler_test');
        if ($db -> connect_errno) {
            echo "<p>Error: Failed to connect to MySQL: (".$db->connect_errno.") ".$db->connect_error ."</p>\r\n"; }
        $db -> query("TRUNCATE TABLE `snapshots`;");
        $db -> query("TRUNCATE TABLE `snapbackup`;");
        crawlerR9mk($db, $link, $bId);
        $this -> assertTrue(ifDBsnapsAreEqual($db, 'snapshots', 'snapshots_050214', $bId));
        //$this -> assertTrue(ifDBsnapsAreEqual($db, 'snapbackup', 'snapbackup_050214', $bId));
        //add echo assert
    }
}
 