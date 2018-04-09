const path = require("path");
const fse = require("fs-extra");
const Discord = require("discord.js");

const gameshowBot = {
  manager: new (require(path.join(__dirname, "manager.js")).Manager)(),
  config: fse.readJsonSync(path.join(__dirname, "config.json"), {throws: false}),
  client: new Discord.Client(),
  help: fse.readJsonSync(path.join(__dirname, "help.json"))
};

// Log the bot into Discord!
initializeBot();
gameshowBot.client.login(gameshowBot.config.token);

/**
 * Initializes the bot.
 */
function initializeBot () {
  /**
   * Checks for a Discord Bot API Token in config.json.
   * {
   *     "token": "bot_token_here"
   * }
   * Creates config.json if it doesn't exist.
   */
  if (
    gameshowBot.config === null
    || typeof gameshowBot.config.token === "undefined"
    || gameshowBot.config.token === ""
  ) {
    console.error(`[GSBot] ERROR: "token" not present in config.json`);
    fse.writeJsonSync(
        path.join(__dirname, "config.json"),
        {token: ""},
        {throws: false}
    );
  }

  gameshowBot.client.on(
    "ready",
    function onReady () {
      console.log("[GSBot] Lights... camera... action!");
    }
  );
  
  gameshowBot.client.on(
    "message",
    function onMessage (message) {
      if (message.content.startsWith("gs!")) {
        let firstWord = message.content.split(/\s/)[0];
        switch (firstWord) {
          case "gs!games":
            gamesCommand(message);
            break;
          case "gs!help":
            helpCommand(message);
            break;
          default:
            // Pass message for game modules to interpret.
            gameshowBot.manager.input(message);
            break;
        }
      }
      else {
        gameshowBot.manager.input(message);
      }
    }
  );
}

/**
 * Handles the built-in gs!games command.
 * Displays a list of installed games.
 * @param {Object} message Discord JS message object.
 */
function gamesCommand (message) {
  message.channel.send(
    `<@${message.author.id}> I have these games installed:` +
    `\n\`\`\`${Object.keys(gameshowBot.manager.games).join("\n")}\`\`\``
  );
}

/**
 * Handles the built-in gs!help command.
 * Displays usage tips for commands.
 * @param {Object} message Discord JS message object.
 */
function helpCommand (message) {
  var commands = message.content.split(/\s/);
  // gs!help
  if (commands.length === 1) {
    message.channel.send(
      `Type **gs!help gs!command** to learn more about a command.` +
      `\n\`\`\`${Object.keys(gameshowBot.help).join(", ")}\`\`\``
    );
    return;
  }

  // gs!help gs!command
  if (typeof gameshowBot.help[commands[1]] !== "undefined") {
    let description = gameshowBot.help[commands[1]].description;
    let usage = gameshowBot.help[commands[1]].usage;
    message.channel.send(
      `**${commands[1]}** -- ${description}` +
      `\n**Usage**: ${usage}`
    );
    return;
  }

  // gs!help game
  if (typeof gameshowBot.manager.games[commands[1]] !== "undefined") {
    message.channel.send(
      `Type **gs!help command** to learn more about a command.` +
      `\n\`\`\`${Object.keys(gameshowBot.manager.games[commands[1]].manager.help).join(", ")}\`\`\``
    );
    return;
  }

  // gs!help gs!game-command
  let gameNames = Object.keys(gameshowBot.manager.games);
  for (let i = 0; i < gameNames.length; i++) {
    try {
      // if the command belongs to a particular game module
      if (typeof gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]] !== "undefined") {
        let description = gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]].description;
        let usage = gameshowBot.manager.games[gameNames[i]].manager.help[commands[1]].usage;
        message.channel.send(
          `**${commands[1]}** -- ${description}` +
          `\n**Usage**: ${usage}`
        );
        return;
      }
    }
    catch (err) {
      console.error(`[GSBot] ERROR:\n\t${err}`);
    }
  }
}