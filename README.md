# Discord Link
![Build Discord Bot](https://github.com/PssbleTrngle/DiscordLink/workflows/Build%20Discord%20Bot/badge.svg)

This mod communicates with my own Discord Bot and enables players to link their minecraft account with their discord account globally.
The bot is written in typescript and can be found in the `bot` folder. 
Communication between the bot and the mod is done using HTTP requests.

## Features

#### Link Minecraft & Discord accounts
Player get the ability to use the command `/discord link User#1234`, where the last parameter is their User tag. They receive a generated key they can copy and after sending this key to the Discord Bots private messages, their accounts are successfully linked.

This link is avaiable on every minecraft server they join which uses this mod and every discord server that has added the bot

#### Link Minecraft & Discord servers
Furthermore, server owners get the ability to link their discord server to their minecraft server, using the command `/discord server link 103954892401`, where the last argument is their discord servers ID. They executing player is required to have their discord and minecraft accounts linked for this.

If the bot has been added to the discord server, they will receive a direct message from the bot, which they can decline or accept.

By linking their servers, admins get possiblities like granting players specific roles for joining, being online or completing advancements
