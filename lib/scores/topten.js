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
        
        var getGameInfo = (team) => {
            
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
        
                allGamesRegex = /GameID=(\d+)">[^>]+>\s+(?:([A-Za-z ]+[^<]+)\s+vs[^>]+>\s*([^>]+)|([^>]+)\s+vs[^>]+>\s*([A-Za-z]+[^<]+))<small>(?:(?:\(completed\))|(?:\(in progress\)))/g;
                allGames = getMatches(page, allGamesRegex);

                for (var i = 0; i < allGames.length; i++) {
                    for (var j = 0; j < allGames[i].length; j++) {
                        allGames[i][j] = allGames[i][j].trim();
                    }
                }

                var foundGame = allGames.find(function (game) {
                	if (game.includes(team)) {
                		return game;
                	}
                });

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
            .then(function(gameInfo) {
                const options = {
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

                    var homeStats = doc.getElementsByTagName("home")[0].childNodes;
                    var awayStats = doc.getElementsByTagName("away")[0].childNodes;

                    for (var i = 0; i < homeStats.length + awayStats.length; i++) {
                    	playerStats = {};

                    	playerStats.id = parseInt(doc.getElementsByTagName("playerid")[i].childNodes[0].nodeValue);
                    	playerStats.name = gameInfo.homeTeam;
                    	playerStats.team = doc.getElementsByTagName("hometeam")[0].childNodes[0].nodeValue;
                    	playerStats.number = parseInt(doc.getElementsByTagName("jumpernumber")[i].childNodes[0].nodeValue);
                    	playerStats.disposals = parseInt(doc.getElementsByTagName("kick")[i].childNodes[0].nodeValue) + parseInt(doc.getElementsByTagName("handball")[i].childNodes[0].nodeValue);
                    	playerStats.goals = parseInt(doc.getElementsByTagName("goal")[i].childNodes[0].nodeValue);
                    	playerStats.behinds = parseInt(doc.getElementsByTagName("behind")[i].childNodes[0].nodeValue);
                    	playerStats.dt = parseInt(doc.getElementsByTagName("dt")[i].childNodes[0].nodeValue);

                    	stats.push(playerStats);
                    }

                    //for (var i = 0; i < awayStats.length; i++) {
                    //	playerStats = {};
//
                    //	playerStats.id = parseInt(awayStats[i].getElementsByTagName("id")[0].childNodes[0].nodeValue);
                    //	playerStats.name = gameInfo.awayTeam;
                    //	playerStats.team = doc.getElementsByTagName("awayteam")[0].childNodes[0].nodeValue;
                    //	playerStats.number = parseInt(awayStats[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);
                    //	playerStats.disposals = parseInt(awayStats[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(awayStats[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
                    //	playerStats.goals = parseInt(awayStats[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
                    //	playerStats.behinds = parseInt(awayStats[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
                    //	playerStats.score = 6 * playerStats.goals + playerStats.behinds;
                    //	playerStats.dt = parseInt(awayStats[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
//
                    //	stats.push(playerStats);
                    //}

                    return stats;
                });
            });
        }

        var getTopTen = (team) => {
        	return getStats(team)
        	.then(function (statsArray) {
        		var topTen = statsArray.sort(function (playerStats) {
        			playerStats.dt;
        		}).reverse().slice(0,10);

        		topTenMsg = "Top players of the game:\n"

        		for (var i = 0; i < topTen.length; i++) {
        			var rank = i + 1;

        			if (rank < 10) {
        				rank = " " + rank.toString();
        			}
        			else {
        				rank = rank.toString();
        			}

        			var msgLine = `${rank}: (${teamEmotes[topTen[i].team]} #${topTen[i].number}) ${topTen[i].name} | ${topTen[i].dt} DT Points | ${topTen[i].disposals} Disposals | Score (g.b.t): ${topTen[i].goals}.${topTen[i].behinds}.${topTen[i].score}\n`;
        			topTenMsg += msgLine;
        		}

        		return topTenMsg;
        	})
        }

        getTopTen(inputTeam).then(function(topTen) {
            bot.sendNotification(topTen, "success", msg);
        });
    }
}