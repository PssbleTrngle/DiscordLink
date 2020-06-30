package com.possible_triangle.discordlink

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonConfiguration
import kotlinx.serialization.json.JsonException
import java.io.*

object SavedData {

    private val JSON = Json(JsonConfiguration(ignoreUnknownKeys = true, prettyPrint = true))

    @Serializable
    data class Saved(var key: String?)

    private val FILE = File("discord-link.json")
    private var DATA: Saved =
        Saved(null)

    fun getKey(): String? {
        return DATA.key
    }

    fun setKey(key: String) {
        DATA.key = key
        save()
    }

    fun load() {
        if (!FILE.exists()) save()

        val reader = BufferedReader(FileReader(FILE))
        val json = reader.readText()
        reader.close()

        try {
            DATA = JSON.parse(Saved.serializer(), json)
        } catch (e: JsonException) {
            System.err.println("Error parsing data file at '${FILE.path}'")
            save()
        }
    }

    fun save() {
        if (!FILE.exists()) FILE.createNewFile()
        val writer = BufferedWriter(FileWriter(FILE))
        val json = JSON.stringify(Saved.serializer(), DATA)
        writer.write(json)
        writer.close()
    }

}