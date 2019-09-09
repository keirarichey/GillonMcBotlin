var loadError = false;

// Import Moment
try {
    var moment = require("moment");
    moment.suppressDeprecationWarnings = true;
} catch (e) {
    console.log("moment missing. Run `npm install` first.");
    loadError = true;
}

// Import mysql
try {
    var mysql = require("mysql");
} catch (e) {
    console.log("mysql missing. Run `npm install` first.");
    loadError = true;
}

// Load config file
try {
    var config = require("../../config.json");
} catch (e) {
    console.log("Unable to parse config file: " + e);
    loadError = true;
}

var checkLoad = function (msg) {
    if (loadError) {
        var loadErrorEmbed = {
            color: 0xe24540, // red
            description: "There was an error loading this command."
        }
        msg.channel.send({
                embed: loadErrorEmbed
            })
            .catch(e => {
                console.log(`LoadCommand Error:\n` +
                    `${e}\n` +
                    `Member: ${msg.author.displayName}\n` +
                    `Channel: ${msg.channel.name}\n`);
            });
        return;
    }
}

var parseMessage = function (msg, args) {
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
                    var errorEmbed = {
                        color: 0xe24540, // red
                        description: errorText
                    }
                    msg.channel.send({
                        embed: errorEmbed
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
        var errorEmbed = {
            color: 0xe24540, // red
            description: errorText
        }
        msg.channel.send({
            embed: errorEmbed
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
    inputs: "Amount of time to wait for the reminder",

    execute: (msg, args) => {
        checkLoad(msg);

        var mysqlUser = config.dbuser;
        var mysqlPass = config.dbpass;
        var con = mysql.createConnection({
            host: "localhost",
            user: mysqlUser,
            password: mysqlPass,
            database: "remindme"
        });

        var server = msg.guild;
        var originDT = moment().format("YYYY-MM-DD HH:mm:ss");

        var regexp = /^([^'"`“”\n]+)(?:\s['"`“”]\s?([^'"`“”]*)\s?['"`“”])?$/i;
        var matches = args.match(regexp);
        var timePart = matches[1];
        var notePart = matches[2];

        var newDT = parseMessage(msg, timePart);
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
        ], (err, rows) => {
            if (err) {
                console.log(err);
                return;
            }

            var remindText = `✅ I'll message you on ${moment(newDT).format("dddd, MMMM Do YYYY, h:mm:ss a ZZ")} to remind you:\n` +
                `\`${notePart}\``;
            var colour = 0x33b23b;
            var remindEmbed = {
                color: colour,
                description: remindText
            };

            if (!msg.author.dmChannel) {
                msg.author.createDM()
                    .then(channel => {
                        channel.send({
                            embed: remindEmbed
                        });
                    });
            } else {
                msg.author.dmChannel.send({
                    embed: remindEmbed
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