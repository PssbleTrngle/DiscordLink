package com.possible_triangle

import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.*
import kotlinx.serialization.json.Json
import net.minecraft.server.MinecraftServer
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.ClickEvent
import net.minecraft.text.LiteralText
import net.minecraft.text.Style
import net.minecraft.world.dimension.DimensionType
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.xml.bind.JAXBElement

object ServerApi {

    val BASE_URL = "http://localhost:8080/api/"

    @Serializable
    data class LinkRequest(val uuid: String, val username: String, val tag: String)

    @Serializable
    data class ServerData(val address: String, val gametime: Long)

    fun requestLink(player: ServerPlayerEntity, tag: String) {
        val uuid = player.uuid.toString();
        val username = player.name.asString()
        val json = Json.stringify(LinkRequest.serializer(), LinkRequest(uuid, username, tag))

        GlobalScope.launch {
            val key = post("link", json)
            val copy = Style().setClickEvent(ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, key))
            player.sendMessage(LiteralText("You key is ").append(LiteralText(key).setStyle(copy)))
        }

    }

    fun startServer(server: MinecraftServer) {

        if(SavedData.getKey() != null) {
            notifyStart()
        } else {
            val gametime = server.getWorld(DimensionType.OVERWORLD).time
            val address = server.serverIp
            val json = Json.stringify(ServerData.serializer(), ServerData(address, gametime))
            val createdKey = post("server/create", json)
            SavedData.setKey(createdKey)
        }
    }

    fun stopServer(server: MinecraftServer) {
        if(SavedData.getKey() != null) notifyStop()
    }

    fun notifyStart() {
        post("server/start")
    }

    fun notifyStop() {
        post("server/stop")
    }

    fun requestDiscord(player: ServerPlayerEntity): String {
        val uuid = player.uuid;
        return get("discord/$uuid")
    }

    private fun get(endpoint: String): String {
        val url = URL(BASE_URL + endpoint)
        with(url.openConnection() as HttpURLConnection) {
            requestMethod = "GET"

            val key = SavedData.getKey()
            if(key != null) setRequestProperty("Authorization", "Token $key")

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
            if(key != null) setRequestProperty("Authorization", "Token $key")

            if(body != null) {
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