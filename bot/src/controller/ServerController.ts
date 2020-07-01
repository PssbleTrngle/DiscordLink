import { debug } from "console";
import { Request } from "express";
import jwt from 'jsonwebtoken';
import { HttpError, Bot } from '../';
import Link from "../models/Link";
import Server from '../models/Server';
import ServerLinkRequest from "../models/ServerLinkRequest";

export default class ServerController {

    static async sender(req: Request) {
        const key = (req.headers.authorization?.split(' ') ?? [])[1];
        const server = await Server.findOne({ key });
        if (!server) throw new HttpError(403, 'Unauthorized');
        return server;
    }

    async create(req: Request) {
        const { address, gametime } = req.body;

        const { JWT_SECRET } = process.env;
        if (!JWT_SECRET) throw new Error('No JWT Secret defined, contact admin');

        const date = new Date().getTime;
        const key = jwt.sign({ address, date, gametime }, JWT_SECRET);
        await Server.create({ address, key, running: true }).save();
        return key;
    }

    async link(req: Request) {
        const server = await ServerController.sender(req);
        const { discordId } = req.body;

        const ownerId = await Bot.sendServerLinkRequest(discordId, server);
        if (ownerId) await ServerLinkRequest.create({ discordId, server, ownerId }).save();
        return true;

    }

    async joined(req: Request) {
        const server = await ServerController.sender(req);
        const { uuid } = req.body;
        const link = await Link.findOne({ uuid });

        if (link && server.discordId) Bot.joined(link.discordId, server.discordId);
        return true;
    }

    async left(req: Request) {
        const server = await ServerController.sender(req);
        const { uuid } = req.body;
        const link = await Link.findOne({ uuid });

        if (link && server.discordId) Bot.left(link.discordId, server.discordId);
        return true;
    }

    async start(req: Request) {
        //const server = await ServerController.sender(req);
        //debug(`Server ${server.address} started`);
        //server.running = true;
        //await server.save();
        return true;
    }

    async stop(req: Request) {
        //const server = await ServerController.sender(req);
        //debug(`Server ${server.address} stopped`);
        //server.running = false;
        //await server.save();
        return true;
    }

}