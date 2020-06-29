package com.possible_triangle.discordlink

import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.arguments.StringArgumentType
import com.mojang.brigadier.context.CommandContext
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import net.minecraft.command.arguments.EntityArgumentType
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.LiteralText

object DiscordCommand {

    fun register(dispatcher: CommandDispatcher<ServerCommandSource>, dedicated: Boolean) {
        dispatcher.register(
            CommandManager.literal("discord")
                .then(
                    CommandManager.literal("link").then(CommandManager.argument("tag", StringArgumentType.word())
                        .executes(DiscordCommand::link))
                ).then(
                    CommandManager.literal("get").then(CommandManager.argument("player", EntityArgumentType.player())
                        .executes(DiscordCommand::fetchDiscord))
                )
        )
    }

    private fun link(ctx: CommandContext<ServerCommandSource>): Int {

        val tag = StringArgumentType.getString(ctx, "tag")
        ServerApi.requestLink(ctx.source.player, tag)

        return 1
    }

    private fun fetchDiscord(ctx: CommandContext<ServerCommandSource>): Int {

        val player = EntityArgumentType.getPlayer(ctx, "player");
        GlobalScope.launch {
            val discord = ServerApi.requestDiscord(player)
            ctx.source.sendFeedback(LiteralText(discord), false)
        }

        return 1
    }
}