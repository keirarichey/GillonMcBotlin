// Import Moment
var moment = require("moment");
moment.suppressDeprecationWarnings = true;

// Import mysql
var mysql = require("mysql");

// Load config file
try {
    var config = require("../../config.json");
} catch (e) {
    console.log("Unable to parse config file: " + e);
}

var parseMessage = function (msg, args, client) {
    var intervalList = ["second", "minute", "hour", "day", "week", "month", "year"];
    var argsList = args.split(" ");
    var noMatch = false;
    var errorPosted = false;

    // First, check if the user has passed a valid date or datetime.
    if (moment(args).isValid()) {
        var newDT = moment(args);
    } else {
        var newDT = null;
    }

    // Either the user only gave a time, in which case, set the new datetime to be that time,
    // or, they didn't provide anything.
    var reg = /\s+(\d{1,2}\:\d{2})\s+/;
    // I'm commenting out the real if and replacing it with false, because I want this part to be skipped but may put it back
    // in later.
    if (false) { //if (args.match(reg)) {
        var time = args.match(reg)[1];
        var hours = time.split(":")[0];
        var minutes = time.split(":")[1];
        var newDT = moment();
        // Set the current day's hour to the given hour, and likewise for minute.
        newDT.hour(hours);
        newDT.minute(minutes);
    } else {
        // If no time was given, check to see if any of the time intervals were passed, e.g. 7 days, 12 minutes, 1 hour.
        // If it has, find the number and the interval, and add it.
        for (var interval of intervalList) {
            if (argsList.includes(interval) || argsList.includes(interval + "s")) {
                var intervalValue = interval;
                var quant = argsList.filter(arg => {
                    return Number.isInteger(Number(arg));
                });
                if (quant.length !== 1) {
                    var errorText = `<@${msg.author.id}>: Error using RemindMe: \`${args}\` had too many numerical arguments! ` +
                        //`RemindMe only works with a time and/or date (e.g. \`19:00\`, or \`12:00 31/12/2018\`), OR, with a number and length (e.g. \`7 days\`).\n`+
                        `RemindMe only works with a number and length (e.g. \`7 days\`).\n` +
                        `Please use "+help" for further help.`;
                    msg.channel.send({
                        embed: {
                            color: client.ERROR_COLOUR,
                            description: errorText
                        }
                    });
                    newDT = null;
                    errorPosted = true;
                } else {
                    quant = quant[0];
                    var newDT = moment().add(quant, intervalValue);
                }
            }
        }
    }
    if (newDT === null && !errorPosted) {
        // If it found a match it would've returned by now.
        var errorText = `<@${msg.author.id}>: Error using RemindMe: \`${args}\` didn't contain a time, date, or a time interval! ` +
            //`RemindMe only works with a time and/or date (e.g. \`19:00\`, or \`12:00 31/12/2018\`), OR, with a number and length (e.g. \`7 days\`).\n`+
            `RemindMe only works with a number and length (e.g. \`7 days\`).\n` +
            `Please use "+help" for further help.`;
        msg.channel.send({
            embed: {
                color: client.ERROR_COLOUR,
                description: errorText
            }
        });
    }
    return newDT;
}

module.exports = {
    name: "remindme",
    args: true,
    help: "Set Gil to post when the time is up.",
    usage: "<number> <years/months/weeks/hours/minutes/seconds> [<\"note\">]", // ", or <time> [<date>] [<\"note\">]"
    aliases: ["remind", "reminder"],
    hide: false,
    guildOnly: false,
    modOnly: false,
    botChannelOnly: false,
    inputs: "Amount of time to wait for the reminder",
    execute: (msg, args, client) => {
        var mysqlUser = config.dbuser;
        var mysqlPass = config.dbpass;
        var con = mysql.createConnection({
            host: "localhost",
            user: mysqlUser,
            password: mysqlPass,
            database: "remindme"
        });

        var originDT = moment().format("YYYY-MM-DD HH:mm:ss");

        var regexp = /^([^'"`“”\n]+)(?:\s['"`“”]\s?([^'"`“”]*)\s?['"`“”])?$/i;
        var matches = args.match(regexp);
        var timePart = matches[1];
        var notePart = matches[2];

        var newDT = parseMessage(msg, timePart, client);
        if (newDT === null) {
            return;
        } else {
            newDT = newDT.format("YYYY-MM-DD HH:mm:ss");
        }

        con.connect(err => {
            if (err) {
                console.log(err);
                return;
            }
        });

        if (typeof (notePart) !== "string") {
            notePart = null;
        } else {
            notePart = notePart.trim();
        }

        con.query("INSERT INTO `reminders` (`messageID`, `note`, `new_date`, `origin_date`, `userID`) VALUES ?;", [
            [
                [String(msg.id), notePart, newDT, originDT, String(msg.author.id)]
            ]
        ], (err) => {
            if (err) {
                console.log(err);
                return;
            }

            var remindText = `✅ I'll message you on ${moment(newDT).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n` +
                `\`${notePart}\``;

            if (!msg.author.dmChannel) {
                msg.author.createDM()
                    .then(channel => {
                        channel.send({
                            embed: {
                                color: client.SUCCESS_COLOUR,
                                description: remindText
                            }
                        });
                    });
            } else {
                msg.author.dmChannel.send({
                    embed: {
                        color: client.SUCCESS_COLOUR,
                        description: remindText
                    }
                });
            }
        });

        con.end(err => {
            if (err) {
                console.log(err);
                return;
            }
        });

        msg.react("✅");
    }
}