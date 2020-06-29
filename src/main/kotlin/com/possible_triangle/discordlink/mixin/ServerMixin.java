package com.possible_triangle.discordlink.mixin;

import me.shedaniel.cloth.api.common.events.v1.PlayerJoinCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayNetworkHandler;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;

@Mixin(MinecraftServer.class)
public class ServerMixin {


}
