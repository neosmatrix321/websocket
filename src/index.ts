"use strict";
// import "reflect-metadata";
// import { Main } from "./main";
import { Main } from "./main";
import { Container } from "inversify";
const TYPES = {
  Main: Symbol.for('Main'),
};
// Create the container
const container = new Container();

container.bind<Main>(TYPES.Main).to(Main);

const mainApp = container.get<Main>(TYPES.Main);
export default mainApp;

function startApplication() {
  mainApp.initialize();
}
console.log("Starting application...");
try {
  console.log("Initialize application...");
  startApplication();
} catch (error) {
  console.error("Error starting application: ", error);
}
