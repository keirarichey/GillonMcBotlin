var cheerio = require('cheerio');
var rp = require('request-promise');
var xmldom = require('xmldom').DOMParser;

// Import GilMcBotlin data
try {
    var TEAMS = JSON.parse(fs.readFileSync("../data/teams.json"));
    var TEAMNAMES = JSON.parse(fs.readFileSync("../data/teamnames.json"));
    var TEAMEMOTES = JSON.parse(fs.readFileSync("../data/teamemotes.json"));
    var COMMANDS = JSON.parse(fs.readFileSync("../data/commands.json"));
} catch (e) {
    console.log(e);
}

module.exports = {
    name: "score",
    args: true,
    help: "Find out the score of a team's last (or current) game.",
    usage: "<team>",
    aliases: Array.from(COMMANDS["score"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: TEAMS,
    execute: (msg, args, client) => {
        TEAMS["GWS Giants"] = TEAMS["GWS"];
        TEAMEMOTES["GWS Giants"] = TEAMEMOTES["GWS"];

        inputTeam = args;

        if (!Object.values(TEAMNAMES).includes(inputTeam)) {
            var guild = msg.guild;
            var badArgumentEmote = guild.emotes.get(client.EMOTES.badArgumentEmote);
            /* If the request team is not a real team (not in TEAMS array), 
             * the user didn't input a real team, so we will inform them it
             * failed
             */
            var errorText = `${badArgumentEmote} THAT WAS OUT OF BOUNDS! \`${inputTeam}\` is not an accepted input!\n` +
                `Please use "+help" for help.`;
            msg.channel.send({
                embed: {
                    color: client.ERROR_COLOUR,
                    description: errorText
                }
            });
            return;
        };

        var getMatches = (str, regex) => {
            var matchArray = [];
            var match;
            while ((match = regex.exec(str)) !== null) {
                matchArray.push(match.slice(0, -2));
            }
            return matchArray;
        }

        var getID = (team) => {
            team = team.toLowerCase();

            /*  We look into our teams.json file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(TEAMS)).forEach(function (teamName) {
                if (TEAMS[teamName].includes(inputTeam)) {
                    team = teamName;
                }
            });

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
                    for (var i = 0; i < inProgressGames.length; i++) {
                        for (var j = 0; j < inProgressGames[i].length; j++) {
                            inProgressGames[i][j] = inProgressGames[i][j].trim();
                        }
                    }


                    completedRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z]+[^<]+))(?:<small>|\s*)\(completed\)/g;
                    completedGames = getMatches(page, completedRegex);
                    for (var i = 0; i < completedGames.length; i++) {
                        for (var j = 0; j < completedGames[i].length; j++) {
                            completedGames[i][j] = completedGames[i][j].trim();
                        }
                    }

                    for (var i = 0; i < inProgressGames.length; i++) {
                        if (inProgressGames[i].includes(team)) {
                            var gameID = inProgressGames[i][1];
                            return gameID;
                        }
                    }

                    for (var i = 0; i < completedGames.length; i++) {
                        if (completedGames[i].includes(team)) {
                            var gameID = completedGames[i][1];
                            return gameID;
                        }
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        var processFeed = (team) => {
            return getID(team)
                .then(function (gameID) {
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
                            var matchResult = {};
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

                            switch (matchData.percComplete) {
                                case "100":
                                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Game Finished`;
                                    break;
                                case "75":
                                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q3`;
                                    break;
                                case "50":
                                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Half Time`;
                                    break;
                                case "25":
                                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q1`;
                                    break;
                                default:
                                    matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Game time: ${matchData.currentTime} in Q${matchData.currentQuarter}`;
                            }

                            matchResult.final2 = `${TEAMEMOTES[matchData.homeTeam]} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${TEAMEMOTES[matchData.awayTeam]} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal}`;

                            if (parseInt(matchData.homeTotal) === parseInt(matchData.awayTotal)) {
                                matchData.margin = "0";
                                matchResult.final3 = "*Scores level.*";
                            } else if (parseInt(matchData.homeTotal) > parseInt(matchData.awayTotal)) {
                                matchData.margin = (parseInt(matchData.homeTotal) - parseInt(matchData.awayTotal)).toString();
                                matchResult.final3 = `*${matchData.homeTeamShort} by ${matchData.margin}*`;
                            } else if (parseInt(matchData.homeTotal) < parseInt(matchData.awayTotal)) {
                                matchData.margin = (parseInt(matchData.awayTotal) - parseInt(matchData.homeTotal)).toString();
                                matchResult.final3 = `*${matchData.awayTeamShort} by ${matchData.margin}*`;
                            }

                            matchResult.final = `${matchResult.final1}\n${matchResult.final2}\n${matchResult.final3}`;
                            return matchResult;
                        });
                });
        }

        processFeed(inputTeam).then(function (results) {
            msg.channel.send({
                embed: {
                    color: client.SUCCESS_COLOUR,
                    description: results.final
                }
            });
        });
    }
}