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