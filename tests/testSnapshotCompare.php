<?php
/**
 * Unit tests for crawler library
 *
 * PHP version 5
 *
 * @category File
 * @package  Crawler_Library_Tests
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 */
require_once (dirname(__FILE__)."/../crawler_lb.php");

class snapshotsComparePrepareTest extends PHPUnit_Framework_TestCase{
    /**
     * @dataProvider provider
     */
    public function testSnapshotsCompare($db, $web, $expRes){
           $this->assertEquals($expRes,
                array_map('array_values',r9mkSnapsComparePrepare($db,$web)));
    }

    public function provider(){
        function changeFlatFormat($flat){
            return array ('bId' => $flat[0], 'extFlatId' => $flat[1], 'status' => $flat[2], 'price' => $flat[3]);
        }

        $snaps[0] = array(//building 1, db [bId, extFlatId, status, price]
            array(1,1,1,101), array(1,2,1,102), array(1,3,1,103), array(1,4,1,104),
            array(1,5,1,105), array(1,6,1,106), array(1,7,1,107), array(1,8,1,108),
            array(1,9,1,109), array(1,10,1,110));

        $snaps[1] = array(//building 2, db
            array(2,1,1,201), array(2,2,1,202), array(2,3,1,203), array(2,4,1,204),
            array(2,5,1,205), array(2,6,1,206), array(2,7,1,207), array(2,8,1,208),
            array(2,9,1,209), array(2,20,1,220));

        $snaps[2] = array(//building 1, web
            array(1,1,1,101), array(1,3,1,103), array(1,4,1,104),
            array(1,5,1,125), array(1,6,1,106), array(1,8,1,98),
            array(1,9,1,109), array(1,10,1,120), array(1,20,1,120), array(1,18,1,118));

        $snaps[3] = array(//building 2, web
            array(2,2,1,202), array(2,3,1,203), array(2,21,1,220), array(2,4,1,214),
            array(2,6,1,206), array(2,7,1,217), array(2,8,1,208),
            array(2,10,1,210));

        /*$snaps[4] = array(//building 1, web, errors
            array(1,1,1,101), array(1,1,1,101), array(1,4,2,104),
            array(1,5,1,125), array(1,6,1,106), array(1,8,1,98),
            array(1,9,1,109), array(1,10,1,120), array(1,20,1,120), array(1,18,1,118), array(2,1,1,201));

        $snaps[5] = array(//building 2, web, errors
            array(2,1,1,201), array(2,2,1,202), array(2,3,1,203), array(2,4,1,204),
            array(2,5,1,205), array(2,6,1,206), array(2,7,1,207), array(2,8,1,208),
            array(2,9,1,209), array(2,10,1,210), array(1,1,1,33));

        $snaps[6] = array(//building 1, expected result of [0] + [2]
            array(1,2,3,102), array(1,5,1,125), array(1,7,3,107), array(1,8,1,98),
            array(1,10,1,120), array(1,20,1,120), array(1,18,1,118));

        $snaps[7] = array(//building 2, expected result of [1] + [3]
            array(2,1,3,201), array(2,4,1,214), array(2,5,3,205), array(2,7,1,217),
            array(2,9,3,209), array(2,10,1,210), array(2,21,1,220));*/

        $exp[0] = array (//building 1 - [0] + [2]
            'sold' => array(array(1,2,3,102), array(1,7,3,107)),
            'newOnSale' => array(array(1,18,1,118), array(1,20,1,120)),
            'prevOnSaleUpdPrice' => array(
                    array(1,5,1,125), array(1,8,1,98), array(1,10,1,120)
            ),
        );

        $exp[1] = array (//building 2 - [1] + [3]
            'sold' => array(array(2,1,3,201), array(2,5,3,205),
                array(2,9,3,209), array(2,20,3,220)),
            'newOnSale' => array(array(2,10,1,210), array(2,21,1,220)),
            'prevOnSaleUpdPrice' => array( array(2,4,1,214), array(2,7,1,217)),
        );

        foreach($snaps as &$snap){ $snap = array_map('changeFlatFormat', $snap); }
        foreach ($exp as &$lists){
            foreach ($lists as &$list){
                $list = array_map('changeFlatFormat', $list); }
        }

        return array(
          array($snaps[0], $snaps[2], $exp[0]),
          array($snaps[1], $snaps[3], $exp[1])
        );
    }

}
