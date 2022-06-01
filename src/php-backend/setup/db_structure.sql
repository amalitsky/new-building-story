-- phpMyAdmin SQL Dump
-- version 3.5.2

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `bcrawler`
--
-- CREATE DATABASE `bcrawler` DEFAULT CHARACTER SET latin1 COLLATE ;
-- USE `bcrawler`;

-- --------------------------------------------------------

--
-- Table structure for table `flats`
--

CREATE TABLE IF NOT EXISTS `flats` (
  `bId` smallint(5) unsigned NOT NULL,
  `id` smallint(5) unsigned NOT NULL,
  `extId` mediumint(8) unsigned NOT NULL,
  `sectId` tinyint(3) unsigned NOT NULL,
  `num` smallint(5) unsigned NOT NULL,
  `floor` tinyint(3) unsigned NOT NULL,
  `numOnFloor` tinyint(3) unsigned NOT NULL,
  `rooms` tinyint(3) unsigned NOT NULL,
  `square` decimal(7,2) unsigned NOT NULL,
  PRIMARY KEY (`bId`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `snapbackup`
--

CREATE TABLE IF NOT EXISTS `snapbackup` (
  `snapId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `flatId` int(10) unsigned DEFAULT NULL,
  `bId` mediumint(8) unsigned NOT NULL,
  `sectId` smallint(5) unsigned DEFAULT NULL,
  `extFlatId` mediumint(8) unsigned DEFAULT NULL,
  `flStatus` smallint(5) unsigned DEFAULT NULL,
  `flPrice` int(10) unsigned DEFAULT NULL,
  `snapDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`snapId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `snapshots`
--

CREATE TABLE IF NOT EXISTS `snapshots` (
  `snapId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `flatId` int(10) unsigned DEFAULT NULL,
  `bId` mediumint(8) unsigned NOT NULL,
  `sectId` smallint(5) unsigned DEFAULT NULL,
  `extFlatId` mediumint(8) unsigned DEFAULT NULL,
  `flStatus` smallint(5) unsigned DEFAULT NULL,
  `flPrice` int(10) unsigned DEFAULT NULL,
  `snapDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`snapId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
