package com.possible_triangle.discordlink

import com.google.gson.JsonSyntaxException
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonConfiguration
import net.minecraft.client.resource.language.I18n
import net.minecraft.server.MinecraftServer
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.*
import net.minecraft.util.Formatting
import net.minecraft.world.World
import org.java_websocket.WebSocket
import org.java_websocket.client.WebSocketClient
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.*
import java.util.function.Function

class ServerApi(private val server: MinecraftServer) {

    companion object {

        private val map = hashMapOf<MinecraftServer,ServerApi>();

        fun get(server: MinecraftServer): ServerApi {
            return map.computeIfAbsent(server) { s -> ServerApi(s) }
        }

        val HOST = "localhost:8080"
        val BASE_URL = "http://$HOST/api/"
        val JSON = Json(JsonConfiguration(ignoreUnknownKeys = true))
    }

    val ws = Socket(this.server);

    @Serializable
    data class LinkRequest(val uuid: String, val username: String, val tag: String)

    @Serializable
    data class ServerData(val address: String, val gametime: Long)

    @Serializable
    data class DiscordUser(
        val id: String,
        val avatar: String,
        val discriminator: String,
        val username: String,
        val tag: String
    )

    fun requestServerLink(discordId: String) {
        GlobalScope.launch {
            post("server/link", "{\"discordId\":\"$discordId\"}")
        }
    }

    fun requestLink(player: ServerPlayerEntity, tag: String) {
        val uuid = player.uuid.toString();
        val username = player.name.asString()
        val json = JSON.stringify(
            LinkRequest.serializer(),
            LinkRequest(uuid, username, tag)
        )

        GlobalScope.launch {
            val key = post("link", json)

            val copy = Style.EMPTY
                .setHoverEvent(HoverEvent(HoverEvent.Action.SHOW_TEXT, LiteralText("Click to copy key")))
                .withClickEvent(ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, key))
                .withColor(Formatting.GOLD)
            player.sendMessage(
                LiteralText("You key is ").setStyle(Style.EMPTY.withColor(Formatting.AQUA))
                    .append(LiteralText("${key.substring(0, 20)}...").setStyle(copy)),
                false
            )
        }

    }

    fun startServer() {

        if (SavedData.getKey() != null) {
            openConnection()
        } else {
            val gametime = server.getWorld(World.OVERWORLD)?.time ?: 0L
            val address = server.serverIp
            val json = JSON.stringify(ServerData.serializer(), ServerData(address, gametime))
            GlobalScope.launch {
                val createdKey = post("server/create", json)
                SavedData.setKey(createdKey)
                openConnection()
            }
        }
    }

    fun stopServer() {
        ws.close(1000, "Server closed")
    }

    private fun openConnection() {
        ws.connect()
    }

    fun reconnect(): Boolean {
        if (ws.isOpen) return true;
        ws.connect()
        return false;
    }

    fun getContent(text: Text): String? {
        if(text is LiteralText) return text.rawString
        if(text is TranslatableText) return text.string
        return text.string
    }

    fun handleMessage(text: Text, uuid: UUID?) {
        val content = getContent(text)
        val username = if(uuid != null) server.userCache.getByUuid(uuid)?.name else null
        if(content != null) ws.send(Socket.Message(username, uuid?.toString(), content))
    }

    fun playerJoined(player: ServerPlayerEntity) {
        GlobalScope.launch {
            post("server/joined", "{\"uuid\":\"${player.uuid}\"}")
        }
    }

    fun playerLeft(player: ServerPlayerEntity) {
        GlobalScope.launch {
            post("server/left", "{\"uuid\":\"${player.uuid}\"}")
        }
    }

    fun requestDiscord(player: ServerPlayerEntity): DiscordUser? {
        val uuid = player.uuid;
        return try {
            val json = get("discord/$uuid")
            JSON.parse(DiscordUser.serializer(), json)
        } catch (e: FileNotFoundException) {
            null
        } catch (e: JsonSyntaxException) {
            null
        }
    }

    private fun get(endpoint: String): String {
        val url = URL(BASE_URL + endpoint)
        with(url.openConnection() as HttpURLConnection) {
            requestMethod = "GET"

            val key = SavedData.getKey()
            if (key != null) setRequestProperty("Authorization", "Token $key")

            println("Response Code : $responseCode")

            val response = StringBuffer()
            BufferedReader(InputStreamReader(inputStream)).use {

                var inputLine = it.readLine()
                while (inputLine != null) {
                    response.append(inputLine)
                    inputLine = it.readLine()
                }

            }

            return response.toString()
        }
    }

    private fun post(endpoint: String, body: String? = null): String {
        val url = URL(BASE_URL + endpoint)
        with(url.openConnection() as HttpURLConnection) {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")

            val key = SavedData.getKey()
            if (key != null) setRequestProperty("Authorization", "Token $key")

            if (body != null) {
                doOutput = true
                val wr = OutputStreamWriter(outputStream);
                wr.write(body);
                wr.flush();
            }

            println("Response Code : $responseCode")

            val response = StringBuffer()
            BufferedReader(InputStreamReader(inputStream)).use {

                var inputLine = it.readLine()
                while (inputLine != null) {
                    response.append(inputLine)
                    inputLine = it.readLine()
                }

            }

            return response.toString()
        }
    }

}