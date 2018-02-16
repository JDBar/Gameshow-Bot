const path = require("path");
const fse = require("fs-extra");
const Discord = require("discord.js");

const gameshowBot = {
  client: new Discord.Client(),
  token: "NDEwMDE0MzUxMzgzMDY4Njcy.DVm_QQ.9NiEie04wiR58VWChZdaGeea4KE",
  help: {
    "gs!games": {
      "description": "Display a list of installed games.",
      "usage": "gs!games"
    },
    "gs!help": {
      "description": "Display a list of commands, or learn how to use a specific command.",
      "usage": "gs!help, gs!help [command], gs!help [game]"
    }
  }
};

gameshowBot.client.on(`ready`, function () {
  console.log(`Lights... camera... action!`);
  gameshowBot.manager = new (require(path.join(__dirname, `manager.js`)).Manager)();
})

gameshowBot.client.on(`message`, function (message) {
  //if (message.author.id === message.guild.ownerID) {
  //}
  if (message.content.startsWith("gs!")) {
    let commands = message.content.split(/\s/);
    switch (commands[0]) {
      // Display a list of installed games.
      case "gs!games":
        message.channel.send(`<@${message.author.id}> I have these games installed:`+
          `\n\`\`\`${Object.keys(gameshowBot.manager.games).join(", ")}\`\`\``);
        break;
      // Display a list of commands, or learn how to use a specific command.
      case "gs!help":
        // gs!help
        if (commands.length === 1) {
          message.channel.send(`Type **gs!help gs!command** to learn more about a command.` +
            `\n\`\`\`${Object.keys(gameshowBot.help).join(", ")}\`\`\``);
        }
        // gs!help gs!command
        else if (typeof gameshowBot.help[commands[1]] !== "undefined") {
          let description = gameshowBot.help[commands[1]].description;
          let usage = gameshowBot.help[commands[1]].usage;
          message.channel.send(`**${commands[1]}** -- ${description}` +
            `\n**Usage**: ${usage}`);
        }
        // gs!help game
        else if (typeof gameshowBot.manager.games[commands[1]] !== "undefined") {
          message.channel.send(`Type **gs!help command** to learn more about a command.` +
            `\n\`\`\`${Object.keys(gameshowBot.manager.games[commands[1]].manager.help).join(", ")}\`\`\``);
        }
        // gs!help gs!game-command
        else {
          let gameNames = Object.keys(gameshowBot.manager.games);
          for (let i = 0; i < gameNames.length; i++) {
            if (typeof gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]] !== "undefined") {
              let description = gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]].description;
              let usage = gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]].usage;
              message.channel.send(`**${commands[1]}** -- ${description}` +
                `\n**Usage**: ${usage}`);
              break;
            }
          }
        }
        break;
      // Passes messages for game managers to interpret.
      default:
        gameshowBot.manager.input(message);
        break;
    }
  }
  else {
    gameshowBot.manager.input(message);
  }
})

gameshowBot.client.login(gameshowBot.token);