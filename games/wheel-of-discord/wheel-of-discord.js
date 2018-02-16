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
      },
      "gs!wod-force-stop": {
        "description": "Forced a game of Wheel of Discord to stop immediately.",
        "usage": "gs!wod-force-stop"
      }
    }
    this.manager = manager;
    this.games = {};
    this.timeouts = {};
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
        this.handleGameStart(message);
        break;
      case "gs!wod-join":
        this.handleGameJoin(message);
        break;
      case "gs!wod-leave":
        this.handleGameLeave(message);
        break;
      case "gs!wod-force-stop":
        this.handleForceStop(message);
        break;
      default:
        this.handleDefault(message);
        break;
    }
  }

  /**
   * Handles starting a new game with gs!wod-start
   * @param {Object} message 
   */
  handleGameStart (message) {
    if (typeof this.games[message.channel.id] === "undefined") {
      this.games[message.channel.id] = new WheelOfDiscord.Game(this.answers);
      this.games[message.channel.id].addPlayer(message.author);
      this.games[message.channel.id].startCountdown();
      this.timeouts[message.channel.id] = setTimeout(() => {
        if (this.games[message.channel.id].players.length > 0) {
          message.channel.send(`TEST: ${this.games[message.channel.id].players.map((n) => {
            return `<@${n.user.id}>`;
          }).join(", ")}... let's get started! Welcome to Wheel of Discord!`);
          this.handleNextRound(message);
        }
      }, this.games[message.channel.id].timeToStart * 1000)
      message.channel.send(`TEST: <@${message.author.id}> is starting a game of Wheel of Discord! Type **gs!wod-join** to join!` + 
        `\nThe game will begin in ${this.games[message.channel.id].timeToStart} seconds.`);
    }
  }

  /**
   * Handles joining a game with gs!wod-join
   * @param {Object} message 
   */
  handleGameJoin (message) {
    if (typeof this.games[message.channel.id] !== "undefined" && this.games[message.channel.id].joinable) {
      if (this.games[message.channel.id].addPlayer(message.author)) {
        message.channel.send(`TEST: <@${message.author.id}> joined! ${this.games[message.channel.id].joinable ? "Type **gs!wod-join** to join!" : "There are no more spots!"}` + 
          `\nThe game will begin in ${this.games[message.channel.id].timeUntilStart} seconds.`);
      }
    }
  }

  /**
   * Handles leaving a game with gs!wod-leave
   * @param {Object} message 
   */
  handleGameLeave (message) {
    if (typeof this.games[message.channel.id] !== "undefined") {
      let turn = this.games[message.channel.id].turn;
      let leavingPlayer = this.games[message.channel.id].removePlayer(message.author);
      if (leavingPlayer) {
        message.channel.send(`TEST: <@${leavingPlayer.user.id}> left the game`+
          `${this.games[message.channel.id].joinable ? "! Type **gs!wod-join** to join!" : `and forfeited $${leavingPlayer.money}.`}`);

        if (!this.games[message.channel.id].joinable) {
          // there are no more players in this game, so it's not joinable
          this.handleGameEnd(message);
        }
        if (turn !== this.games[message.channel.id].turn) {
          // it was the removed player's turn, and now it's someone else
          this.handleNextTurn(message);
        }
      }
    }
  }

  /**
   * Handles the next round of the game.
   * @param {Object} message 
   */
  handleNextRound (message) {
    this.games[message.channel.id].nextRound();
    this.broadcastBoardState(message.channel);
    handleNextTurn();
  }

  /**
   * Handles the next turn of the game.
   * @param {Object} message 
   */
  handleNextTurn (message) {
    var game = this.games[message.channel.id];

    if (typeof message === "undefined") {
      // There is no message, so this is the beginning of a new round.
      message.channel.send(`<@${game.turn.id}> $${game.turn.money}: It's your turn.\n` +
        `Type \`spin\` to begin!`);
        //`You can type a consonant, type a vowel, or type a guess.`);
    }
    else {
      // Parse the message of the active player.
      if (game.spin === null && message.content.trim().toLowerCase().startsWith("spin")) {

      }
      else if (game.spin !== null && message.content.trim().length === 1) {
        let hasVowel = message.content.toLowerCase().match(/[aeiou]/);
        if (hasVowel) {
          let vowel = hasVowel[0];
          let amount = game.buyVowel(vowel);
          if (amount === -1) {
            message.channels.send(`<@${message.author.id}, you don't have the $${game.vowelPrice} needed to buy a vowel.`);
          }
          else if (amount > 0) {
            message.channel.send(`<@${message.author.id}>, there ${amount == 1 ? `is 1 ${vowel}` : `are ${amount} ${vowel}'s`}!`);
          }
          else {
            message.channel.send(`<@${message.author.id}>, there were no ${vowel}'s. Sorry.`);
          }
        }
        else {
          let hasConsonant = message.content.toLowerCase().match(/[b-df-hj-np-tv-z]/);
          if (hasConsonant) {
            let consonant = hasConsonant[0];
            let amount = game.guessConsonant(consonant);
            if (amount > 0) {
              message.channel.send(`<@${message.author.id}>, there ${amount == 1 ? `is 1 ${consonant}` : `are ${amount} ${consonant}'s`}!`);
            }
            else {
              message.channel.send(`<@${message.author.id}>, there were no ${consonant}'s. Sorry.`);
            }
          }
        }
      }
    }
  }

  /**
   * Handles the end of the game.
   * @param {Object} message 
   */
  handleGameEnd (message) {
    this.games[message.channel.id] = undefined;
    clearTimeout(this.timeouts[message.channel.id]);
    message.channel.send(`Wheel of Discord has ended! Thanks for playing.`);
  }

  /**
   * Handles force stopping a game with gs!wod-force-stop
   * @param {Object} message 
   */
  handleForceStop (message) {
    this.handleGameEnd(message);
    message.channel.send("WOD has been force stopped.");
  }

  /**
   * Handles messages that aren't prefixed with gs!wod.
   * @param {Object} message 
   */
  handleDefault (message) {
    if (typeof this.games[message.channel.id] !== "undefined" && this.games[message.channel.id].round > 0) {
      if (this.games[message.channel.id].turn.user.id === message.author.id) {
        handlenextTurn(message);
      }
    }
  }

  /**
   * Broadcasts the state of the board to a Discord channel using emojis.
   * @param {Object} state 
   * @param {Object} channel
   */
  broadcastBoardState (channel) {
    var state = this.games[message.channel.id].board.state;
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
    channel.send(`${this.games[channel.id].board.category.toUpperCase()}:\n` +
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