"use strict";
import "reflect-metadata";
import { mainAPP } from "./main";

function startApplication() {
  mainAPP.start();
}
// console.log("Starting application...");
try {
  // console.log("Initialize application...");
  startApplication();
} catch (error) {
  // console.error("Error starting application: ", error);
}
