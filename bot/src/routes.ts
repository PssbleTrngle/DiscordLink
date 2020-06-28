import AccountController from './controller/AccountController';

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
    }
];