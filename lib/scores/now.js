module.exports = {
    main: (bot, msg) => {
        var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

        if (msg.channel !== botChannel) {
            return;
        }

        // Import cheerio
        try{
            var cheerio = require('cheerio');
        } catch (e) {
            console.log("cheerio missing. Run `npm install` first.");
        }
        
        // Import rp
        try{
            var rp = require('request-promise');
        } catch (e) {
            console.log("request-promise missing. Run `npm install` first.");
        }
        
        // Import xmldom
        try{
            var xmldom = require('xmldom').DOMParser;
        } catch (e) {
            console.log("xmldom missing. Run `npm install` first.");
        }
        
        // Import yaml
        try {
            var yaml = require("yamljs");
        } catch (e) {
            console.log("yamljs missing. Run `npm install` first.");
        }
        
        // Import GilMcBotlin data
        try {
            var teams = yaml.load("../data/teams.yml");
            var teamNames = yaml.load("../data/teamnames.yml");
            var teamEmotes = yaml.load("../data/teamemotes.yml");
        } catch (e) {
            console.log("Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.");
        }

        teams["GWS Giants"] = teams["GWS"];
        teamEmotes["GWS Giants"] = teamEmotes["GWS"];
        
        var getMatches = (str, regex) => {
            var matchArray = [];
            var match;
            while ((match = regex.exec(str)) !== null) {
                matchArray.push(match.slice(0,-2));
            }
            return matchArray;
        }
        
        var getInProgress = () => {
            const options = {
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
                    bot.sendNotification("Sorry, no games are on! <:vicbias:275912832992804865>", "info", msg);
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
        
        var processInProgress = () => {
            return getInProgress()
            .then(function(idList) {
                if (idList === null) {
                    return null;
                }
                gameTracker = [];
                idList.forEach(function (id) {
                    const options = {
                        uri: `http://dtlive.com.au/afl/xml/${id}.xml`,
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
                        console.log(matchData);
                        gameTracker.push(matchData);
                    })
                })

                result = "";
                gameTracker.forEach(function (matchData) {
                    switch (matchData.percComplete) {
                        case "100":
                            matchResult.status = `Game Finished`;
                            break;
                        case "75":
                            matchResult.status = `End of Q#${matchData.currentQuarter}`;
                            break;
                        case "50":
                            matchResult.status = `Half Time`;
                            break;
                        case "25":
                            matchResult.status = `End of Q#${matchData.currentQuarter}`;
                            break;
                        default:
                            matchResult.status = `Game time: ${matchData.currentTime} in Q#${matchData.currentQuarter}`;
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
                    result += `**${matchData.homeTeam}** vs **${matchData.awayTeam} at ${matchData.location} | ${matchData.status} | ${teamEmotes[matchData.homeTeam]} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${teamEmotes[matchData.awayTeam]} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal} | ${matchData.finalMargin}\n`
                });
                return result;
            });
        }

        processInProgress().then(function(result) {
            if (result !== null) {
                bot.sendNotification(result, "success", msg);
            }
        });
    },
    args: "",
    help: "Find out what games are on and what their scores are.",
    hide: false
}