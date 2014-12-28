<?php
/** Functions for DB layer
 *
 * PHP version 5
 *
 * @category File
 * @package  crawler DB
 * @author   Malitsky Alexander <a.malitsky@gmail.com>
 * @license  GNU GENERAL PUBLIC LICENSE
 */
/**
 * Gets all onSale apartments from the last snapshot.
 *
 * @param object $db MYSQLi connection
 * @param integer $bId Internal building ID
 * @return array|bool
 */
function r9mkLoadSnapFromDB($db, $bId){
    if(!($res = $db -> query("SELECT d.bId, d.extFlatId, 1 AS status, d.flPrice AS price FROM (SELECT MAX(a.snapId) as snapId FROM snapshots AS a WHERE a.bId=$bId GROUP BY a.flatId) as b JOIN snapshots AS d ON b.snapId = d.snapId WHERE d.flStatus=1 ORDER BY d.extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    for ($fromdb = array(); $tmp = $res -> fetch_assoc();) { $fromdb[] = $tmp; }
    $res -> close();
    return $fromdb;
}

/**
 * Findes all flats updated between from and till dates.
 *
 * @param object $db MYSQLi connection to database
 * @param integer $bId Internal building ID
 * @param integer $from unixtime
 * @param integer $till unixtime
 * @return array|bool
 */
function getListOfUpdatedFlats($db, $bId, $from = NULL, $till = NULL){
    $query = "SELECT DISTINCT flatId FROM snapshots WHERE bId = $bId "
        .($from ? " AND snapDate >= '".date('Y-m-d 22:00:00', $from)."'":'')
        .($till ? " AND snapDate <= '".date('Y-m-d 22:00:00', $till)."'":'')
        ." ORDER BY flatId;";

    if(!($res = $db -> query($query))){
        echo "<p class='error'>Error: db query for list of updated flats (from: '".$from."' & till: '".$till."') of building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    for ($list = array(); $tmp = $res -> fetch_assoc();) {
        $list[] = $tmp;
    }
    $res -> close();
    unset($tmp);

    if(!empty($list)){
        return $list;
    }
    else {
        echo "<p class='warn'>Warn: Empty result returned from DB on fetching list of updated flats (from: '".$from."' & till: '".$till."') for building $bId. [".__FUNCTION__."]</p>\r\n";
        return false;
    }
}

/**
 * Saves selected flats to database
 *
 * @param object $db MYSQLi connection to database
 * @param array $flats Flats array to update [bId, extFlatId, status, price]
 * @param integer $bId Internal building ID
 * @return bool
 */
function updateSnapDB($db, $flats, $bId){
    $flatIdShift = array(1 => -126496, 2 => -127673, 3 => -188761);//to count flatId from extFlatId
    if(!($updStmt = $db -> prepare("INSERT INTO snapshots(bId, extFlatId, flatId, flStatus, flPrice) VALUES ($bId, ?, ?, ?, ?);"))){
        echo "<p class='error'>Error: UPDATE statement preparation for building $bId failed : (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
        }
    foreach ($flats as $flat){
        $flat['id'] = $flat['extFlatId'] + $flatIdShift[$bId];
        $updStmt -> bind_param('iiii', $flat['extFlatId'], $flat['id'], $flat['status'], $flat['price']);
        if (!$updStmt -> execute()) {
            echo "<p class='error'>Error: UPDATE statement execution for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
            return false;
        }
    }
    $updStmt -> close();
    return true;
}

/**
 * Saves all flats from WEB to backup database
 *
 * @param object $db MYSQLi connection to DB
 * @param array $flats
 * @param integer $bId Internal building ID
 * @return bool
 */
function saveBackupSnapDB($db, $flats, $bId){
    $flatIdShift = array(1 => -126496, 2 => -127673, 3 => -188761);//to count flatId from extFlatId
    if(!($updStmt  = $db -> prepare("INSERT INTO snapbackup(bId, extFlatId, flatId, flStatus, flPrice) VALUES ($bId, ?, ?, ?, ?);"))){
        echo "<p class='error'>Error: UPDATE statement prepare for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    foreach ($flats as $flat){
        $flat['id'] = $flat['extFlatId'] + $flatIdShift[$bId];
        $updStmt -> bind_param('iiii',  $flat['extFlatId'], $flat['id'], $flat['status'], $flat['price']);
        if (!$updStmt -> execute()) {
            echo "<p class='error'>Error: UPDATE execution for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        }
    }
    $updStmt -> close();
    return true;
}
