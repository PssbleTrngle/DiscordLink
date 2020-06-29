import { Request } from "express";
import jwt from 'jsonwebtoken';
import Server from '../models/Server';
import { HttpError } from '../'
import { debug } from "console";

export default class ServerController {

    private async sendingServer(req: Request) {
        const key = (req.headers.authorization?.split(' ') ?? [])[1];
        const server = await Server.findOne({ key });
        if(!server) throw new HttpError(403, 'Unauthorized');
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

    async start(req: Request) {
        const server = await this.sendingServer(req);
        debug(`Server ${server.address} started`);
        server.running = true;
        await server.save();
    }

    async stop(req: Request) {
        const server = await this.sendingServer(req);
        debug(`Server ${server.address} stopped`);
        server.running = false;
        await server.save();
    }

}