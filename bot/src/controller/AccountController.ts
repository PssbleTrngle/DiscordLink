import { Request } from "express";
import jwt from 'jsonwebtoken';
import { debug } from "console";
import LinkRequest from '../models/LinkRequest'

export default class UserController {

    async getLink(req: Request) {
        const { uuid, tag, username } = req.body;

        const request = await LinkRequest.create({ uuid, tag, username }).save();
        return request.createKey();
    }

}