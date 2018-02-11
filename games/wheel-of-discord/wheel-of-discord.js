const fse = require("fs-extra");
const path = require("path");
const WheelOfDiscord = require(path.join(__dirname, "game.js"));

class Manager {
  constructor (manager) {
    this.name = "wheel-of-discord";
    this.help = {
      "gs!wod-start": {
        "description": "Starts a new game of Wheel of Discord.",
        "usage": "gs!wod-start"
      },
      "gs!wod-join": {
        "description": "Joins a game of Wheel of Discord.",
        "usage": "gs!wod-join"
      },
      "gs!wod-leave": {
        "description": "Leaves a game of Wheel of Discord.",
        "usage": "gs!wod-join"
      },
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
    this.channel = undefined;
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
              message.channel.send(`TEST: ${this.game.players.map((n) => {
                return `<@${n.user.id}>`;
              }).join(", ")}... let's get started! Welcome to Wheel of Discord!`);
              this.channel = message.channel;
              this.broadcastBoardState(this.game.nextRound());
            }
          }, this.game.timeToStart * 1000)
          message.channel.send(`TEST: <@${message.author.id}> is starting a game of Wheel of Discord! Type **gs!wod-join** to join!` + 
            `\nThe game will begin in ${this.game.timeToStart} seconds.`);
        }
        break;
      case "gs!wod-join":
        if (typeof this.game !== "undefined" && this.game.joinable) {
          if (this.game.addPlayer(message.author)) {
            message.channel.send(`TEST: <@${message.author.id}> joined! ${this.game.joinable ? "Type **gs!wod-join** to join!" : "There are no more spots!"}` + 
              `\nThe game will begin in ${this.game.timeUntilStart} seconds.`);
          }
        }
        break;
      case "gs!wod-leave":
        if (typeof this.game !== "undefined") {
          let leavingPlayer = this.game.removePlayer(message.author);
          if (leavingPlayer) {
            message.channel.send(`TEST: <@${leavingPlayer.user.id}> left the game`+
              `${this.game.joinable ? "! Type **gs!wod-join** to join!" : `and forfeited $${leavingPlayer.money}.`}`);
          }
        }
        break;
      case "gs!wod-force-stop":
        this.game = undefined;
        clearTimeout(this.timeout);
        this.channel = undefined;
        message.channel.send("WOD has been force stopped.");
        break;
      default:
        if (typeof this.game !== "undefined" && this.game.round > -1) {
          if (this.game.indexOfPlayer(message.author) >= 0) {
            // if player is in the current game, parse their command
          }
        }
        break;
    }
  }

  /**
   * Broadcasts the state of the board using emojis.
   * @param {Object} state 
   */
  broadcastBoardState (state) {
    var boardString = state.map((n) => {
      if (n === null) {
        return ":white_large_square:";
      }
      if (n === " ") {
        return ":black_large_square:";
      } 
      if (n === "\n") {
        return "\n";
      }
      else {
        return `:regional_indicator_${n}:`;
      }
    }).join("");
    this.channel.send(`${this.game.board.category.toUpperCase()}:\n` +
    `${boardString}`);
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
                    let answer = category.answers[j];
                    answer.category = file.replace(".json", "");
                    this.answers.push(answer);
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