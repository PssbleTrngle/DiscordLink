import { Request } from "express";
import ServerController from "./ServerController";
import WebSocket from "ws";
import { HttpError, Bot } from "..";
import Server from '../models/Server'
import { Message } from "discord.js";
import Link from "../models/Link";
import UserCache from "../minecraft/UserCache";

const connections = new Map<number, WebSocket>();

export default class SocketController {

    static async sendTo(server: number | Server, msg: Message) {
        const id = typeof server === 'number' ? server : server.id;
        const ws = connections.get(id);

        const { author, content } = msg;
        const link = await Link.findOne({ discordId: author.id })
        const username = link ? await UserCache.getUsername(link.uuid) : author.username;

        const data = { username, uuid: link?.uuid, message: content }

        ws?.send(JSON.stringify({ data, type: 'message' }), e => {
            if (e) throw e;
        })

        return !!ws;
    }

    async open(ws: WebSocket, req: Request) {
        const server = await ServerController.sender(req);
        if (connections.has(server.id)) throw new HttpError(400, 'Already connected');

        ws.on('message', data => {
            const { type } = JSON.parse(data.toString());
            console.log(type);
        })

        console.log('Server started');

        ws.on('close', code => {
            console.log(`Server closed with ${code}`)
            Server.update(server.id, { running: false });
        })

        server.running = true;
        server.save();

        connections.set(server.id, ws);
    }

}