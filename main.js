const Discord = require("discord.js");
const client = new Discord.Client();
const token = "NDEwMDE0MzUxMzgzMDY4Njcy.DVm_QQ.9NiEie04wiR58VWChZdaGeea4KE";

client.on(`ready`, function () {
  console.log(`Lights... camera... action!`);
})

client.on(`message`, function (message) {
  if (message.author.id === message.guild.ownerID) {
    switch (message.content) {
      case "ping!":
        message.channel.send("pong!");
        break;
    }
  }
})

client.login(token);