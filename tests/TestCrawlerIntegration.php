<?php
/**
 * Integrational test for parsing R9mk source and saving snapshots to database
 * Created by PhpStorm.
 * User: amalitsky
 * Date: 01/03/14
 * Time: 9:12 PM
 */
require_once dirname(__FILE__)."/../crawler_lb.php";
require_once dirname(__FILE__)."/../db.php";
require_once dirname(__FILE__)."/../output.php";

function ifDBsnapsAreEqual($db, $tbName, $expTbName, $bId){
    if(!($res = $db -> query("SELECT extFlatId, flatId as id, flStatus as status, flPrice as price FROM $tbName WHERE bId=$bId ORDER BY extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
    }
    $countedFlats = $res -> fetch_all(MYSQLI_ASSOC);
    $res -> free();
    if(!($res = $db -> query("SELECT extFlatId, flatId as id, flStatus as status, flPrice as price FROM $expTbName WHERE bId=$bId ORDER BY extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
    }
    $expFlats = $res -> fetch_all(MYSQLI_ASSOC);
    $diff = array_udiff($expFlats, $countedFlats, 'compareFlats');
    return !$diff;
}

class TestCrawlerIntegration extends PHPUnit_Framework_TestCase {
    /**
     * @dataProvider provider
     */
    public function testCrawlerR9mk($bId, $link, $expTableNamePostfix, $echo){
        $db = mysqli_init();
        $db -> options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
        $db -> real_connect('localhost', 'app_crawler', 'Hja72_sdW', 'bcrawler_test');
        if ($db -> connect_errno) {
            echo "<p>Error: Failed to connect to MySQL: (".$db->connect_errno.") ".$db->connect_error ."</p>\r\n";
        }
        $this -> expectOutputRegex(
            '~.*?Exported '.$echo[0].' records of building '.$bId.' to JSON.*?'
            .'<b>'.$echo[1].'</b> flats were found .*? for building '.$bId.'.*?'
            .$echo[2].' flats were loaded from last snapshot.*?'
            .'<b>'.$echo[3].'</b> records will be saved.*~s'
        );
        crawlerR9mk($db, $link, $bId);
        $this -> assertTrue(ifDBsnapsAreEqual($db, 'snapshots', 'snapshots'.$expTableNamePostfix, $bId));
        $this -> assertTrue(ifDBsnapsAreEqual($db, 'snapbackup', 'snapbackup'.$expTableNamePostfix, $bId));
        //check JSON and dump files
    }

    public function provider(){
        $db = new mysqli('localhost', 'app_crawler', 'Hja72_sdW', 'bcrawler_test');
        if ($db -> connect_errno) {
            echo "<p class='error'>Error: Failed to connect to MySQL: (".$db->connect_errno.") ".$db->connect_error ."</p>\r\n";
            return false;
        }
        $db -> query("TRUNCATE TABLE `snapshots`;");
        $db -> query("TRUNCATE TABLE `snapbackup`;");
        $db -> close();
        return array (
            array(1, dirname(__FILE__)."/../examples/k1example_05022014.htm", '_050214', array(30,30,0,30)),
            array(2, dirname(__FILE__)."/../examples/k2example_05022014.htm", '_050214', array(53,53,0,53)),
            array(1, dirname(__FILE__)."/../examples/k1example_14022014.htm", '_140214', array(34,17,30,21)),
            array(2, dirname(__FILE__)."/../examples/k2example_14022014.htm", '_140214', array(57,43,53,18)),
            array(1, dirname(__FILE__)."/../examples/k1example_26022014.htm", '_260214', array(34,11,17,16)),
            array(2, dirname(__FILE__)."/../examples/k2example_26022014.htm", '_260214', array(61,33,43,47)),
        );
    }
}