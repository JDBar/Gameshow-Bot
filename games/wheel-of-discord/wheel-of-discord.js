const fse = require("fs-extra");
const path = require("path");
const WheelOfDiscord = require(path.join(__dirname, "game.js"));

class Manager {
  constructor (manager) {
    this.name = "wheel-of-discord";
    this.help = {
      "gs!wod-categories": {
        "description": "Display a list of the installed categories for Wheel of Discord.",
        "usage": "gs!wod-categories"
      },
      "gs!wod-answers": {
        "description": "Display the number of installed answers for Wheel of Discord.",
        "usage": "gs!wod-answers"
      }
    }
    this.manager = manager;
    this.game = undefined;
    this.categories = [];
    this.answers = [];

    this.loadCategories()
      .then(()=>{
        this.manager.status(true, this.name);
      })
      .catch(()=>{
        this.manager.status(false, this.name `Could not load categories.`);
      })
  }

  /**
   * Standard function for interpreting new Discord messages.
   * @param {string} message 
   */
  input (message) {
    switch (message.content) {
      case "gs!wod-categories":
        message.channel.send(`${this.categories.join(", ")}.`);
        break;
      case "gs!wod-answers":
        message.channel.send(`I have ${this.answers.length} answers installed for Wheel of Discord!`);
        break;
      case "gs!wod-start":
        if (typeof this.game === "undefined") {
          this.game = new WheelOfDiscord.Game(this.answers);
          this.game.addPlayer(message.author);
          this.game.startCountdown();
          this.timeout = setTimeout(() => {
            if (this.game.players.length > 0) {
              message.channel.send(`${this.game.players.map((n) => {
                return `<@${n.user.id}>`;
              }).join(" ")}, let's get started! Welcome to Wheel of Discord!`);
            }
          })
          message.channel.send(`<@${message.author.id}> is starting a game of Wheel of Discord! Type **gs!wod-join** to join!` + 
            `\nThe game will begin in ${this.game.timeUntilStart} seconds.`);
        }
        break;
      case "gs!wod-join":
        if (typeof this.game !== "undefined" && this.game.joinable) {
          this.game.addPlayer(message.author);
          message.channel.send(`<@${message.author.id}> joined! ${this.game.joinable ? "Type **gs!wod-join** to join!" : "There are no more spots!"}` + 
            `\nThe game will begin in ${this.game.timeUntilStart} seconds.`);
        }
        break;
      case "gs!wod-leave":
        if (typeof this.game !== "undefined") {
          let leavingPlayer = this.game.removePlayer(message.author);
          message.channel.send(`<@${leavingPlayer.user.id}> left the game`+
            `${this.game.joinable ? "! Type **gs!wod-join** to join!" : `and forfeited $${leavingPlayer.money}.`}`);
        }
        break;
    }
  }

  /**
   * Loads files ending with .json from the ./categories directory.
   */
  loadCategories () {
    var promise = new Promise((resolve, reject) => {
      fse.readdir(path.join(__dirname, "categories"), (err, files) => {
        if (err) {
          reject(err);
        }
        else {
          for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.toLowerCase().endsWith(".json")) {
              fse.readJson(path.join(__dirname, "categories", file))
                .then((category) => {
                  for (let j = 0; j < category.answers.length; j++) {
                    this.answers.push(category.answers[j]);
                  }
                })
                .catch((err) => {
                  console.log(`ERROR: wheel-of-discord could not read ${file}\n\t${err}`);
                })
              this.categories.push(file.replace(".json", ""));
            }
          }
          resolve(this.categories);
        }
      });
    })
    return promise;
  }
}

module.exports = {
  Manager: Manager
}