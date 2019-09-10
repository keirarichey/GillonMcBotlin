var cheerio = require('cheerio');
var rp = require('request-promise');
var xmldom = require('xmldom').DOMParser;
var yaml = require("yamljs");

// Import GilMcBotlin data
try {
    var teams = yaml.load("../data/teams.yml");
    var teamNames = yaml.load("../data/teamnames.yml");
    var teamEmotes = yaml.load("../data/teamemotes.yml");
    var COMMANDS = yaml.load("../data/commands.yml");
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "now",
    args: false,
    help: "Find out what games are on and what their scores are.",
    aliases: Array.from(COMMANDS["now"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: null,
    execute: (msg, args, client) => {
        teams["GWS Giants"] = teams["GWS"];
        teamEmotes["GWS Giants"] = teamEmotes["GWS"];

        var getMatches = (str, regex) => {
            var matchArray = [];
            var match;
            while ((match = regex.exec(str)) !== null) {
                matchArray.push(match.slice(0, -2));
            }
            return matchArray;
        }

        var getInProgress = () => {
            var options = {
                uri: `http://dtlive.com.au/afl/viewgames.php`,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };

            return rp(options)
                .then(function (data) {
                    data('nav').remove();
                    var page = data('.container').html();

                    inProgressRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z ]+[^<]+))(?:<small>|\s*)\(in progress\)/g;
                    inProgressGames = getMatches(page, inProgressRegex);

                    if (inProgressGames.length === 0) {
                        var vicBiasEmote = msg.guild.emojis.get("275912832992804865");
                        var noGamesText = `Sorry, no games are on! ${vicBiasEmote}`;
                        var noGamesEmbed = {
                            color: client.INFO_COLOUR,
                            description: noGamesText
                        };
                        msg.channel.send({
                            embed: noGamesEmbed
                        });
                        return null;
                    } else {
                        inProgressIDs = [];
                        for (var i = 0; i < inProgressGames.length; i++) {
                            inProgressIDs.push(inProgressGames[i][1]);
                        }
                        return inProgressIDs;
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        var getMatchStats = (gameID) => {
            var options = {
                uri: `http://dtlive.com.au/afl/xml/${gameID}.xml`,
                xmlMode: true,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };
            return rp(options)
                .then(function (data) {
                    var matchData = {};
                    var page = data("xml").html();
                    var doc = new xmldom().parseFromString(page, "text/xml");
                    matchData.location = doc.getElementsByTagName("location")[0].childNodes[0].nodeValue;
                    matchData.currentQuarter = doc.getElementsByTagName("currentquarter")[0].childNodes[0].nodeValue;
                    matchData.currentTime = doc.getElementsByTagName("currenttime")[0].childNodes[0].nodeValue;
                    matchData.percComplete = doc.getElementsByTagName("perccomplete")[0].childNodes[0].nodeValue;
                    matchData.homeTeam = doc.getElementsByTagName("hometeam")[0].childNodes[0].nodeValue;
                    matchData.homeTeamShort = doc.getElementsByTagName("hometeamshort")[0].childNodes[0].nodeValue;
                    matchData.awayTeam = doc.getElementsByTagName("awayteam")[0].childNodes[0].nodeValue;
                    matchData.awayTeamShort = doc.getElementsByTagName("awayteamshort")[0].childNodes[0].nodeValue;
                    matchData.homeGoals = doc.getElementsByTagName("hometeamgoal")[0].childNodes[0].nodeValue;
                    matchData.homeBehinds = doc.getElementsByTagName("hometeambehind")[0].childNodes[0].nodeValue;
                    matchData.homeTotal = (6 * parseInt(matchData.homeGoals) + parseInt(matchData.homeBehinds)).toString();
                    matchData.awayGoals = doc.getElementsByTagName("awayteamgoal")[0].childNodes[0].nodeValue;
                    matchData.awayBehinds = doc.getElementsByTagName("awayteambehind")[0].childNodes[0].nodeValue;
                    matchData.awayTotal = (6 * parseInt(matchData.awayGoals) + parseInt(matchData.awayBehinds)).toString();

                    return matchData;
                });
        }


        async function processInProgress(idList) {
            if (idList === null) {
                return null;
            }
            // Manual override to test idList
            //idList = ["1360", "1370"];
            var gameTracker = [];
            var count = 0;
            while (count < idList.length) {
                await getMatchStats(idList[count])
                    .then(function (matchStats) {
                        gameTracker.push(matchStats);
                        count++;
                    });
            }
            return gameTracker;
        }

        var printInProgress = (gameTracker) => {
            if (gameTracker === null) {
                return null;
            }

            result = "";
            gameTracker.forEach(function (matchData) {
                switch (matchData.percComplete) {
                    case "100":
                        matchData.status = `Game Finished`;
                        break;
                    case "75":
                        matchData.status = `End of Q3`;
                        break;
                    case "50":
                        matchData.status = `Half Time`;
                        break;
                    case "25":
                        matchData.status = `End of Q1`;
                        break;
                    default:
                        matchData.status = `Game time: ${matchData.currentTime} in Q${matchData.currentQuarter}`;
                }
                if (parseInt(matchData.homeTotal) === parseInt(matchData.awayTotal)) {
                    matchData.margin = "0";
                    matchData.finalMargin = "*Scores level.*";
                } else if (parseInt(matchData.homeTotal) > parseInt(matchData.awayTotal)) {
                    matchData.margin = (parseInt(matchData.homeTotal) - parseInt(matchData.awayTotal)).toString();
                    matchData.finalMargin = `*${matchData.homeTeamShort} by ${matchData.margin}*`;
                } else if (parseInt(matchData.homeTotal) < parseInt(matchData.awayTotal)) {
                    matchData.margin = (parseInt(matchData.awayTotal) - parseInt(matchData.homeTotal)).toString();
                    matchData.finalMargin = `*${matchData.awayTeamShort} by ${matchData.margin}*`;
                }
                result += `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location}\n${matchData.status} | ${teamEmotes[matchData.homeTeam]} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${teamEmotes[matchData.awayTeam]} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal} | ${matchData.finalMargin}\n\n`;
            });

            return result;
        }

        getInProgress()
            .then(processInProgress)
            .then(printInProgress)
            .then(function (result) {
                if (result !== null) {
                    msg.channel.send({
                        embed: {
                            color: client.SUCCESS_COLOUR,
                            description: result
                        }
                    });
                }
            });
    }
}