# GillonMcBotlin
An all-rounder JS bot for the /r/AFL Discord Server.

You'll need a config.json file in the main directory, which should look like this:
```json
{
    "client_id": "CLIENT",
    "token": "TOKEN",
    "prefix": "+",
    "owner": "OWNER'S ID",
    "dbuser": "MYSQL USERNAME",
    "dbpass": "MYSQL PASSWORD"
}```

As such, this also requires a MySQL database for the +remindme command, set up as follows:
```SQL
CREATE DATABASE dbname;
CREATE TABLE `tablename` (
  `reminderID` int(11) NOT NULL AUTO_INCREMENT,
  `messageID` varchar(50) NOT NULL DEFAULT '',
  `note` varchar(11000) DEFAULT NULL,
  `new_date` datetime DEFAULT NULL,
  `origin_date` datetime DEFAULT NULL,
  `userID` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`reminderID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;```