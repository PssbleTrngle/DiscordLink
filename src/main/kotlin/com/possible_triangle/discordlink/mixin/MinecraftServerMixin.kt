package com.possible_triangle.discordlink.mixin

import com.possible_triangle.discordlink.ServerApi
import net.minecraft.server.MinecraftServer
import net.minecraft.text.Text
import org.spongepowered.asm.mixin.Mixin
import org.spongepowered.asm.mixin.injection.At
import org.spongepowered.asm.mixin.injection.Inject
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo
import java.util.*

@Mixin(MinecraftServer::class)
class MinecraftServerMixin {

    var last: String? = null;

    @Inject(at = [At("RETURN")], method = ["sendSystemMessage"])
    fun onMessage(text: Text, sender: UUID?, callback: CallbackInfo?) {
        if (text.toString() == last) {
            last = null
        } else {
            last = text.toString()
            ServerApi.get(this as MinecraftServer).handleMessage(text.copy(), sender)
        }
    }

}