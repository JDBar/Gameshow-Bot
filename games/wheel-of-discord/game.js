class Game {
  /**
   * Constructs a game using an array of possible answers.
   * @param {Object[]} answers 
   */
  constructor (answers) {
    this.answers = answers;
    this.maxPlayers = 3;
    this.timeToStart = 2;
    this.numberOfRounds = 5;
    this.vowelPrice = 250;
    this.minimumSolve = 1000;
    this.wheel = [
      "Bankrupt", "Bankrupt", "Bankrupt",
      "Lose",
      500, 500, 500, 500, 500,
      550,
      600, 600, 600,
      650, 650, 650,
      700, 700, 700,
      800,
      900,
      1000,
      2500,
      10000
    ]

    this.countdownTime = undefined;
    this.board = undefined;
    this.round = 0;
    this.seen = [];
    this.players = [];

    this.turn = null;
    this.spin = null;
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
   * Returns index of a user is in this game. -1 if player is not in the game.
   * @param {Object} user 
   */
  indexOfPlayer (user) {
    return this.players.map((n) => {return n.user.id}).indexOf(user.id);
  }

  /**
   * Adds a Discord user as a player to this game. Returns the added player.
   * Returns null if the add was not possible.
   * @param {Object} user 
   */
  addPlayer (user) {
    if (this.joinable) {
      if (this.indexOfPlayer(user) >= 0) {
        return null;
      }
      this.players.push(new Player(user));
      return this.players[this.players.length - 1];
    }
    return null;
  }

  /**
   * Removes and returns a user from the game.
   * Returns null if the remove was not possible.
   * @param {Object} user 
   */
  removePlayer (user) {
    var playerIndex = this.indexOfPlayer(user);
    var removedPlayer = null;
    if (playerIndex >= 0) {
      if (this.turn === this.players[playerIndex]) {
        this.advanceTurn();
      }
      removedPlayer = this.players.splice(playerIndex, 1)[0];
    }
    if (this.players.length < 1) {
      this.endGame();
    }
    return removedPlayer;
  }

  /**
   * Ends the game.
   */
  endGame () {
    this.round = -1;
  }

  /**
   * Starts the next round, next turn, and returns the board state.
   * Returns undefined if the game is over.
   */
  nextRound () {
    if (this.round === this.numberOfRounds) {
      return endGame();
    }
    this.round++;
    this.advanceTurn();
    var i;
    do {
      i = this.getRandomInt(this.answers.length);
    } while (this.seen.includes(i));
    this.seen.push(i);
    this.board = new Board(this.answers[i]);
    return this.board.state;
  }

  /**
   * Sets this.turn to the next player whose turn it is.
   */
  advanceTurn () {
    this.spin = null;
    if (this.turn === null) {
      this.turn = this.players[0];
    }
    else {
      let i = this.players.indexOf(this.turn);
      if (i >= 0) {
        this.turn = this.players[(++i > (this.players.length - 1)) ? 0 : i];
      }
    }
  }

  /**
   * Spins the wheel as the current player.
   * Returns a number, "lose", or "Bankrupt".
   */
  spinWheel () {
    let result = this.wheel[this.getRandomInt(this.wheel.length)];
    this.spin = result;
    if (this.spin === "Lose") {
      this.advanceTurn();
    }
    else if (this.spin === "Bankrupt") {
      this.turn.money[this.round] = 0;
      this.advanceTurn();
    }
    return result;
  }
  
  /**
   * Reduces the current player's money by the vowel price.
   * Returns the amount of vowels in the board.
   * Returns -1 if the player does not have enough money or the vowel was already guessed.
   * @param {string} vowel 
   */
  buyVowel (vowel) {
    var amount = -1;
    if (this.turn.getMoney(this.round) >= this.vowelPrice) {
      this.turn.money[this.round] -= this.vowelPrice;
      amount = this.board.verify(vowel);
    }
    if (amount < 1) {
      this.advanceTurn();
    }
    return amount;
  }

  /**
   * Returns the amount of consonants in the board.
   * @param {string} consonant 
   */
  guessConsonant (consonant) {
    var amount = this.board.verify(consonant);
    if (amount < 1) {
      this.advanceTurn();
    }
    else {
      this.turn.money[this.round] = this.turn.getMoney(this.round) + amount * this.spin;
      this.spin = null;
    }
    return amount;
  }

  /**
   * Returns -1 if wrong answer, returns amount of winnings if correct.
   * @param {string} phrase 
   */
  solve (phrase) {
    var solved = -1;
    if (phrase.trim().toLowerCase() === this.board.answer.toLowerCase()) {
      solved = true;
      for (let i = 0; i < this.players; i++) {
        if (this.players[i].user.id !== this.turn.user.id) {
          this.players[i].money[this.round] = 0;
        }
        else {
          this.players[i].money[this.round] = Math.max(this.minimumSolve, this.players[i].getMoney(this.round));
          solved = this.players[i].getMoney(this.round);
        }
      }
    }
    else {
      this.advanceTurn();
    }
    return solved;
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
    this.money = [0];
  }

  /**
   * Safely returns the money for a given round if one is supplied.
   * Safely returns the sum of all rounds if no round is supplied.
   * @param {number} round 
   */
  getMoney (round) {
    if (typeof round !== "undefined") {
      if (typeof this.money[round] === "undefined") {
        this.money[round] = 0;
      }
      return this.money[round];
    }
    return this.money.reduce((sum, val) => {
      return isNaN(val) ? sum : sum + val;
    });
  }
}

class Board {
  constructor (answer) {
    this.answer = answer.answer;
    this.answerFormatted = this.formatBoardString(this.answer);
    this.category = answer.category;
    this.numberOfWords = answer.numberOfWords;
    this.numberOfLetters = answer.numberOfLetters;
    this.state = this.answerFormatted.split("").map((value) => {
      return (value === " " || value === "\n") ? value : null;
    });
    this.lettersGuessed = new Set();
    console.log(`WOD: ${this.category}: ${this.answer}`);
  }

  /**
   * Returns whether the puzzle is solved.
   */
  get isSolved () {
    return !this.state.includes(null);
  }

  /**
   * Returns the number of occurences of a character in the answer, and updates the board state if one is found.
   * Returns -1 if the letter has already been guessed.
   * @param {string} x 
   */
  verify (x) {
    var letter = x.toLowerCase();
    if (this.lettersGuessed.has(letter)) {
      return -1;
    }
    this.lettersGuessed.add(letter);
    var amount = 0;
    for (let i = 0; i < this.answerFormatted.length; i++) {
      if (this.state[i] === null && this.answerFormatted[i] === letter) {
        amount++;
        this.state[i] = letter;
      }
    }
    return amount;
  }

  /**
   * Accepts a string and returns a formatted version with rows that are 14 columns long.
   * @param {string} str 
   */
  formatBoardString (str) {
    var wordArray = str.toLowerCase().split(" ");
    var result = "";
    var spaceOnRow = 14;
    for (var i = 0; i < wordArray.length; i++) {
      let word = wordArray[i];
      let nextWord = wordArray[i+1];
      result += word;
      spaceOnRow -= word.length;
      if (typeof nextWord !== "undefined") {
        if (spaceOnRow >= nextWord.length + 1) {
            result += ` `;
            spaceOnRow--;
        }
        else {
            result += `${" ".repeat(spaceOnRow)}\n`;
            spaceOnRow = 14;
        }
      }
      else if (spaceOnRow > 0) {
        result += `${" ".repeat(spaceOnRow)}\n`;
        spaceOnRow = 0;
      }
    }
    return result;
  }
}

module.exports = {
  Game: Game,
  Player: Player
}