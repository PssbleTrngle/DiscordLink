package com.possible_triangle

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.*

object SavedData {

    @Serializable
    data class Saved(var key: String?)

    private val FILE = File("discord-link.json")
    private var DATA: Saved = Saved(null)

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
        DATA = Json.parse(Saved.serializer(), json)
    }

    fun save() {
        if (!FILE.exists()) FILE.createNewFile()
        val writer = BufferedWriter(FileWriter(FILE))
        val json = Json.stringify(Saved.serializer(), DATA)
        writer.write(json)
    }

}