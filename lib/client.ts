import { EventEmitter } from "node:events";
// Awoo import { Connection } from "./connection.ts";
import type { ConnectionOptions } from "./connection.ts";
/*
Awoo

import {
    Numeric,
    commands,
    UnknownCommand,
    NumericCommand,
    Command,
} from "./commands.ts";
import { CtcpMessage, parseCtcp, ctcpToString } from "./ctcp.ts";
*/

export type SaslOptions = {
    username: string,
    password: string
};

export type ClientConnectionOptions = ConnectionOptions & {
    username: string,
    realname: string,
    saslOptions?: SaslOptions
};

export class Client extends EventEmitter {

};

console.log("In progress");
