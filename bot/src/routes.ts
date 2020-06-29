import AccountController from './controller/AccountController';
import ServerController from './controller/ServerController';

interface IRoute {
    method: string;
    route: string;
    controller: any;
    action: string;
}

export const Routes: IRoute[] = [
    {
        action: 'getLink',
        controller: AccountController,
        method: 'post',
        route: '/api/link'
    },
    {
        action: 'getMinecraft',
        controller: AccountController,
        method: 'get',
        route: '/api/minecraft/:uuid'
    },
    {
        action: 'getDiscord',
        controller: AccountController,
        method: 'get',
        route: '/api/discord/:discordId'
    },
    {
        action: 'create',
        controller: ServerController,
        method: 'post',
        route: '/api/server/create'
    },
    {
        action: 'start',
        controller: ServerController,
        method: 'post',
        route: '/api/server/start'
    },
    {
        action: 'stop',
        controller: ServerController,
        method: 'post',
        route: '/api/server/stop'
    }
];