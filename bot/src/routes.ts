import AccountController from './controller/AccountController';
import ServerController from './controller/ServerController';
import SocketController from './controller/SocketController';

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
        route: '/api/minecraft/:discordId'
    },
    {
        action: 'getDiscord',
        controller: AccountController,
        method: 'get',
        route: '/api/discord/:uuid'
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
    },
    {
        action: 'joined',
        controller: ServerController,
        method: 'post',
        route: '/api/server/joined'
    },
    {
        action: 'left',
        controller: ServerController,
        method: 'post',
        route: '/api/server/left'
    },
    {
        action: 'link',
        controller: ServerController,
        method: 'post',
        route: '/api/server/link'
    },
    {
        action: 'open',
        controller: SocketController,
        method: 'ws',
        route: '/ws/open',
    }
];