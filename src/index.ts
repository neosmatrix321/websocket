"use strict";
// import "reflect-metadata";
import { Main } from "./main";
import container from "./global/containerWrapper";
const TYPES = {
  Main: Symbol.for('Main'),
};
container.bind<Main>(TYPES.Main).to(Main);

const mainApp = container.get<Main>(TYPES.Main);

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
