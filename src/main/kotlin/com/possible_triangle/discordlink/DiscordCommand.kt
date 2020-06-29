package com.possible_triangle.discordlink

import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.arguments.StringArgumentType
import com.mojang.brigadier.context.CommandContext
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import net.minecraft.command.arguments.EntityArgumentType
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.*
import net.minecraft.util.Formatting

object DiscordCommand {

    fun register(dispatcher: CommandDispatcher<ServerCommandSource>, dedicated: Boolean) {
        dispatcher.register(
            CommandManager.literal("discord")
                .then(
                    CommandManager.literal("link").then(CommandManager.argument("tag", StringArgumentType.greedyString())
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

            if (discord != null) {
                val copy = Style.EMPTY.withColor(Formatting.GOLD)
                    .setHoverEvent(HoverEvent(HoverEvent.Action.SHOW_TEXT, LiteralText("Click to copy tag")))
                    .withClickEvent(ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, discord.tag))
                ctx.source.sendFeedback(LiteralText("").append(player.displayName).append(LiteralText("'s Discord is ").append(LiteralText(discord.tag).setStyle(copy))), false)
            } else ctx.source.sendFeedback(LiteralText("The player ").append(player.displayName).append(LiteralText(" has not connected a discord account")), false)
        }

        return 1
    }
}