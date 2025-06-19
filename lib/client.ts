import { EventEmitter } from "node:events";
import { Connection } from "./connection.ts";
import type { ConnectionOptions } from "./connection.ts";
import {
    Numeric,
    commands,
    UnknownCommand,
    NumericCommand,
    Command,
} from "./commands.ts";
import type { CtcpMessage } from "./ctcp.ts";
import { parseCtcp, ctcpToString } from "./ctcp.ts";

export type SaslOptions = {
    username: string;
    password: string;
};

export type ClientConnectionOptions = ConnectionOptions & {
    nickname: string;
    username: string;
    realname: string;
    saslOptions?: SaslOptions;
    version: string;
    timeout?: number;
    reconnect?: boolean;
};

// WHOX support needs to be added later
export type WhoUser = {
    channel?: string;
    username: string;
    host: string;
    server: string;
    nick: string;
    away: boolean;
    operator?: boolean;
    registered?: boolean;
    prefix?: string;
};

export type WhoisChannel = {
    channel: string;
    prefix?: string;
};

export type WhoisReply = {
    nick: string;
    certFingerprint?: string;
    registered?: string;
    username?: string;
    host?: string;
    realname?: string;
    server?: string;
    operator?: string;
    idle?: string;
    channels?: WhoisChannel[];
    special?: string[];
    account?: string;
    actually?: string;
    connectingFrom?: string;
    modes?: string;
    secure?: string;
};

export type ListEntry = {
    channel: string;
    users: number;
    topic?: string;
};

export type Name = {
    nick: string;
    prefix?: string;
};

export type NameReply = {
    channel: string;
    names: Name[];
};

export type Link = {
    main: string;
    secondary: string;
    hopcount: number;
    info: string;
};

export type ClientConnection = {
    connection?: Connection;
    options: ClientConnectionOptions;
    pingTimeout?: NodeJS.Timeout;
    pendingWho?: WhoUser[];
    pendingList?: ListEntry[];
    pendingWhois?: Map<string, WhoisReply>;
    pendingWhowas?: Map<string, WhoisReply[]>;
    pendingNames?: Map<string, NameReply[]>;
    pendingMonitor?: string[];
};

export class Client extends EventEmitter {
    readonly connectionMap: Map<string, ClientConnection>;

    constructor(options: ClientConnectionOptions[]) {
        super();
        this.connectionMap = new Map();
        for (const option of options) {
            this.connectionMap.set(option.host, {
                options: option,
            });
        }
    }

    disconnect(key: string) {
        const clientConnection = this.connectionMap.get(key);
        if (!clientConnection) throw new Error("Connection not in map.");
        else if (clientConnection.connection) {
            clientConnection.connection.sendRaw(["QUIT"]);
            clientConnection.connection.socket?.end();
            clientConnection.connection.removeAllListeners();
        }

        delete clientConnection.connection;
        this.connectionMap.set(key, clientConnection);
    }

    connect(key: string) {
        const clientConnection = this.connectionMap.get(key);
        if (!clientConnection) throw new Error("Connection not in map.");
        else if (clientConnection.connection) this.disconnect(key);

        clientConnection.connection = new Connection({
            host: clientConnection.options.host,
            port: clientConnection.options.port,
            tlsOptions: clientConnection.options.tlsOptions,
        });
    }

    add(options: ClientConnectionOptions) {}
}
