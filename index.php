<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<pre>
<?
error_reporting(E_NOTICE);
/*function countIdFromNeighbour($list, $flat2countId){
	$res = NULL;
	$len = count($list);
	for($i = 0; $i < $len; $i++){
		if($list[$i][0] !== 0){
			$res  = $list[$i][0] - ($list[$i][4] - $list[$flat2countId][4]);
			break;
			}
		};
	if($i === $len){
		echo "countIdFromNeighbour ERROR: Can't find an id for a fixed flat - no relevant flat IDs are present in array."; }
	return $res;
	}*/

#$page = file_get_contents('./k1example.htm');
#$needle = '~<td class="free buildroom room_[123] set_([^"]*)"><a href="\?id=([0-9]{6})&build=(1709|1708|1710)">[^<]*</a></td>~i';
#preg_match_all($needle, $page, $matches);

require ("./simple_html_dom.php");
$html = file_get_html('./k1example_05022014.htm');
/*$sections = $html -> find('table.housemodbigs table.housemod');
foreach ($sections as $section){
	$tdElems = array_reverse($html -> find(' td.buildroom,  td.live'));
	 var_dump($rdElems);
	}*/

$tdElems = $html -> find('table.housemodbigs table.housemod td.buildroom');
foreach($tdElems as $key => $tdElem) {
	if( preg_match("~(free).*?_([[:digit:]]{7,8})\">(<a href=\"\?id=([[:digit:]]{6})&build=(1708|1709|1710)\">.*)?[^<]*</td>~i", $tdElem->outertext, $matches)){
		$tmp[0] = intval($matches[4]);//id
		$tmp[1] = ($matches[1] === "free" ? 2 : 3);//status free or fixed
		$tmp[2] = intval($matches[2]);//price
		$tmp[3] = intval($matches[5]);//building
		//$tmp[4] = $key;//to count differences
		$list[] = $tmp;
		}
	}
	unset($tdElem);
/*foreach ($list as $key => &$flat){
	if($flat[0] === 0){ //id is not provided when flat is "fixed"
		$flat[0] = countIdFromNeighbour($list, $key);
		}
	unset($flat);
	}*/
//echo var_dump($list);
class snapshotExp {
	public $date, $list;
	function __construct($list) {
		$this->date = time();
		$this->list = $list;
		}
	}

echo json_encode(new snapshotExp($list));
?>
</pre></html>