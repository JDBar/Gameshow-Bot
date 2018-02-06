const fse = require("fs-extra");
const path = require("path");
const main = require("../../main.js")

class Manager {
  constructor (manager) {
    this.name = "wheel-of-discord";
    this.help = {
      "gs!wod-categories": {
        "description": "Display a list of the installed categories for Wheel of Discord.",
        "usage": "gs!wod-categories"
      }
    }
    this.manager = manager;
    this.categories = [];

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
          for (var i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.toLowerCase().endsWith(".json")) {
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