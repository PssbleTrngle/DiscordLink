import { Request } from "express";
import ServerController from "./ServerController";
import WebSocket from "ws";
import { HttpError, Bot } from "..";
import Server from '../models/Server'
import { Message } from "discord.js";
import Link from "../models/Link";
import UserCache from "../minecraft/UserCache";

const connections = new Map<number, WebSocket>();
export interface IMessage {
    uuid?: string;
    username?: string;
    content: string;
}

export default class SocketController {

    static async sendTo(server: number | Server, msg: Message) {
        const id = typeof server === 'number' ? server : server.id;
        const ws = connections.get(id);

        const { author, content } = msg;
        const link = await Link.findOne({ discordId: author.id })
        const username = link ? await UserCache.getUsername(link.uuid) : author.username;

        const message: IMessage = { username, uuid: link?.uuid, content }

        ws?.send(JSON.stringify({ message, type: 'message' }), e => {
            if (e) throw e;
        })

        return !!ws;
    }

    async open(ws: WebSocket, req: Request) {
        const server = await ServerController.sender(req);
        if (connections.has(server.id)) throw new HttpError(400, 'Already connected');

        ws.on('open', () => {
            console.log('Server started');
            ws.pong();
            ws.send(JSON.stringify({ type: 'connected' }));
        });

        ws.on('message', data => {
            const { type, message } = JSON.parse(data.toString());
            switch (type) {
                case 'message': Bot.chatMessage(message, server);
            }
        })


        ws.on('close', (code, msg) => {
            console.log(`Server closed with ${code}: ${msg}`)
            Server.update(server.id, { running: false });
            connections.delete(server.id);
        })

        server.running = true;
        server.save();

        connections.set(server.id, ws);
    }

}