<?php
/**
 * Unit tests for crawler library
 *
 * PHP version 5
 *
 * @category File
 * @package  Crawler_Library_Tests2
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 */
require_once dirname(__FILE__)."/../crawler_lb.php";

function fingerprints($table){
    $q['tables'] = $table -> getElementsByTagName('table') -> length;
    $q['tr'] = $table -> getElementsByTagName('tr') -> length;
    $q['td'] = $table -> getElementsByTagName('td') -> length;
    return array ($q['tables'], $q['tr'], $q['td']);
}

class r9mkLoadFileAndGetTableTest extends PHPUnit_Framework_TestCase{
    /**
     * @dataProvider linksProvider
     */
    public function testR9mkLoadFileAndGetTable($link, $refLink, $expFail = false){
        $getReqContext = stream_context_create( array('http' => array( 'method' => 'GET',
            'header' => "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n".
                "Accept-Encoding: gzip, deflate\r\n"."Accept-Language:	ru-ru,en-us;q=0.8,ru;q=0.5,en;q=0.3\r\n"."Connection: keep-alive\r\n"."Referer: http://novokosino.ndv.ru/sale/\r\n"."User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")));
        $ref = file_get_contents($refLink);
        $dom = new DOMDocument();
        $dom->preserveWhiteSpace = false;
        $ref = iconv("WINDOWS-1251", "UTF-8", $ref);
        libxml_use_internal_errors(true);
        $dom->loadHTML(mb_convert_encoding($ref,"HTML-ENTITIES","UTF-8"));
        libxml_use_internal_errors(false);
        $xpath = new DOMXPath($dom);
        $expTable = $xpath -> query('//table[@class="housemodbigs"]') -> item(0);
        if($expFail){ $this -> expectOutputRegex('/.*Error: File on address.*/'); }
        $table = r9mkLoadFileAndGetTable($link, $getReqContext);
        if(!$expFail){ $this -> assertEquals(fingerprints($expTable), fingerprints($table)); }
        else{ $this -> assertEquals(null, $table); }
        return $table;
        }

    public function linksProvider(){
        return array(
            array(dirname(__FILE__).'/../examples/k1example_05022014.htm','./crawler/b1tableSample.html'),
            array(dirname(__FILE__).'/../examples/k2example_12022014.htm','./crawler/b2tableSample.html'),
            array(dirname(__FILE__).'/../examples/k1example_10022014.htm','./crawler/b1tableSample.html'),
            array(dirname(__FILE__).'/../examples/k2example_13022014.htm','./crawler/b2tableSample.html'),
            array(dirname(__FILE__).'/../examples/k2example_13022014.htm','./crawler/b2tableSample.html'),
            //array('http://novokosino.ndv.ru/sale/?build=1708', './crawler/b1tableSample.html'),
            //array('http://novokosino.ndv.ru/sale/?build=1709', './crawler/b2tableSample.html'),
            //array('http://novokosino.ndv.ru/sale/?build=1710', './crawler/b3tableSample.html'),
            array('./crawler/dummy.html','./crawler/b1tableSample.html', 1),
            array(dirname(__FILE__).'none.htm','./crawler/b1tableSample.html', 1),
        );
    }

    /**
     * @dataProvider tablesProvider
     */
    public function testRmk9extractFlatsOnSale($tableObj, $bId, $expRes){
        if($expRes !== false){
            $this->assertEquals($expRes, count(r9mkExtractFlatsOnSale($tableObj, $bId)));
        }
        else{
            $this->expectOutputRegex('/.*Error:.*/');
            $this->assertSame(null, r9mkExtractFlatsOnSale($tableObj, $bId));
        }
        }

    public function tablesProvider(){
        $links = array(
            array(1, dirname(__FILE__).'/../examples/b1empty_example.html', 0),
            array(1, dirname(__FILE__).'/../examples/k1example_05022014.htm', 30),
            array(1, dirname(__FILE__).'/../examples/k1example_06022014.htm', 28),
            array(1, dirname(__FILE__).'/../examples/k1example_07022014.htm', 25),
            array(1, dirname(__FILE__).'/../examples/k1example_08022014.htm', 20),
            array(1, dirname(__FILE__).'/../examples/k1example_10022014.htm', 22),
            array(1, dirname(__FILE__).'/../examples/k1example_11022014.htm', 21),
            array(1, dirname(__FILE__).'/../examples/k1example_12022014.htm', 18),
            array(1, dirname(__FILE__).'/../examples/k1example_13022014.htm', 15),
            array(1, dirname(__FILE__).'/../examples/k1example_14022014.htm', 17),
            array(1, dirname(__FILE__).'/../examples/k1example_26022014.htm', 11),
            array(1, dirname(__FILE__).'/../examples/k1example_28022014.htm', 9),
            array(1, dirname(__FILE__).'/../examples/b1brokenTable.html', false),
            array(1, dirname(__FILE__).'/../examples/b2empty_example.html', false),
            array(1, dirname(__FILE__).'/../examples/k2example_26022014.htm', false),

            array(2, dirname(__FILE__).'/../examples/b2empty_example.html', 0),
            array(2, dirname(__FILE__).'/../examples/k2example_05022014.htm', 53),
            array(2, dirname(__FILE__).'/../examples/k2example_06022014.htm', 53),
            array(2, dirname(__FILE__).'/../examples/k2example_07022014.htm', 47),
            array(2, dirname(__FILE__).'/../examples/k2example_08022014.htm', 45),
            array(2, dirname(__FILE__).'/../examples/k2example_10022014.htm', 44),
            array(2, dirname(__FILE__).'/../examples/k2example_11022014.htm', 44),
            array(2, dirname(__FILE__).'/../examples/k2example_12022014.htm', 44),
            array(2, dirname(__FILE__).'/../examples/k2example_13022014.htm', 43),
            array(2, dirname(__FILE__).'/../examples/k2example_14022014.htm', 43),
            array(2, dirname(__FILE__).'/../examples/k2example_26022014.htm', 33),
            array(2, dirname(__FILE__).'/../examples/k2example_28022014.htm', 33),
            array(2, dirname(__FILE__).'/../examples/b2unexpectedBid.html', false),
            array(2, dirname(__FILE__).'/../examples/b1empty_example.html', false),
            array(2, dirname(__FILE__).'/../examples/b2brokenTDs.html', 25)
        );
        $failObjs = array(
            array(null, 1, false), array(null, 2, false)
        );
        $tableObjs = array_map(function($elem){
            return array(r9mkLoadFileAndGetTable($elem[1]), $elem[0], $elem[2]); }, $links);

        return array_merge($tableObjs, $failObjs);
    }
}