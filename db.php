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

function r9mkLoadSnapFromDB($db, $bId){
    if(!($res = $db -> query("SELECT $bId AS bId, extFlatId, 1 AS status, flPrice AS price FROM snapshots WHERE snapId IN (SELECT MAX(snapId) FROM snapshots WHERE bId=$bId GROUP BY extFlatId) AND flStatus='1' ORDER BY extFlatId;"))){
        echo "<p>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
    }//check order by
    for($fromdb = array(); $row = $res -> fetch_assoc(); $fromdb[] = $row);
    $res -> close();
    return $fromdb;
}

function updateSnapDB($db, $flats, $bId){
    if(!($updStmt  = $db -> prepare("INSERT INTO snapshots(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
        echo "<p>Error: UPDATE statement preparation for building $bId failed : (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
        }
    foreach ($flats as $flat){
        $updStmt -> bind_param('iiii', $flat['bId'], $flat['extFlatId'], $flat['status'], $flat['price']);
        if (!$updStmt -> execute()) {
            echo "<p>Error: UPDATE statement execution for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
        }
    }
    $updStmt -> close();
    return true;
}

function saveBackupSnapDB($db, $flats, $bId){
    if(!($updStmt  = $db -> prepare("INSERT INTO snapbackup(bId, extFlatId, flStatus, flPrice) VALUES (?,?,?,?);"))){
        echo "<p>Error: UPDATE statement prepare for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n"; }
    foreach ($flats as $flat){
        $updStmt -> bind_param('iiii', $flat['bId'], $flat['extFlatId'], $flat['status'], $flat['price']);
        if (!$updStmt -> execute()) {
            echo "<p>Error: UPDATE execution for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n"; }
    }
    $updStmt -> close();
    return true;
}