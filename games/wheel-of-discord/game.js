class Game {
  /**
   * Constructs a game using an array of possible answers.
   * @param {Object[]} answers 
   */
  constructor (answers) {
    this.answers = answers;
    this.maxPlayers = 3;
    this.timeToStart = 60;
    this.numberOfRounds = 5;

    
    this.countdownTime = undefined;
    this.board = undefined;
    this.round = 0;
    this.seen = [];
    this.players = [];
  }

  /**
   * Returns if a player can join the game.
   */
  get joinable () {
    return this.players.length < this.maxPlayers && this.round === 0;
  }

  /**
   * Returns how much time is left until the match starts.
   */
  get timeUntilStart () {
    return Math.max(0, this.timeToStart - Math.ceil(((new Date()).getTime() - this.countdownTime)/1000));
  }

  /**
   * Adds a Discord user as a player to this game.
   * @param {Object} user 
   */
  addPlayer (user) {
    if (this.joinable) {
      if (this.players.map((n) => {return n.user.id}).includes(user.id)) {
        return false;
      }
      this.players.push(new Player(user));
      return true;
    }
    return false;
  }

  /**
   * Removes and returns a user from the game.
   * @param {Object} user 
   */
  removePlayer (user) {
    for (let i = 0; i < this.game.players.length; i++) {
      if (this.game.players[i].user.id === user.id) {
        return this.game.players.splice(i, 1)[0];
      }
    }
    if (this.game.players.length < 1) {
      endGame();
    }
    return false;
  }

  /**
   * Ends the game.
   */
  endGame () {
    this.round = -1;
    this.players = [];
  }

  /**
   * Starts the next round and returns the board state.
   * Returns undefined if the game is over.
   */
  nextRound () {
    if (this.round === this.numberOfRounds) {
      return endGame();
    }
    this.round++;
    var i;
    do {
      i = this.getRandomInt(this.answers.length);
    } while (this.seen.includes(i));
    this.seen.push(i);
    this.board = new Board(this.answers[i]);
    return this.board.state;
  }

  /**
   * Returns an int between [0, max).
   * @param {number} max 
   */
  getRandomInt (max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  /**
   * Stores the time at which the match start countdown begins.
   */
  startCountdown () {
    this.countdownTime = (new Date()).getTime();
  }
}

class Player {
  constructor (user) {
    this.user = user;
    this.money = 0;
  }
}

class Board {
  constructor (answer) {
    this.answer = answer.answer;
    this.category = answer.category;
    this.numberOfWords = answer.numberOfWords;
    this.numberOfLetters = answer.numberOfLetters;
    this.state = this.answer.split("").map((value) => {
      return (value === " ") ? " " : null;
    });
  }

  /**
   * Returns whether the puzzle is solved.
   */
  get isSolved () {
    return !this.state.includes(null);
  }

  /**
   * Returns the number of occurences of a character in the answer, and updates the board state if one is found.
   * @param {string} x 
   */
  verify (x) {
    var letter = x.toLowerCase();
    var amount = 0;
    for (let i = 0; i < this.answer.length; i++) {
      if (this.state[i] === null && this.answer[i].toLowerCase() === letter) {
        amount++;
        this.state[i] = letter;
      }
    }
    return amount;
  }
}

module.exports = {
  Game: Game,
  Player: Player
}