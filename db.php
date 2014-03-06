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
    if(!($res = $db -> query("SELECT $bId AS bId, extFlatId, 1 AS status, flPrice AS price FROM snapshots WHERE snapId IN (SELECT MAX(snapId) FROM snapshots WHERE bId=$bId GROUP BY extFlatId) AND flStatus='1' ORDER BY extFlatId;"))){
        echo "<p class='error'>Error: db SELECT query for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    $fromdb = $res -> fetch_all(MYSQLI_ASSOC);
    $res -> close();
    return $fromdb;
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
    if(!($updStmt = $db -> prepare("INSERT INTO snapshots(bId, extFlatId, flStatus, flPrice) VALUES ($bId, ?, ?, ?);"))){
        echo "<p class='error'>Error: UPDATE statement preparation for building $bId failed : (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
        }
    foreach ($flats as $flat){
        $updStmt -> bind_param('iii', $flat['extFlatId'], $flat['status'], $flat['price']);
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
    if(!($updStmt  = $db -> prepare("INSERT INTO snapbackup(bId, extFlatId, flStatus, flPrice) VALUES ($bId, ?, ?, ?);"))){
        echo "<p class='error'>Error: UPDATE statement prepare for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        return false;
    }
    foreach ($flats as $flat){
        $updStmt -> bind_param('iii',  $flat['extFlatId'], $flat['status'], $flat['price']);
        if (!$updStmt -> execute()) {
            echo "<p class='error'>Error: UPDATE execution for building $bId failed: (".$db->errno.") ".$db->error.". [".__FUNCTION__."]</p>\r\n";
        }
    }
    $updStmt -> close();
    return true;
}