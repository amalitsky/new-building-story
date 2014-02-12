<!DOCTYPE html>
<html>
<head>
<title>парсер шахматки</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<pre>
<?
error_reporting(E_NOTICE);
require ("./simple_html_dom.php");
$db = new mysqli("localhost", 'root', '', 'bcrawler');
if ($db->connect_errno) { echo "Failed to connect to MySQL: (" . $db->connect_errno . ") " . $db->connect_error; }

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

#$needle = '~<td class="free buildroom room_[123] set_([^"]*)"><a href="\?id=([0-9]{6})&build=(1709|1708|1710)">[^<]*</a></td>~i';

//flat status: 0 - never available, 1 - available(on Sale), 2 - fixed, 3 - sold out
$html = file_get_html('./examples/k1example_06022014.htm');
$tdElems = $html -> find('table.housemodbigs table.housemod td.buildroom');
$parsedFlats = 0; $freshOnSale = array (), $allOnSale = array();
foreach($tdElems as $key => $tdElem) {
	if( preg_match("~free.*?_([[:digit:]]{7,8})\">(<a href=\"\?id=([[:digit:]]{6})&build=(1708|1709|1710)\">.*)?[^<]*</td>~i", $tdElem->outertext, $matches)){
		switch (intval($matches[4])){
			case 1708: $bId = 1; break;
			case 1709: $bId = 2; break;
			case 1710: $bId = 3; break;
			//default:
				}
		if(!($stmt = $db->prepare("SELECT flStatus, flPrice FROM `snapshots` WHERE bId=? AND extFlatId=? ORDER BY snapDate LIMIT 1;"))){
			echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error; }
		if(!$stmt->bind_param("ii", $bId, intval($matches[3]))) { echo "Binding parameters failed: (" . $stmt->errno . ") " . $stmt->error; }
		//echo($bId.", ".intval($matches[3)."<br>");
		if (!$stmt->execute()) { echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error; }
		$lastflStatus = NULL;
		$lastflPrice = NULL;
		if (!$stmt->bind_result($lastflStatus, $lastflPrice)) { echo "Binding output parameters failed: (" . $stmt->errno . ") " . $stmt->error; }
		$stmt->fetch();
		//echo ('Достаём данные по квартире "'.intval($matches[3]).'": последний статуc: "'.$lastflStatus.'", последняя цена: "'.$lastflPrice.'".<br>');
		$stmt->close();
		$tmp[2] = intval($bId);//building
		$tmp[4] = intval($matches[3]);//extId
		$tmp[5] = 1;//status onSale
		$tmp[6] = intval($matches[1]);//price
		if($lastflStatus != $tmp[5] OR $lastflPrice != $tmp[6]) { $freshOnSale[] = $tmp; }
		else { $allOnSale[] = $tmp; }
		$tmp = array();
		$parsedFlats++;
		}
	}
	unset($tdElem);

	# take all flats what were on sale with this bId for the last time and find ones, not presented in a list
	
	$upd_stmt  = $db->prepare("INSERT INTO snapshots(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);");
	foreach ($list as $flat){
		//echo("Пробуем записать в базу bId='".$flat[2]."', extFlatId='".$flat[4]."', flStatus='".$flat[5]."', fPrice='".$flat[6]."'.<br>");
		$upd_stmt ->bind_param('iiii', $flat[2], $flat[4], $flat[5], $flat[6]);
		if (!$upd_stmt->execute()) { echo "Execute failed: (" . $upd_stmt->errno . ") " . $upd_stmt->error; }
		}
$upd_stmt->close();
echo("Flats parsed: ".$parsedFlats.", saved to db: ".count($list).".");
$db->close();

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

//echo json_encode(new snapshotExp($list));
?>
</pre></html>