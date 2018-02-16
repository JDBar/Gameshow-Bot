# Gameshow-Bot
## About
Gameshow-Bot is a Node.js-based Discord bot that hosts chat-based games. It includes a Wheel of Fortune inspired word game called "Wheel of Discord", and provides a framework for additional games to be created.

## Installation
Gameshow-Bot was developed for **Node.js 9.5.0**. Older versions of Node.js may not be compatible.

### Games
Additional game scripts can be installed by placing them into the `games` folder.

## Commands
### gs!games
> Displays a list of installed games.

### gs!help [game] [command]
> Displays the documentation for a given game or command.

> Example: `gs!help wheel-of-discord`

## Dependencies
* **[discord.js](https://github.com/discordjs/discord.js)** for Discord integration.
* **[fs-extra](https://github.com/jprichardson/node-fs-extra)** for extended asynchronous file system functionality.
