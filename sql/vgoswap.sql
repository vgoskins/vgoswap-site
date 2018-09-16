-- MySQL dump 10.13  Distrib 5.7.17, for Win64 (x86_64)
--
-- Host: localhost    Database: vgoswapexport
-- ------------------------------------------------------
-- Server version	5.5.61-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `balance`
--

DROP TABLE IF EXISTS `balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `balance` (
  `steamid` text,
  `balance` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance`
--

LOCK TABLES `balance` WRITE;
/*!40000 ALTER TABLE `balance` DISABLE KEYS */;
/*!40000 ALTER TABLE `balance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat` (
  `steamid` varchar(50) DEFAULT NULL,
  `msg` text,
  `time` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat`
--

LOCK TABLES `chat` WRITE;
/*!40000 ALTER TABLE `chat` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opentf2`
--

DROP TABLE IF EXISTS `opentf2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `opentf2` (
  `steamid` text,
  `tradeid` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `type` text,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opentf2`
--

LOCK TABLES `opentf2` WRITE;
/*!40000 ALTER TABLE `opentf2` DISABLE KEYS */;
/*!40000 ALTER TABLE `opentf2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `openvgo`
--

DROP TABLE IF EXISTS `openvgo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `openvgo` (
  `steamid` text,
  `tradeid` text,
  `keyarr` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `type` text,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `openvgo`
--

LOCK TABLES `openvgo` WRITE;
/*!40000 ALTER TABLE `openvgo` DISABLE KEYS */;
/*!40000 ALTER TABLE `openvgo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opskinswithdrawals`
--

DROP TABLE IF EXISTS `opskinswithdrawals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `opskinswithdrawals` (
  `steamid` text,
  `transferid` text,
  `amount` decimal(10,2) DEFAULT NULL,
  `custom` text,
  `date` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opskinswithdrawals`
--

LOCK TABLES `opskinswithdrawals` WRITE;
/*!40000 ALTER TABLE `opskinswithdrawals` DISABLE KEYS */;
/*!40000 ALTER TABLE `opskinswithdrawals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tf2buyhistory`
--

DROP TABLE IF EXISTS `tf2buyhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tf2buyhistory` (
  `steamid` text,
  `tradeid` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tf2buyhistory`
--

LOCK TABLES `tf2buyhistory` WRITE;
/*!40000 ALTER TABLE `tf2buyhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `tf2buyhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tf2keys`
--

DROP TABLE IF EXISTS `tf2keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tf2keys` (
  `assetid` varchar(255) NOT NULL,
  `intrade` text,
  PRIMARY KEY (`assetid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tf2keys`
--

LOCK TABLES `tf2keys` WRITE;
/*!40000 ALTER TABLE `tf2keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `tf2keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tf2sellhistory`
--

DROP TABLE IF EXISTS `tf2sellhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tf2sellhistory` (
  `steamid` text,
  `tradeid` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tf2sellhistory`
--

LOCK TABLES `tf2sellhistory` WRITE;
/*!40000 ALTER TABLE `tf2sellhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `tf2sellhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `steamid` text,
  `personaname` text,
  `avatar` text,
  `tradeurl` text,
  `datejoined` text,
  `customsteamid` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vgobuyhistory`
--

DROP TABLE IF EXISTS `vgobuyhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vgobuyhistory` (
  `steamid` text,
  `tradeid` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vgobuyhistory`
--

LOCK TABLES `vgobuyhistory` WRITE;
/*!40000 ALTER TABLE `vgobuyhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `vgobuyhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vgokeys`
--

DROP TABLE IF EXISTS `vgokeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vgokeys` (
  `assetid` int(11) DEFAULT NULL,
  `intrade` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vgokeys`
--

LOCK TABLES `vgokeys` WRITE;
/*!40000 ALTER TABLE `vgokeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `vgokeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vgosellhistory`
--

DROP TABLE IF EXISTS `vgosellhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vgosellhistory` (
  `steamid` text,
  `tradeid` text,
  `keyamount` int(11) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `date` text,
  `custom` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vgosellhistory`
--

LOCK TABLES `vgosellhistory` WRITE;
/*!40000 ALTER TABLE `vgosellhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `vgosellhistory` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-09-16 22:34:36
