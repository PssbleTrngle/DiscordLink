package com.possible_triangle.discordlink

import net.fabricmc.api.DedicatedServerModInitializer
import net.fabricmc.fabric.api.command.v1.CommandRegistrationCallback
import net.fabricmc.fabric.api.event.server.ServerStartCallback
import net.fabricmc.fabric.api.event.server.ServerStopCallback

// For support join https://discord.gg/v6v4pMv

@Suppress("unused")
class DiscordLink : DedicatedServerModInitializer {

    override fun onInitializeServer() {
        SavedData.load()

        CommandRegistrationCallback.EVENT.register(CommandRegistrationCallback(DiscordCommand::register))
        ServerStartCallback.EVENT.register(ServerStartCallback(ServerApi::startServer))
        ServerStopCallback.EVENT.register(ServerStopCallback(ServerApi::stopServer))
    }
}
