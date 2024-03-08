"use strict";
import "reflect-metadata";
// import { Main } from "./main";
import mainApp from "./main";

async function startApplication() {
  console.log("Starting application...");
  mainApp.initialize();
}
startApplication();