// Unless explicitly defined, set NODE_ENV as development:
import 'dotenv/config';
import 'reflect-metadata';
import '@sapphire/plugin-api/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-subcommands/register';
import * as colorette from 'colorette';
import { inspect } from 'util';
import { configSchema } from './schema';
import fs from 'node:fs';

const configData = fs.readFileSync('./config/config.json', 'utf-8');

// Validate config
export const CONFIG = configSchema.parse(JSON.parse(configData));

console.log(
	'\r\n\u256D\u2500\u2500\u2500\u2500\u2500\u256E \r\n\u2502 \u25E0 \u25E1 \u25E0  Hi, I am guardian and I like turtles\r\n\u2570\u2500\u2500\u2500\u2500\u2500\u256F'
);

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
colorette.createColors({ useColor: true });
