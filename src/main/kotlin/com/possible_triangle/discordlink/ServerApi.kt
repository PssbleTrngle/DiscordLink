package com.possible_triangle.discordlink

import com.google.gson.JsonSyntaxException
import javafx.scene.control.TextFormatter
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonConfiguration
import net.minecraft.server.MinecraftServer
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.ClickEvent
import net.minecraft.text.HoverEvent
import net.minecraft.text.LiteralText
import net.minecraft.text.Style
import net.minecraft.util.Formatting
import net.minecraft.world.World
import net.minecraft.world.dimension.DimensionType
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object ServerApi {

    val BASE_URL = "http://localhost:8080/api/"
    private val JSON = Json(JsonConfiguration(ignoreUnknownKeys = true))

    @Serializable
    data class LinkRequest(val uuid: String, val username: String, val tag: String)

    @Serializable
    data class ServerData(val address: String, val gametime: Long)

    @Serializable
    data class DiscordUser(val id: String, val avatar: String, val discriminator: String, val username: String, val tag: String)

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

    fun startServer(server: MinecraftServer) {

        if (SavedData.getKey() != null) {
            notifyStart()
        } else {
            val gametime = server.getWorld(World.OVERWORLD)?.time ?: 0L
            val address = server.serverIp
            val json = JSON.stringify(ServerData.serializer(), ServerData(address, gametime))
            GlobalScope.launch {
                val createdKey = post("server/create", json)
                SavedData.setKey(createdKey)
            }
        }
    }

    fun stopServer(server: MinecraftServer) {
        if (SavedData.getKey() != null) notifyStop()
    }

    fun notifyStart() {
        try {
            post("server/start")
        } catch (e: Exception) {
            System.err.println("Exception occurred trying to notify discord bot about server start")
        }
    }

    fun notifyStop() {
        try {
            post("server/stop")
        } catch (e: Exception) {
            System.err.println("Exception occurred trying to notify discord bot about server stop")
        }
    }

    fun requestDiscord(player: ServerPlayerEntity): DiscordUser? {
        val uuid = player.uuid;
        return try {
            val json = get("discord/$uuid")
            JSON.parse(DiscordUser.serializer(), json)
        } catch(e: FileNotFoundException) {
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