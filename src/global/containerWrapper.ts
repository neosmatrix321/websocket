import 'reflect-metadata';
import { Container } from 'inversify';
import { Main } from '../main';
import { Stats } from '../stats/stats';
import { Server } from '../server/server';
import { Clients } from '../clients/clients';
const TYPES = {
    Stats: Symbol('Stats'),
    Server: Symbol('Server'),
    Clients: Symbol('Clients'),
    Main: Symbol('Main')
};
const container = new Container();
container.bind<Stats>(TYPES.Stats).toSelf();
container.bind<Server>(TYPES.Server).toSelf();
container.bind<Clients>(TYPES.Clients).toSelf();

export { container, TYPES };