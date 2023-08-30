-- phpMyAdmin SQL Dump
-- version 5.0.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 17, 2021 at 08:07 AM
-- Server version: 10.4.14-MariaDB
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `clear_expired_reserved_boxes` ()  BEGIN

     DECLARE finished INTEGER DEFAULT 0;
     DECLARE BoxId INT;

    -- declare boxid cursor forfinding any row  when reserving reaching due
     DECLARE BoxesCursor
     CURSOR FOR 
     	SELECT `box_id` FROM `boxes` WHERE `available_status`='R' AND `reserved_expire_datetime` < NOW();
        
        -- declare NOT FOUND handler
    DECLARE CONTINUE HANDLER 
        FOR NOT FOUND SET finished = 1;
 
    OPEN BoxesCursor;
 
    updateRboxDue: LOOP
        FETCH BoxesCursor INTO BoxId;
        IF finished = 1 THEN 
            LEAVE  updateRboxDue;
        END IF;
        
        UPDATE `boxes` SET `available_status`='E',`self_reserving`='0',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL, `reserved_expire_datetime`=NULL WHERE `box_id`=BoxId;
    END LOOP updateRboxDue;
    CLOSE BoxesCursor;
    commit;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `update_end_local_store_serv` ()  BEGIN

     DECLARE finished INTEGER DEFAULT 0;
     DECLARE BoxId INT;
     DECLARE ServiceId INT;

    -- declare boxid cursor forfinding any row  when reserving reaching due
     DECLARE L_S_EndCursor
     CURSOR FOR 
     	SELECT `localbox_fkid`,`service_id` FROM `box_servicing` WHERE `expire_datetime` < NOW() AND `service_type`='L_S' AND `service_terminated`='0';
        
        -- declare NOT FOUND handler
    DECLARE CONTINUE HANDLER 
        FOR NOT FOUND SET finished = 1;
 
    OPEN L_S_EndCursor;
 
    updateLocalStoreBoxDue:LOOP
        FETCH L_S_EndCursor INTO BoxId, ServiceId;
        IF finished = 1 THEN 
            LEAVE  updateLocalStoreBoxDue;
        END IF;
        
        UPDATE `box_servicing` SET `service_terminated`='1'  WHERE `service_id`=ServiceId;
        UPDATE `boxes` SET `customerpass_qr`=NULL, `staffpass_qr`=NULL,`available_status`='E',`self_reserving`='0',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL, `reserved_expire_datetime`=NULL WHERE `box_id`=BoxId;
    END LOOP updateLocalStoreBoxDue;
    CLOSE L_S_EndCursor;
    commit;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `update_end_transfer_store_serv` ()  BEGIN

     DECLARE finished INTEGER DEFAULT 0;
     DECLARE BoxId INT;
     DECLARE ServiceId INT;

    -- declare boxid cursor forfinding any row  when reserving reaching due
     DECLARE L_S_EndCursor
     CURSOR FOR 
     	SELECT `localbox_fkid`,`service_id` FROM `box_servicing` WHERE `expire_datetime` < NOW() AND `service_type`='T_S' AND `transfer_complete`='1' AND `service_terminated`='0';
        
        -- declare NOT FOUND handler
    DECLARE CONTINUE HANDLER 
        FOR NOT FOUND SET finished = 1;
 
    OPEN L_S_EndCursor;
 
    updateLocalStoreBoxDue:LOOP
        FETCH L_S_EndCursor INTO BoxId, ServiceId;
        IF finished = 1 THEN 
            LEAVE  updateLocalStoreBoxDue;
        END IF;
        
        UPDATE `box_servicing` SET `service_terminated`='1'  WHERE `service_id`=ServiceId;
        UPDATE `boxes` SET `customerpass_qr`=NULL, `staffpass_qr`=NULL,`available_status`='E',`self_reserving`='0',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL, `reserved_expire_datetime`=NULL WHERE `box_id`=BoxId;
    END LOOP updateLocalStoreBoxDue;
    CLOSE L_S_EndCursor;
    commit;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `firstname`, `lastname`, `username`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
