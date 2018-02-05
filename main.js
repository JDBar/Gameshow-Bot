const path = require("path");
const fse = require("fs-extra");
const Discord = require("discord.js");

const gameshowBot = {
  client: new Discord.Client(),
  token: "NDEwMDE0MzUxMzgzMDY4Njcy.DVm_QQ.9NiEie04wiR58VWChZdaGeea4KE"
};

gameshowBot.client.on(`ready`, function () {
  console.log(`Lights... camera... action!`);
  gameshowBot.manager = new (require(path.join(__dirname, `manager.js`)).Manager)();
})

gameshowBot.client.on(`message`, function (message) {
  if (message.author.id === message.guild.ownerID) {
    if (message.content.startsWith("gs!")) {
      switch (message.content) {
        // Returns a list of installed games.
        case "gs!games":
          message.channel.send(`I have these games installed:\n${Object.keys(gameshowBot.manager.games).join(", ")}.`, {reply: message.author});
          break;
        // Passes messages for game managers to interpret.
        default:
          let keys = Object.keys(gameshowBot.manager.games);
          for (let i = 0; i < keys.length; i++) {
            gameshowBot.manager.games[keys[i]].manager.input(message);
          }
          break;
      }
    }
  }
})

gameshowBot.client.login(gameshowBot.token);