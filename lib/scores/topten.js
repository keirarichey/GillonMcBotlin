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

		            var homeStats = doc.getElementsByTagName("home")[0];
		            var awayStats = doc.getElementsByTagName("away")[0];

		            for (var i = 0; i < homeStats.getElementsByTagName("player").length; i++) {
		                
		                playerStats = {};
		                
		                playerStats.id = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
		                playerStats.name = homeStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		                playerStats.team = gameInfo.homeTeam;
		                playerStats.number = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);
		                try {
		                    playerStats.disposals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
		                    playerStats.goals = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
		                    playerStats.behinds = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
		                    playerStats.dt = parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
		                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
		                } catch (e) {
		                    playerStats.disposals = 0;
		                    playerStats.goals = 0;
		                    playerStats.behinds = 0;
		                    playerStats.dt = 0;
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
		                try {
		                    playerStats.disposals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
		                    playerStats.goals = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
		                    playerStats.behinds = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
		                    playerStats.dt = parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
		                    playerStats.score = 6 * playerStats.goals + playerStats.behinds;
		                } catch (e) {
		                    playerStats.disposals = 0;
		                    playerStats.goals = 0;
		                    playerStats.behinds = 0;
		                    playerStats.dt = 0;
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
        		}).reverse().slice(0,10);

        		topTenMsg = "Top players of the game:\n";

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
    },
    args: "Team name, nickname, or abbreviation.",
    help: "Find out the top ten players of a team's last (or current) game. Use `+topten team`.",
    hide: false
}