(1, 'test', 'test', 'test', 'test@mail.com', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', '4', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 'test2', 'test2', 'test2', 'test2@mail.com', '$2a$10$K1S7ieb/DL2W6/evcH2Ly.cbmVtuqTxf5CMo/pCc2pQ1VPA0UhjmC', '4', '2021-01-29 06:24:10', '2021-01-29 06:24:10'),
(4, 'mieow', 'mieow', 'test', 'sdfsdf@gmail.com', '$2a$10$nFFC9eF6brOMcYu0AfX3Ju8qqqXvxt3yXOkmi.XHDofHKHCK5gTLS', '4', '0000-00-00 00:00:00', '2021-03-31 08:29:40');

-- --------------------------------------------------------

--
-- Table structure for table `boxes`
--

CREATE TABLE `boxes` (
  `box_id` int(100) NOT NULL,
  `cabinet_fk` int(50) DEFAULT NULL,
  `available_status` enum('R','A','E') DEFAULT 'E',
  `customerpass_qr` varchar(255) DEFAULT NULL,
  `staffpass_qr` varchar(255) DEFAULT NULL,
  `servo_pindetail` varchar(255) DEFAULT NULL,
  `self_reserving` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_by_otherBox` tinyint(1) NOT NULL DEFAULT 0,
  `reservedbyother_box_f_k` int(100) DEFAULT NULL,
  `facereg_filename` varchar(255) DEFAULT NULL,
  `reserved_expire_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `boxes`
--

INSERT INTO `boxes` (`box_id`, `cabinet_fk`, `available_status`, `customerpass_qr`, `staffpass_qr`, `servo_pindetail`, `self_reserving`, `reserved_by_otherBox`, `reservedbyother_box_f_k`, `facereg_filename`, `reserved_expire_datetime`) VALUES
(1, 1, 'E', NULL, NULL, 'pin14', 0, 0, NULL, '', NULL),
(2, 1, 'A', 'D234DSF3DSFasd35gdfj', '3NaJc31Zm9th50n4YAo3', 'pin14', 0, 1, 1, NULL, NULL),
(3, 1, 'E', NULL, NULL, 'pin16', 0, 0, NULL, '', '2021-04-08 12:04:34'),
(4, 1, 'E', NULL, NULL, 'pin17', 0, 0, NULL, '', NULL),
(5, 1, 'A', 'VyilQCG0ctMi1Oec4jzf', NULL, 'pin4', 1, 0, NULL, 'User.1.', NULL),
(6, 1, 'A', 'FJeukgXJyuGTaTXOZfnS', 'wV809Kr2tASPmJ76a2B1', 'pin40', 1, 0, NULL, '', NULL),
(7, 1, 'E', NULL, NULL, 'pin17', 0, 0, NULL, NULL, '2021-03-28 18:21:23'),
(8, 1, 'E', NULL, NULL, 'pin11', 0, 0, NULL, 'User.49.', NULL),
(9, 1, 'E', NULL, NULL, 'pin4', 0, 0, NULL, 'User.48.', '2021-04-14 16:45:46'),
(10, 1, 'E', NULL, NULL, 'pin16', 0, 0, NULL, '', NULL),
(11, 2, 'E', NULL, NULL, 'pin15', 0, 0, NULL, NULL, NULL),
(12, 2, 'E', NULL, NULL, 'pin14', 0, 0, NULL, '', NULL),
(13, 2, 'A', 'ZlidIjRJ5Eo337yaf0Sa', 'EO9todYdFQX1awvG1rl2', 'pin13', 0, 1, 6, NULL, NULL),
(14, 2, 'A', NULL, '', 'pin12', 1, 0, NULL, NULL, NULL),
(15, 2, 'E', NULL, NULL, 'pin11', 0, 0, NULL, NULL, NULL),
(16, 2, 'E', NULL, NULL, 'pin10', 0, 0, NULL, NULL, '2021-03-04 23:01:44'),
(17, 2, 'E', NULL, NULL, 'pin9', 0, 0, NULL, NULL, NULL),
(18, 2, 'A', 'SKQNTIWN8WLDUcq6RLFS', '', 'pin8', 0, 1, NULL, NULL, NULL),
(19, 2, 'A', 'pVZ2WGigFnvxmP8SrZA7', '', 'pin7', 1, 0, NULL, NULL, NULL),
(20, 2, 'E', NULL, NULL, 'pin6', 0, 0, NULL, NULL, '2021-04-14 16:45:54'),
(21, 3, 'E', NULL, NULL, 'pin5', 0, 0, NULL, NULL, '2021-04-01 18:50:50'),
(22, 3, 'E', NULL, NULL, 'pin4', 0, 0, NULL, NULL, '2021-04-01 18:50:57'),
(23, 3, 'E', NULL, NULL, 'pin3', 0, 0, NULL, '', NULL),
(24, 3, 'E', NULL, NULL, 'pin2', 0, 0, NULL, '', NULL),
(25, 3, 'E', NULL, NULL, 'pin1', 0, 0, NULL, '', NULL),
(26, 3, 'E', NULL, NULL, 'pin18', 0, 0, NULL, NULL, '2021-03-31 23:47:31'),
(27, 3, 'E', '', '', 'pin19', 0, 0, NULL, '', NULL),
(28, 3, 'E', NULL, NULL, 'pin20', 0, 0, NULL, '', NULL),
(29, 3, 'A', '7ksUu7vmlAqoRmHyPTZ1', '', 'pin21', 1, 0, NULL, NULL, NULL),
(30, 3, 'A', 'w3BQha4ffI0qaAZCbxkO', '', 'pin22', 1, 0, NULL, NULL, NULL),
(31, NULL, 'E', NULL, NULL, NULL, 0, 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `box_servicing`
--

CREATE TABLE `box_servicing` (
  `service_id` int(100) NOT NULL,
  `localbox_fkid` int(100) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `expire_datetime` datetime NOT NULL,
  `targetbox_fkid` int(100) DEFAULT NULL,
  `usr_email` varchar(255) NOT NULL,
  `usr_phone` int(11) NOT NULL,
  `paid_amount` int(11) NOT NULL,
  `service_type` enum('L_S','T_S') NOT NULL,
  `unlock_method` enum('FnQR','QR') NOT NULL DEFAULT 'QR',
  `transfer_handling` tinyint(1) NOT NULL DEFAULT 0,
  `transfer_complete` tinyint(1) NOT NULL DEFAULT 0,
  `store_hours` int(11) NOT NULL,
  `store_days` int(11) NOT NULL,
  `service_terminated` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `box_servicing`
--

INSERT INTO `box_servicing` (`service_id`, `localbox_fkid`, `start_datetime`, `expire_datetime`, `targetbox_fkid`, `usr_email`, `usr_phone`, `paid_amount`, `service_type`, `unlock_method`, `transfer_handling`, `transfer_complete`, `store_hours`, `store_days`, `service_terminated`) VALUES
(1, 1, '2021-01-17 09:54:45', '2021-03-31 22:49:44', 14, 'yikyekgo@gmail.com', 185773895, 999, 'T_S', 'QR', 1, 0, 0, 0, 0),
(3, 3, '2021-02-13 15:29:31', '2021-02-28 15:29:31', NULL, 'yikyekgo@gmail.com', 185773895, 999, 'L_S', 'QR', 0, 0, 0, 0, 1),
(4, 11, '2021-02-12 20:01:55', '2021-03-31 20:01:55', NULL, 'yikyekgo@gmail.com', 185773895, 999, 'L_S', 'QR', 0, 0, 0, 0, 1),
(33, 6, '2021-03-01 20:25:57', '2021-03-01 21:25:57', NULL, '', 0, 0, 'L_S', 'QR', 0, 0, 1, 0, 1),
(34, 3, '2021-03-03 20:45:40', '2021-03-05 21:45:40', NULL, '', 0, 25, 'L_S', 'FnQR', 0, 0, 1, 2, 1),
(35, 5, '2021-03-04 11:42:21', '2021-04-30 12:42:21', NULL, 'yikyekgo@gmail.com', 2132123132, 25, 'L_S', 'FnQR', 0, 0, 1, 2, 0),
(38, 6, '2021-03-04 17:04:52', '2021-03-05 18:04:52', 13, 'yikyekgo@gmail.com', 123456789, 21, 'T_S', 'QR', 1, 0, 1, 1, 0),
(39, 10, '2021-03-06 14:25:59', '2021-03-06 17:25:59', NULL, 'yikyekgo@gmail.com', 123456789, 3, 'L_S', 'QR', 0, 0, 3, 0, 1),
(41, 1, '2021-03-06 14:49:29', '2021-03-06 16:49:29', NULL, 'yikyekgo@gmail.com', 125959224, 2, 'L_S', 'FnQR', 0, 0, 2, 0, 1),
(46, 8, '2021-03-07 13:58:30', '2021-03-11 14:58:30', NULL, 'yikyekgo@gmail.com', 1231231231, 49, 'L_S', 'FnQR', 0, 0, 1, 4, 1),
(47, 1, '2021-03-08 16:58:52', '2021-04-30 17:58:52', 18, 'yikyekgo@gmail.com', 185773895, 11, 'T_S', 'QR', 1, 1, 1, 0, 0),
(49, 10, '2021-03-23 18:47:37', '2021-03-23 19:47:37', NULL, 'yikyekgo@gmail.com', 1231231236, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(50, 9, '2021-03-23 19:07:34', '2021-03-23 20:07:34', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(53, 3, '2021-03-23 19:33:31', '2021-03-28 17:09:44', 30, 'yikyekgo@gmail.com', 1231231232, 12, 'T_S', 'QR', 1, 1, 1, 0, 1),
(54, 12, '2021-03-24 00:02:19', '2021-03-24 01:02:19', NULL, 'yikyekgo@gmail.com', 1232131231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(55, 4, '2021-03-27 21:42:13', '2021-03-27 22:42:13', NULL, 'yikyekgo@gmail.com', 123213213, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(56, 10, '2021-03-27 23:45:19', '2021-03-28 17:45:19', NULL, 'yikyekgo@gmail.com', 1231231231, 444, 'L_S', 'FnQR', 0, 0, 18, 0, 1),
(58, 8, '2021-03-29 00:22:57', '2021-03-29 01:22:57', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(59, 9, '2021-03-29 15:02:21', '2021-03-29 16:02:21', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(60, 8, '2021-03-29 15:27:57', '2021-04-01 16:27:57', 29, 'yikyekgo@gmail.com', 1231231231, 12, 'T_S', 'QR', 1, 1, 1, 0, 1),
(61, 27, '2021-03-30 00:52:11', '2021-04-17 15:33:13', 19, 'yikyekgo@gmail.com', 1231231231, 20, 'T_S', 'QR', 1, 1, 5, 0, 0),
(62, 25, '2021-03-30 17:20:49', '2021-03-30 18:20:49', NULL, 'yikyekgo@gmail.com', 1123123123, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(63, 24, '2021-03-31 18:53:48', '2021-03-31 19:53:48', NULL, 'yikyekgo@gmail.com', 2147483647, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(64, 23, '2021-03-31 19:48:43', '2021-03-31 20:48:43', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(68, 28, '2021-03-31 20:31:53', '2021-03-31 21:31:53', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(69, 1, '2021-04-01 23:09:24', '2021-04-02 00:09:24', NULL, 'yikyekgo@gmail.com', 1231231231, 518, 'L_S', 'FnQR', 0, 0, 1, 0, 1),
(70, 9, '2021-04-01 23:39:47', '2021-04-02 00:39:47', NULL, 'yikyekgo@gmail.com', 1321231231, 2, 'L_S', 'FnQR', 0, 0, 1, 0, 1),
(71, 8, '2021-04-01 23:50:57', '2021-04-02 00:50:57', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'FnQR', 0, 0, 1, 0, 1),
(72, 10, '2021-04-08 11:50:34', '2021-04-08 12:50:34', NULL, 'yikyekgo@gmail.com', 2147483647, 2, 'L_S', 'QR', 0, 0, 1, 0, 1),
(73, 1, '2021-04-14 16:52:51', '2021-04-14 17:52:51', NULL, 'yikyekgo@gmail.com', 1231231231, 2, 'L_S', 'QR', 0, 0, 1, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `cabinet_set`
--

CREATE TABLE `cabinet_set` (
  `cabinet_id` int(50) NOT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `gpslocation` varchar(255) DEFAULT NULL,
  `totalboxs` int(10) NOT NULL DEFAULT 0,
  `cabinet_addr` varchar(255) DEFAULT NULL,
  `cabinet_pass` varchar(255) DEFAULT NULL,
  `hardware_detail` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `cabinet_set`
--

INSERT INTO `cabinet_set` (`cabinet_id`, `location_name`, `gpslocation`, `totalboxs`, `cabinet_addr`, `cabinet_pass`, `hardware_detail`) VALUES
(1, 'Penang Air Port', 'Latitude: 5.2915 Longitude: 100.2727.', 1, ' Lapangan Terbang Antarabangsa Penang, 11900 Bayan Lepas, Pulau Pinang, Malaysia', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', 'Raspberry Pi 4'),
(2, 'Penang Sunway Hotel', 'Latitude: 5.4143583 Longitude:100.3237193,17', 1, ' 33, Lorong Baru, George Town, 10400 George Town, Pulau Pinang', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', 'Raspberry Pi 4'),
(3, 'Penang Post Office Komtar', 'Latitude: 5.4145 \r\nLongitude: 100.3292.', 1, ' Menara Komtar, 1, Jln Penang, George Town, 10000 George Town, Pulau Pinang', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', 'Raspberry Pi');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(100) NOT NULL,
  `staff_name` varchar(255) DEFAULT NULL,
  `staff_email` varchar(100) DEFAULT NULL,
  `staff_pass` varchar(255) DEFAULT NULL,
  `staff_phone` int(11) DEFAULT NULL,
  `staff_addr` varchar(255) DEFAULT NULL,
  `duty_status` enum('Online','Offline') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `staff_name`, `staff_email`, `staff_pass`, `staff_phone`, `staff_addr`, `duty_status`) VALUES
(1, 'test', 'test@gmail.com', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', 0, NULL, 'Online'),
(2, 'Tester Name 2', 'test2@gmail.com', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', NULL, NULL, NULL),
(3, 'Tester 3', 'test3@gmail.com', '$2a$12$frLcWjSyXBgUe12gKcWdQeRbgIfoB3P07rYB8DKZYe3ko8kq91Nua', NULL, NULL, NULL),
(8, '`12sdsda   sdf dsfsdfsdfsdfsdfsdf345?, ?????, ?, ?, ?, ?, ?, ??, ?', 'popopo////****%%%%%fl@bsb.com', '$2a$12$csccY6mlel9cRDXajFGi9eC5O9XikFaa9YUuBYxagcYd4DwXjWGLm', NULL, NULL, NULL),
(9, 'UNION SELECT 1,@@version;- -', '123F@a.net', '$2a$12$VER/cKjR9AlBfSMAz0XRWOnxA1q3TgWCATRRQ4UGCJF3VaLXKmA12', NULL, NULL, NULL),
(10, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.3', 'adssaddsasda@777.com', '$2a$12$UEDC5erszEYDznvI27rXque7DrceAq3eRj..3K3z0AVSKyOVBe2YO', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transfer_allocation`
--

CREATE TABLE `transfer_allocation` (
  `acquire_id` int(100) NOT NULL,
  `staff_fkid` int(100) NOT NULL,
  `box_servicing_fk` int(100) NOT NULL,
  `transfer_status` enum('Success','Cancelled','Pending') NOT NULL DEFAULT 'Pending',
  `acquire_time` datetime NOT NULL,
  `handling_time` datetime DEFAULT NULL,
  `complete_time` datetime DEFAULT NULL,
  `cancelled_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `transfer_allocation`
--

INSERT INTO `transfer_allocation` (`acquire_id`, `staff_fkid`, `box_servicing_fk`, `transfer_status`, `acquire_time`, `handling_time`, `complete_time`, `cancelled_time`) VALUES
(1, 1, 1, 'Cancelled', '2021-02-24 20:16:30', NULL, NULL, '2021-02-25 11:44:07'),
(2, 1, 1, 'Success', '2021-02-25 11:44:39', '2021-02-25 18:09:54', '2021-03-04 17:43:48', NULL),
(3, 1, 38, 'Cancelled', '2021-03-04 17:44:36', NULL, NULL, '2021-03-22 22:32:50'),
(4, 1, 47, 'Cancelled', '2021-03-22 23:20:41', NULL, NULL, '2021-03-22 23:30:30'),
(5, 1, 47, 'Cancelled', '2021-03-22 23:30:36', NULL, NULL, '2021-03-23 13:30:07'),
(6, 1, 47, 'Cancelled', '2021-03-23 13:46:23', NULL, NULL, '2021-03-23 13:46:40'),
(7, 1, 47, 'Cancelled', '2021-03-23 13:46:45', NULL, NULL, '2021-03-23 15:39:36'),
(8, 1, 47, 'Cancelled', '2021-03-23 15:40:07', NULL, NULL, '2021-03-23 15:40:16'),
(9, 1, 47, 'Cancelled', '2021-03-23 15:40:25', NULL, NULL, '2021-03-23 15:45:32'),
(10, 2, 38, 'Pending', '2021-03-23 15:43:21', NULL, NULL, NULL),
(11, 1, 47, 'Success', '2021-03-23 16:37:08', '2021-03-23 23:06:08', '2021-03-23 23:49:57', NULL),
(12, 1, 53, 'Success', '2021-03-28 13:42:53', '2021-03-28 14:16:11', '2021-03-28 15:09:46', NULL),
(13, 1, 60, 'Success', '2021-03-29 15:29:11', '2021-03-29 19:25:40', '2021-03-29 20:11:55', NULL),
(14, 1, 61, 'Cancelled', '2021-04-14 16:23:40', NULL, NULL, '2021-04-17 12:42:56'),
(15, 1, 61, 'Cancelled', '2021-04-17 12:43:32', NULL, NULL, '2021-04-17 12:43:59'),
(16, 1, 61, 'Success', '2021-04-17 12:44:06', '2021-04-17 12:56:19', '2021-04-17 13:33:13', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `boxes`
--
ALTER TABLE `boxes`
  ADD PRIMARY KEY (`box_id`),
  ADD KEY `cabinet_fk` (`cabinet_fk`),
  ADD KEY `reservedbyother_box_f_k` (`reservedbyother_box_f_k`);

--
-- Indexes for table `box_servicing`
--
ALTER TABLE `box_servicing`
  ADD PRIMARY KEY (`service_id`),
  ADD KEY `localbox_fkid` (`localbox_fkid`),
  ADD KEY `targetbox_fkid` (`targetbox_fkid`);

--
-- Indexes for table `cabinet_set`
--
ALTER TABLE `cabinet_set`
  ADD PRIMARY KEY (`cabinet_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`);

--
-- Indexes for table `transfer_allocation`
--
ALTER TABLE `transfer_allocation`
  ADD PRIMARY KEY (`acquire_id`),
  ADD KEY `staff_fkid` (`staff_fkid`),
  ADD KEY `box_servicing_fk` (`box_servicing_fk`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `boxes`
--
ALTER TABLE `boxes`
  MODIFY `box_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `box_servicing`
--
ALTER TABLE `box_servicing`
  MODIFY `service_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `cabinet_set`
--
ALTER TABLE `cabinet_set`
  MODIFY `cabinet_id` int(50) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `transfer_allocation`
--
ALTER TABLE `transfer_allocation`
  MODIFY `acquire_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `boxes`
--
ALTER TABLE `boxes`
  ADD CONSTRAINT `boxes_ibfk_1` FOREIGN KEY (`cabinet_fk`) REFERENCES `cabinet_set` (`cabinet_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `boxes_ibfk_2` FOREIGN KEY (`reservedbyother_box_f_k`) REFERENCES `boxes` (`box_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `box_servicing`
--
ALTER TABLE `box_servicing`
  ADD CONSTRAINT `box_servicing_ibfk_1` FOREIGN KEY (`localbox_fkid`) REFERENCES `boxes` (`box_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `box_servicing_ibfk_2` FOREIGN KEY (`targetbox_fkid`) REFERENCES `boxes` (`box_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `transfer_allocation`
--
ALTER TABLE `transfer_allocation`
  ADD CONSTRAINT `transfer_allocation_ibfk_1` FOREIGN KEY (`staff_fkid`) REFERENCES `staff` (`staff_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `transfer_allocation_ibfk_2` FOREIGN KEY (`box_servicing_fk`) REFERENCES `box_servicing` (`service_id`) ON DELETE NO ACTION ON UPDATE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `clear_expired_reserved_boxes` ON SCHEDULE EVERY 1 MINUTE STARTS '2021-03-02 18:06:13' ON COMPLETION NOT PRESERVE ENABLE DO CALL `clear_expired_reserved_boxes`()$$

CREATE DEFINER=`root`@`localhost` EVENT `update_end_local_store_serv` ON SCHEDULE EVERY 5 MINUTE STARTS '2021-03-02 18:07:11' ON COMPLETION NOT PRESERVE ENABLE DO CALL `update_end_local_store_serv`()$$

CREATE DEFINER=`root`@`localhost` EVENT `update_end_transfer_store_serv` ON SCHEDULE EVERY 5 MINUTE STARTS '2021-03-02 18:07:55' ON COMPLETION NOT PRESERVE ENABLE DO CALL `update_end_transfer_store_serv`()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
