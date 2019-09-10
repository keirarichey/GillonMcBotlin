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
    name: "topten",
    args: true,
    help: "Find out the top ten players of a team's last (or current) game.",
    usage: "<team>",
    aliases: Array.from(COMMANDS["topten"]),
    hide: false,
    guildOnly: true,
    modOnly: false,
    botChannelOnly: true,
    inputs: teams,
    execute: (msg, args, client) => {
        teams["GWS Giants"] = teams["GWS"];
        teamEmotes["GWS Giants"] = teamEmotes["GWS"];

        inputTeam = args;

        if (!Object.values(teamNames).includes(inputTeam)) {
            var guild = msg.guild;
            var badArgumentEmote = guild.emotes.get(client.EMOTES.badArgumentEmote);
            /* If the request team is not a real team (not in teams array), 
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

        var getGameInfo = (team) => {

            team = team.toLowerCase();

            /*  We look into our teams.yml file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(teams)).forEach(function (teamName) {
                if (teams[teamName].includes(inputTeam)) {
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

                    var isInProgress = false;

                    for (var i = 0; i < inProgressGames.length; i++) {
                        if (inProgressGames[i].includes(team)) {
                            var foundGame = inProgressGames[i];
                            isInProgress = true;
                            break;
                        }
                    }

                    if (!isInProgress) {
                        for (var i = 0; i < completedGames.length; i++) {
                            if (completedGames[i].includes(team)) {
                                var foundGame = completedGames[i];
                                break;
                            }
                        }
                    }

                    var gameInfo = {};
                    gameInfo.gameID = foundGame[1];
                    gameInfo.homeTeam = foundGame[2];
                    gameInfo.awayTeam = foundGame[3];

                    return gameInfo;
                })
                .catch(function (err) {
                    console.log(err);
                });
        }

        var getStats = (team) => {
            return getGameInfo(team)
                .then(function (gameInfo) {
                    var options = {
                        uri: `http://dtlive.com.au/afl/xml/${gameInfo.gameID}.xml`,
                        xmlMode: true,
                        transform: function (body) {
                            return cheerio.load(body);
                        }
                    };
                    return rp(options)
                        .then(function (data) {
                            var stats = [];
                            var page = data("xml").html();
                            var doc = new xmldom().parseFromString(page, "text/xml");

                            var homeStats = doc.getElementsByTagName("home")[0];
                            var awayStats = doc.getElementsByTagName("away")[0];

                            for (var i = 0; i < homeStats.getElementsByTagName("player").length; i++) {

                                playerStats = {};


                                playerStats.id = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
                                playerStats.name = homeStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
                                playerStats.team = gameInfo.homeTeam;
                                playerStats.number = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);

                                /*  NEW WAY (DOESN'T WORK?)
                                statNames = ["dt", "kick", "handball", "mark", "tackle", "goal", "behind", "togperc"];
                                for (var stat in statNames) {
                                    try {
                                        playerStats[stat] = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName(stat)[0].childNodes[0].nodeValue);
                                    } catch (e) {
                                        playerStats[stat] = 0;
                                    }
                                }
                                playerStats.disposals = playerStats.kick + playerStats.handball;
                                playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                */

                                // OLD WAY OF GETTING STATS
                                try {
                                    playerStats.disposals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
                                    playerStats.goals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
                                    playerStats.behinds = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
                                    playerStats.dt = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
                                    playerStats.marks = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("mark")[0].childNodes[0].nodeValue);
                                    playerStats.tackles = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("tackle")[0].childNodes[0].nodeValue);
                                    playerStats.tog = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("togperc")[0].childNodes[0].nodeValue);
                                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                } catch (e) {
                                    playerStats.disposals = 0;
                                    playerStats.goals = 0;
                                    playerStats.behinds = 0;
                                    playerStats.dt = 0;
                                    playerStats.marks = 0;
                                    playerStats.tackles = 0;
                                    playerStats.tog = 0;
                                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                }

                                stats.push(playerStats);
                            }

                            for (var i = 0; i < awayStats.getElementsByTagName("player").length; i++) {

                                playerStats = {};

                                playerStats.id = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
                                playerStats.name = awayStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
                                playerStats.team = gameInfo.awayTeam;
                                playerStats.number = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);

                                /*  NEW WAY (DOESN'T WORK?)
                                statNames = ["dt", "kick", "handball", "mark", "tackle", "goal", "behind", "togperc"];
                                for (var stat in statNames) {
                                    try {
                                        playerStats[stat] = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName(stat)[0].childNodes[0].nodeValue);
                                    } catch (e) {
                                        playerStats[stat] = 0;
                                    }
                                }
                                playerStats.disposals = playerStats.kick + playerStats.handball;
                                playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                */

                                // OLD WAY OF GETTING STATS
                                try {
                                    playerStats.disposals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
                                    playerStats.goals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
                                    playerStats.behinds = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
                                    playerStats.dt = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
                                    playerStats.marks = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("mark")[0].childNodes[0].nodeValue);
                                    playerStats.tackles = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("tackle")[0].childNodes[0].nodeValue);
                                    playerStats.tog = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("togperc")[0].childNodes[0].nodeValue);
                                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                } catch (e) {
                                    playerStats.disposals = 0;
                                    playerStats.goals = 0;
                                    playerStats.behinds = 0;
                                    playerStats.dt = 0;
                                    playerStats.marks = 0;
                                    playerStats.tackles = 0;
                                    playerStats.tog = 0;
                                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                                }

                                stats.push(playerStats);
                            }

                            return stats;
                        });
                });
        }

        var getTopTen = (team) => {
            return getStats(team)
                .then(function (statsArray) {
                    var topTen = statsArray.sort(function (aStats, bStats) {
                        return aStats.dt - bStats.dt;
                    }).reverse().slice(0, 10);

                    topTenFields = [];

                    for (var i = 0; i < topTen.length; i++) {
                        var rank = (i + 1).toString();

                        var heading = `**${rank}**: ${teamEmotes[topTen[i].team]} (#${topTen[i].number}) ${topTen[i].name}\n`;
                        var embedLine = `${topTen[i].dt} DT Points | ${topTen[i].disposals} Disposals | ${topTen[i].marks} Marks | ${topTen[i].tackles} Tackles | ${topTen[i].tog}% TOG\n`;
                        embedLine += `Score (g.b.t): ${topTen[i].goals}.${topTen[i].behinds}.${topTen[i].score}\n`;

                        var field = {
                            name: heading,
                            value: embedLine
                        }

                        topTenFields.push(field);
                    }

                    return topTenFields;
                })
        }

        getTopTen(inputTeam).then(function (topTenFields) {
            msg.channel.send({
                embed: {
                    color: client.SUCCESS_COLOUR,
                    description: "Top players of the game:",
                    fields: topTenFields
                }
            });
        });
    }
}