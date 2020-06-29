import { Request } from "express";
import jwt from 'jsonwebtoken';
import { debug } from "console";
import LinkRequest from '../models/LinkRequest'
import Link from '../models/Link'
import { Bot } from "..";
import UserCache from "../minecraft/UserCache";

export default class UserController {

    async getLink(req: Request) {
        const { uuid, tag, username } = req.body;

        await LinkRequest.delete({ uuid });
        const request = await LinkRequest.create({ uuid, tag, username }).save();
        return request.createKey();
    }

    async getDiscord(req: Request) {
        const { uuid } = req.params;

        const link = await Link.findOne({ uuid });
        if (!link) return null;

        const user = await Bot.fetchDiscordUser(link.discordId);
        return user;
    }

    async getMinecraft(req: Request) {
        const { discordId } = req.params;

        const link = await Link.findOne({ discordId });
        if (!link) return null;

        const { uuid } = link;
        const username = UserCache.getUsername(uuid);
        return { username, uuid };
    }

}