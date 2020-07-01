package com.possible_triangle.discordlink

import me.shedaniel.cloth.api.common.events.v1.PlayerJoinCallback
import me.shedaniel.cloth.api.common.events.v1.PlayerLeaveCallback
import net.fabricmc.api.DedicatedServerModInitializer
import net.fabricmc.fabric.api.command.v1.CommandRegistrationCallback
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents
import net.fabricmc.fabric.api.event.server.ServerStartCallback
import net.fabricmc.fabric.api.event.server.ServerStopCallback

@Suppress("unused")
class DiscordLink : DedicatedServerModInitializer {

    override fun onInitializeServer() {
        SavedData.load()

        CommandRegistrationCallback.EVENT.register(CommandRegistrationCallback(DiscordCommand::register))
        ServerStartCallback.EVENT.register(ServerStartCallback{ s -> ServerApi.get(s).startServer() })
        ServerStopCallback.EVENT.register(ServerStopCallback { s -> ServerApi.get(s).stopServer() })

        PlayerJoinCallback.EVENT.register(PlayerJoinCallback { _, p -> ServerApi.get(p.server).playerJoined(p) })
        PlayerLeaveCallback.EVENT.register(PlayerLeaveCallback { p -> ServerApi.get(p.server).playerLeft(p)})

    }
}
