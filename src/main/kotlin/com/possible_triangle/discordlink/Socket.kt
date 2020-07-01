package com.possible_triangle.discordlink

import kotlinx.serialization.Serializable
import net.minecraft.network.MessageType
import net.minecraft.server.MinecraftServer
import net.minecraft.text.LiteralText
import net.minecraft.util.Util
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import java.awt.TrayIcon
import java.lang.Exception
import java.net.URI
import java.util.*
import com.possible_triangle.discordlink.ServerApi.Companion.HOST
import com.possible_triangle.discordlink.ServerApi.Companion.JSON

class Socket(private val server: MinecraftServer) : WebSocketClient(URI("ws://${HOST}/ws/open"), mapOf(Pair("Authorization", "Token ${SavedData.getKey()}"))) {

    @Serializable
    data class Message(val username: String?, val uuid: String?, val content: String)

    @Serializable
    data class Data(val type: String, val message: Message?)

    override fun onOpen(handshake: ServerHandshake?) {
        println("Opened Connection")
    }

    override fun onClose(code: Int, reason: String?, remote: Boolean) {
        println("Connection closed with code `$code`: $reason")
    }

    fun send(message: Message) {
        val json = JSON.stringify(Data.serializer(), Data("message", message))
        this.send(json)
    }

    override fun onMessage(message: String?) {
        if(message != null) {
            val json = JSON.parse(Data.serializer(), message)
            if(json.type == "message" && json.message != null) {

                val msg = "<${json.message.username}> ${json.message.content}"
                if(json.message.uuid == null) {
                    this.server.playerManager.broadcastChatMessage(LiteralText(msg), MessageType.SYSTEM, Util.NIL_UUID)
                } else {
                    this.server.playerManager.broadcastChatMessage(LiteralText(msg), MessageType.CHAT, UUID.fromString(json.message.uuid))
                }
            }
        }
    }

    override fun onError(ex: Exception?) {
        System.err.println("Error occurred")
        ex?.printStackTrace()
    }
}