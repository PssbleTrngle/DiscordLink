package com.possible_triangle

import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.*
import kotlinx.serialization.json.Json
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.ClickEvent
import net.minecraft.text.LiteralText
import net.minecraft.text.Style
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

    private fun post(endpoint: String, body: String): String {
        val url = URL(BASE_URL + endpoint)
        with(url.openConnection() as HttpURLConnection) {

            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")

            val wr = OutputStreamWriter(outputStream);
            wr.write(body);
            wr.flush();

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