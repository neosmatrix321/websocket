"use strict";
import { Container, inject } from 'inversify';
import "reflect-metadata";
import { SettingsWrapperSymbol, settingsWrapper } from '../settings/settingsInstance';
import { StatsWrapperSymbol, statsWrapper } from "../stats/statsInstance";

// export const MAIN_WRAPPER_TOKEN = Symbol('Main');


export const settings = new Container();
settings.bind<settingsWrapper>(SettingsWrapperSymbol).to(settingsWrapper).inSingletonScope();
export const settingsContainer = settings.get<settingsWrapper>(SettingsWrapperSymbol);

export const stats = new Container();
stats.bind<statsWrapper>(StatsWrapperSymbol).to(statsWrapper).inSingletonScope();
export const statsContainer = stats.get<statsWrapper>(StatsWrapperSymbol);


