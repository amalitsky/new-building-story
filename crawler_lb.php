<?php
/** Functions for crawler and parser for Reutov 9mk
 *
 * PHP version 5
 *
 * @category File
 * @package  Crawler_Parser
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 */


function compareFlatsByIdAndBId($a, $b) {
    if($a['bId'] > $b['bId']){ $res = 1;}
    else if ($a['bId'] < $b['bId']) {$res = -1;} else {
        if ($a['extFlatId'] > $b['extFlatId']) { $res = 1;}
        else if ($a['extFlatId'] < $b['extFlatId']) { $res = -1;} else { $res = 0; }
    }
    return $res;
}
function compareFlatIds($a, $b){ return $a['extFlatId'] - $b['extFlatId']; }
function compareFlats($a, $b){ return strcmp(implode('-', $a), implode('-', $b) ); }

/**
 * Gets main table DOM element from requested file
 *
 * @param string $link Link to local or web file with information source
 * @param bool|resource $requestContext
 * @return DOMNode|null
 */
function r9mkLoadFileAndGetTable($link, $requestContext = null){
    if(!(@$file = file_get_contents($link, false, $requestContext))){
        echo "<p>".date("Y-m-d H:i:s T")." Error: File on address <i>".$link."</i> can't be even loaded. [".__FUNCTION__."]</p>\r\n";
        return null;
    };
    $dom = new DOMDocument();
    $dom -> preserveWhiteSpace = false;
    $file = iconv("WINDOWS-1251", "UTF-8", $file);
    libxml_use_internal_errors(true);
    $dom -> loadHTML(mb_convert_encoding($file,"HTML-ENTITIES","UTF-8"));
    libxml_use_internal_errors(false);
    $xpath = new DOMXPath($dom);
    $table = $xpath -> query('//table[@class="housemodbigs"]') -> item(0);
    if($table === null){
        echo "<p>".date("Y-m-d H:i:s T")." Error: File on address <i>".$link."</i> doesn't have specified table. [".__FUNCTION__."]</p>\r\n";
    }
    return $table;
}

/**
 * Parse main table DOM element into array of flats (with onSale status), presented on website.
 *
 * Takes <table> object from main table DOM element, get's all <td> elements with proper
 * settings and makes a array of flats with bId, extId, status and price properties.
 *
 * @param DOMNode $tableObj Table DOMElement
 * @param integer $bId Internal ID of the building
 * @return array|null
 */
function r9mkExtractFlatsOnSale($tableObj, $bId){
    if(!($tableObj instanceof DOMElement)){
        echo "<p>Error: Expected TABLE element is broken for building ".$bId.". [".__FUNCTION__."]</p>\r\n";
        return null;
    }
    $expTdQ = array(1 => 1378, 2 => 981);
    $flatsOnSale = array();
    $tdQ = $tableObj -> getElementsByTagName('td') -> length;
    if($tdQ !== $expTdQ[$bId]){
        echo "<p>Error: Number of TD elements in TABLE is wrong (".$tdQ." instead of ".$expTdQ[$bId]."), building ".$bId.". [".__FUNCTION__."]</p>\r\n";
        return null;
    }
    $flatsFixedQ = 0;
    $dom = new DOMDocument();
    $tableText = $tableObj -> C14N();
    $dom -> loadHTML(mb_convert_encoding($tableText,"HTML-ENTITIES","UTF-8"));
    $xpath = new DOMXPath($dom);
    $tdObjs = $xpath -> query('//table[@class="housemod"]//td[contains(concat(" ", normalize-space(@class), " "), " buildroom ")]');
    $tdObjsQ = $tdObjs -> length;
    if($tdObjsQ === 0){
        echo "<p>Warning: No flats on sale on building ".$bId.". [".__FUNCTION__."]</p>\r\n";
        return null;
    }
    foreach($tdObjs as $tdObj) {
        $tdText = $tdObj -> C14N();
        if( preg_match("~(*UTF8)<td class=\"free buildroom room_[1-4] set_[1-4]_\\d{2,3}-\\d{1,2}_(\\d{7,8})\"><a href=\"\\?id=(\\d{6})&amp;build=17(08|09|10)\">[^<]{2}</a></td>~i", $tdText, $matches)){
            if($matches[3] - $bId !== 7) {
                echo "<p>Error: Unexpected bId (17".$matches[3].") was found while parsing TDs for building ".$bId.". [".__FUNCTION__."]</p>\r\n";
                return null;
            }
            $flatsOnSale[] = array(
                'bId' => $bId, 'extFlatId' => intval($matches[2]),
                'status' => 1, 'price' => intval($matches[1]));
        }
        elseif( preg_match("~(*UTF8)<td class=\"fix buildroom room_[1-4] set_[1-4]_\\d{2,3}-\\d{1,2}_(\\d{7,8})\">[^<]{2}</td>~i", $tdText, $matches)){
            $flatsFixedQ++;
        }
    }
    if(count($flatsOnSale) + $flatsFixedQ !== $tdObjsQ){
        echo "<p>Warning: Parsed only ".(count($flatsOnSale) + $flatsFixedQ)." TDs from ".$tdObjsQ." on building ".$bId.". [".__FUNCTION__."]</p>\r\n";
    }
    usort($flatsOnSale,'compareFlatIds');//check this out
    return $flatsOnSale;
}

/** Takes snapshots form db and web and makes difference arrays.
 *
 * Takes two lists of flats with onSale status - from web and from last previously
 * saved to db snapshot. Makes few arrays for following db saving: sold, newOnSale,
 * updatedPrice.
 *
 * @param array $db [bId, extFlatId, status, price]
 * @param array $web [bId, extFlatId, status, price]
 *
 * @return array
 */
function r9mkSnapsComparePrepare($db, $web){
    usort($db, 'compareFlatsByIdAndBId');
    usort($web, 'compareFlatsByIdAndBId');
    $soldFlats = array_udiff($db, $web, 'compareFlatIds');
    $newFlatsOnSale = array_udiff($web, $db, 'compareFlatIds');
    $flatsOnSaleFromPrevSnap = array_udiff($web, $newFlatsOnSale, 'compareFlatIds');
    $flatsPricesUpd = array_udiff($flatsOnSaleFromPrevSnap, $db, 'compareFlats');
    foreach($soldFlats as &$flat){ $flat['status'] = 3; } //status = sold
    return array (
        'sold' => $soldFlats,
        'newOnSale' => $newFlatsOnSale,
        'prevOnSaleUpdPrice' => $flatsPricesUpd);
}