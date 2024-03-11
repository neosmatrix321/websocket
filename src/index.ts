"use strict";
// import "reflect-metadata";
import { Main } from "./main";

function startApplication() {
  const mainApp = new Main();
  mainApp.initialize();
}
console.log("Starting application...");
try {
  console.log("Initialize application...");
  startApplication();
} catch (error) {
  console.error("Error starting application: ", error);
}
