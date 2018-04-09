const path = require("path");
const fse = require("fs-extra");
const assert = require("assert");

class Manager {
  constructor () {
    this.games = {};
    this.sessions = {};

    this.findGames()
      .then((files) => {
        this.requireGames(files);
      })
      .catch((err) => {
        console.error(`[GSBot] ERROR: Could not find games.\n\t${err}`);
      })
  }

  /**
   * Accepts the Discord channel id, and the game module name.
   * Starts a session for this channel, preventing other games from interpreting commands for this channel.
   * @param {string} channelId The Discord JS channel.id string.
   * @param {string} name The name of the game module.
   */
  startSession (channelId, name) {
    assert.equal(typeof channelId, "string", "startSession(): channelID must be a string.");
    assert.equal(typeof name, "string", "startSession(): name must be a string.");
    assert.notEqual(typeof this.games[name], "undefined", "startSession(): name does not match the name of any game modules.");

    this.sessions[channelId] = name;
  }

  /**
   * Stops the session for this channel, allowing other games to interpret commands for this channel again.
   * @param {*} channelId The Discord JS channel.id string.
   */
  stopSession (channelId) {
    assert.equal(typeof channelId, "string", "stopSession channelID must be a string.");
    
    this.sessions[channelId] = undefined;
  }

  // /**
  //  * Sends a Discord message to a channel.
  //  * @param {Object} channel 
  //  * @param {string} message 
  //  * @param {Object} options 
  //  */
  // send (channel, message, options) {
  //   channel.send(message, options);
  // }
  
  /**
   * Removes a game from the manager if it reports an error.
   * @param {boolean} operational The operational status of the game module. 
   * @param {string} name The name of the game module.
   * @param {string} err The error to report to the bot administrator.
   */
  status (operational, name, err) {
    assert.equal(typeof operational, "boolean", "status(): operational must be boolean.");
    assert.equal(typeof name, "string", "status() name must be a string.");
    if (typeof err !== "undefined") {
      assert.equal(typeof err, "string", "status() err must be a string.");
    }

    if (operational) {
      console.log(`[GSBot] LOADED: ${name}.`);
    }
    else {
      console.error(`[GSBot] ERROR: ${name} reported an error while initializing:\n\t${err}`)
      delete this.games[name];
    }
  }

  /**
   * Pass a Discord message to all game modules, or the
   * module for the current game session.
   * @param {Object} message A Discord JS message object.
   */
  input (message) {
    // If a game is in session for this channel, pass it to that game's manager object.
    if (typeof this.sessions[message.channel.id] !== "undefined") {
      if (typeof this.games[this.sessions[message.channel.id]].manager.input === "function") {
        this.games[this.sessions[message.channel.id]].manager.input(message);
      }
    }
    // Otherwise, pass the message to all game manager objects.
    else {
      var keys = Object.keys(this.games);
      for (let i = 0; i < keys.length; i++) {
        if (typeof this.games[keys[i]].manager.input === "function") {
          this.games[keys[i]].manager.input(message);
        }
      }
    }
  }

  /**
   * Returns a promise which resolves with an array of folders in ./games
   * @returns {Promise<String[]>}
   */
  findGames () {
    var promise = new Promise((resolve, reject) => {
      fse.readdir(path.join(__dirname, `games`))
        .then(function (files) {
          resolve(files);
        })
        .catch(function (err) {
          reject(err);
        })
    })
    return promise;
  }

  /**
   * Requires .js files in the games folder as keys in the games object.
   * @param {string[]} files 
   */
  requireGames (files) {
    for (let i = 0; i < files.length; i++) {
      let target = path.join(__dirname, `games`, files[i], `${files[i]}.js`);
      fse.pathExists(target)
        .then(() => {
          try {
            this.games[files[i]] = {module: null, manager: null};
            this.games[files[i]].module = require(target);
            this.games[files[i]].manager = new this.games[files[i]].module.Manager(this);
            assert.equal(
              typeof this.games[files[i]].manager.input,
              "function",
              "Game module is missing input(message) function."
            );
            assert.equal(
              typeof this.games[files[i]].manager.help,
              "object",
              "Game module is missing a help object."
            );
          }
          catch (err) {
            console.error(`[GSBot] ERROR: Could not load ${files[i]}:\n\t${err}`)
          }
        })
        .catch((err) => {
          console.error(`[GSBot] ERROR: Could not load ${files[i]}:\n\t${err}`);
        })
    }
  }
}

module.exports = {
  Manager: Manager
}