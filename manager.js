const path = require("path");
const fse = require("fs-extra");

class Manager {
  constructor () {
    this.games = {};
    this.sessions = {};

    this.findGames()
      .then((files) => {
        this.requireGames(files);
      })
      .catch((err) => {
        console.error(`ERROR: Could not find games.\n\t${err}`);
      })
  }

  /**
   * Accepts the Discord channel id, and the game module name.
   * Starts a session for this channel, preventing other games from interpreting commands for this channel.
   * @param {string} channelId 
   * @param {string} name 
   */
  startSession (channelId, name) {
    this.sessions[channelId] = name;
  }

  /**
   * Stops the session for this channel, allowing other games to interpret commands for this channel again.
   * @param {*} channelId 
   */
  stopSession (channelId) {
    this.sessions[channelId] = undefined;
  }

  /**
   * Sends a Discord message to a channel.
   * @param {Object} channel 
   * @param {string} message 
   * @param {Object} options 
   */
  send (channel, message, options) {
    channel.send(message, options);
  }
  
  /**
   * Removes a game from the manager if it reports an error.
   * @param {boolean} working 
   * @param {string} name 
   * @param {string} err 
   */
  status (working, name, err) {
    if (working) {
      console.log(`LOADED: ${name}.`);
    }
    else {
      console.warn(`ERROR: ${name} reported an error while initializing:\n\t${err}`)
      delete this.games[name];
    }
  }

  /**
   * Pass a Discord message to all game modules.
   * @param {Object} message 
   */
  input (message) {
    if (typeof this.sessions[message.channel.id] !== "undefined") {
      this.games[this.sessions[message.channel.id]].manager.input(message);
    }
    else {
      var keys = Object.keys(this.games);
      for (let i = 0; i < keys.length; i++) {
        this.games[keys[i]].manager.input(message);
      }
    }
  }

  /**
   * Returns a promise which resolves with an array of folders in ./games
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
            this.games[files[i]] = {lib: null, manager: null};
            this.games[files[i]].lib = require(target);
            this.games[files[i]].manager = new this.games[files[i]].lib.Manager(this);
          }
          catch (err) {
            console.log(`ERROR: Could not load ${files[i]}:\n\t${err}`)
          }
        })
        .catch((err) => {
          console.error(`ERROR: Could not load ${files[i]}:\n\t${err}`);
        })
    }
  }
}

module.exports = {
  Manager: Manager
}