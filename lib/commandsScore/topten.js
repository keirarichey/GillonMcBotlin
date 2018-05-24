module.exports = {
	name:		"topten",
	args:		true,
	help:		"Find out the top ten players of a team's last (or current) game. Use `+topten team`.",
	usage: 		"<team>",
	aliases:	["topplayers", "bestplayers", "tenbest"],
	hide:		false,
	guildOnly:	true,

	execute: (msg, args) => {
		var error = false;
		var botChannel = msg.guild.channels.get("253192230200803328"); //bot_spam

		if (msg.channel !== botChannel) {
			return;
		}

		// Import cheerio
		try{
			var cheerio = require('cheerio');
		} catch (e) {
			console.log("cheerio missing. Run `npm install` first.");
			error = true;
		}
		
		// Import rp
		try{
			var rp = require('request-promise');
		} catch (e) {
			console.log("request-promise missing. Run `npm install` first.");
			error = true;
		}
		
		// Import xmldom
		try{
			var xmldom = require('xmldom').DOMParser;
		} catch (e) {
			console.log("xmldom missing. Run `npm install` first.");
			error = true;
		}
		
		// Import yaml
		try {
			var yaml = require("yamljs");
		} catch (e) {
			console.log("yamljs missing. Run `npm install` first.");
			error = true;
		}
		
		// Import GilMcBotlin data
		try {
			var teams = yaml.load("../data/teams.yml");
			var teamNames = yaml.load("../data/teamnames.yml");
			var teamEmotes = yaml.load("../data/teamemotes.yml");
		} catch (e) {
			console.log(`Could not load teams.yml, teamnames.yml, and/or teamemotes.yml. 
						Make sure they\'re in the gilmcbotlin/data/ directory and are valid yml.`);
			error = true;
		}

		// Load message format methods
		try {
			var formatMessage = require('../formatmessage.js');
		} catch (e) {
			console.log("Unable to load message formatting methods:\n" + e);
			error = true;
		}

		if (error) {
			try {
				formatMessage.sendNotification("There was an error loading this command.", "error", msg);
				return;
			} catch (e) {
				msg.reply("There was an error loading this command.", "error", msg);
				return;
			}
		}

		teams["GWS Giants"]			= teams["GWS"];
		teamEmotes["GWS Giants"]	= teamEmotes["GWS"];

		inputTeam = args;

		 if (!Object.values(teamNames).includes(inputTeam)) {
			/* If the request team is not a real team (not in teams array) */
			/* The user didn't input a real team, so we will inform them it failured */
			var errorText = `\<:bt:246541254182174720> THAT WAS OUT OF BOUNDS! \`${inputTeam}\` is not an accepted input!\n`+
							`Please use "+help" for help.`;
			formatMessage.sendNotification(errorText, "error", msg);
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

				var gameInfo		= {};
				gameInfo.gameID		= foundGame[1];
				gameInfo.homeTeam	= foundGame[2];
				gameInfo.awayTeam	= foundGame[3];

				return gameInfo;
			})
			.catch(function (err) {
				console.log(err);
			});
		}
		
		var getStats = (team) => {
			return getGameInfo(team)
			.then(function(gameInfo) {
				var options = {
					uri: `http://dtlive.com.au/afl/xml/${gameInfo.gameID}.xml`,
					xmlMode: true,
					transform: function (body) {
						return cheerio.load(body);
					}
				};
				return rp(options)
				.then(function (data) {
					var stats		= [];
					var page		= data("xml").html();
					var doc			= new xmldom().parseFromString(page, "text/xml");

					var homeStats	= doc.getElementsByTagName("home")[0];
					var awayStats	= doc.getElementsByTagName("away")[0];

					for (var i = 0; i < homeStats.getElementsByTagName("player").length; i++) {
						
						playerStats			= {};

						
						playerStats.id		= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
						playerStats.name	= homeStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
						playerStats.team	= gameInfo.homeTeam;
						playerStats.number	= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);

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
							playerStats.disposals	= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
							playerStats.goals		= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
							playerStats.behinds		= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
							playerStats.dt			= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
							playerStats.marks		= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("mark")[0].childNodes[0].nodeValue);
							playerStats.tackles		= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("tackle")[0].childNodes[0].nodeValue);
							playerStats.tog			= parseInt(homeStats.getElementsByTagName("player")[i].getElementsByTagName("togperc")[0].childNodes[0].nodeValue);
							playerStats.score		= 6 * playerStats.goals + playerStats.behinds;
						} catch (e) {
							playerStats.disposals	= 0;
							playerStats.goals		= 0;
							playerStats.behinds		= 0;
							playerStats.dt			= 0;
							playerStats.marks		= 0;
							playerStats.tackles		= 0;
							playerStats.tog			= 0;
							playerStats.score		= 6 * playerStats.goals + playerStats.behinds;
						}

						stats.push(playerStats);
					}

					for (var i = 0; i < awayStats.getElementsByTagName("player").length; i++) {

						playerStats			= {};

						playerStats.id		= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("playerid")[0].childNodes[0].nodeValue);
						playerStats.name	= awayStats.getElementsByTagName("player")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
						playerStats.team	= gameInfo.awayTeam;
						playerStats.number	= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("jumpernumber")[0].childNodes[0].nodeValue);

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
							playerStats.disposals	= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("kick")[0].childNodes[0].nodeValue) + parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("handball")[0].childNodes[0].nodeValue);
							playerStats.goals		= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("goal")[0].childNodes[0].nodeValue);
							playerStats.behinds		= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("behind")[0].childNodes[0].nodeValue);
							playerStats.dt			= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("dt")[0].childNodes[0].nodeValue);
							playerStats.marks		= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("mark")[0].childNodes[0].nodeValue);
							playerStats.tackles		= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("tackle")[0].childNodes[0].nodeValue);
							playerStats.tog			= parseInt(awayStats.getElementsByTagName("player")[i].getElementsByTagName("togperc")[0].childNodes[0].nodeValue);
							playerStats.score		= 6 * playerStats.goals + playerStats.behinds;
						} catch (e) {
							playerStats.disposals	= 0;
							playerStats.goals		= 0;
							playerStats.behinds		= 0;
							playerStats.dt			= 0;
							playerStats.marks		= 0;
							playerStats.tackles		= 0;
							playerStats.tog			= 0;
							playerStats.score		= 6 * playerStats.goals + playerStats.behinds;
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

		embedColor = 0x33b23b;

		getTopTen(inputTeam).then(function(topTenFields) {
			msg.channel.send({embed: {
				color: embedColor,
				description: "Top players of the game:",
				fields: topTenFields
			}});
		});
	}
}