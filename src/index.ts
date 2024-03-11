"use strict";
import "reflect-metadata";
import { Main, STATS_WRAPPER_TOKEN, SERVER_WRAPPER_TOKEN, CLIENTS_WRAPPER_TOKEN } from './main';
import { Container } from 'inversify';
import { Stats } from './stats/stats';
import { Server } from './server/server';
import { Clients } from './clients/clients';
// export const MAIN_WRAPPER_TOKEN = Symbol('Main');

const container = new Container();
container.bind<Main>(Main).toSelf().inSingletonScope();
container.bind<Stats>(STATS_WRAPPER_TOKEN).to(Stats);
container.bind<Clients>(CLIENTS_WRAPPER_TOKEN).to(Clients);
container.bind<Server>(SERVER_WRAPPER_TOKEN).to(Server);

// Get an instance of Main
const main = container.get<Main>(Main);
function startApplication() {
  main.initialize();
}
console.log("Starting application...");
try {
  console.log("Initialize application...");
  startApplication();
} catch (error) {
  console.error("Error starting application: ", error);
}
