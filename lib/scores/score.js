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

        inputTeam = msg.content.toLowerCase();

         if (!Object.values(teamNames).includes(inputTeam)) {
            /* If the request team is not a real team (not in teams array) */
            /* The user didn't input a real team, so we will inform them it failured */
            bot.sendNotification(`\<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${inputTeam}\` is not an accepted input!\nPlease use "+help" or "<@${bot.user.id}> help" for help.`, "error", msg);
            return;
        };
        
        var getMatches = (str, regex) => {
            var matchArray = [];
            var match;
            while ((match = regex.exec(str)) !== null) {
                matchArray.push(match.slice(0,-2));
            }
            return matchArray;
        }
        
        var getID = (team) => {
            
            team = team.toLowerCase();

            /*  We look into our teams.yml file and find out
             *  which team corresponds to our argument string.
             */
            Array.from(Object.keys(teams)).forEach(function(teamName) {
                if (teams[teamName].includes(inputTeam)) {
                    team = teamName;
                }
            });

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
        
                inProgressRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z ]+[^<]+))<small>\(in progress\)/g;
                inProgressGames = getMatches(page, inProgressRegex);
                
        
                completedRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z ]+[^<]+))<small>\(completed\)/g;
                completedGames = getMatches(page, completedRegex);
        
                for (var i = 0; i < inProgressGames.length; i++) {
                    if (inProgressGames[i].includes(team)) {
                        var gameID = inProgressGames[i][1];
                    }
                }
        
                for (var i = 0; i < completedGames.length; i++) {
                    if (completedGames[i].includes(team)) {
                        var gameID =  completedGames[i][1];
                    }
                }
        
                return gameID;
            })
            .catch(function (err) {
                console.log(err);
            });
        }
        
        var processFeed = (team) => {
            return getID(team)
            .then(function(gameID) {
                const options = {
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
                            matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q#${matchData.currentQuarter}`;
                            break;
                        case "50":
                            matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Half Time`;
                            break;
                        case "25":
                            matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - End of Q#${matchData.currentQuarter}`;
                            break;
                        default:
                            matchResult.final1 = `**${matchData.homeTeam}** vs **${matchData.awayTeam}** at ${matchData.location} - Game time: ${matchData.currentTime} in Q#${matchData.currentQuarter}`;
                    }
                
                    matchResult.final2 = `${matchData.homeTeam} ${matchData.homeGoals}.${matchData.homeBehinds}.${matchData.homeTotal} - ${matchData.awayTeam} ${matchData.awayGoals}.${matchData.awayBehinds}.${matchData.awayTotal}`;
                
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

        processFeed(inputTeam).then(function(results) {
            msg.channel.send(results.final);
        });
    }
}