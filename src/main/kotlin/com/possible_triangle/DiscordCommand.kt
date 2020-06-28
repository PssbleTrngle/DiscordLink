package com.possible_triangle

import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.arguments.StringArgumentType
import com.mojang.brigadier.context.CommandContext
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource

fun register(dispatcher: CommandDispatcher<ServerCommandSource>) {
    dispatcher.register(
        CommandManager.literal("discord")
            .then(
                CommandManager.literal("link").then(CommandManager.argument("tag", StringArgumentType.word())
                    .executes { ctx -> link(ctx) })
            )
    )
}

private fun link(ctx: CommandContext<ServerCommandSource>): Int {

    val tag = StringArgumentType.getString(ctx, "tag");
    ServerApi.requestLink(ctx.source.player, tag);

    return 1
}