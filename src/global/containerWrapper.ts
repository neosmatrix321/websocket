import "reflect-metadata";
import { Container } from "inversify";
import { Stats, STATS_WRAPPER_TOKEN } from "../stats/stats";
import { Server, SERVER_WRAPPER_TOKEN } from "../server/server";
import { Clients, CLIENTS_WRAPPER_TOKEN } from "../clients/clients";
const container = new Container();

// Self-bindings
container.bind(Clients).toSelf();
container.bind(Stats).toSelf();
container.bind(Server).toSelf();

// Symbol bindings
container.bind(CLIENTS_WRAPPER_TOKEN).to(Clients);
container.bind(STATS_WRAPPER_TOKEN).to(Stats);
container.bind(SERVER_WRAPPER_TOKEN).to(Server);

export default container;