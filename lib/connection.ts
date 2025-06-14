/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*
    I do a lot of non-null assertions in here where I *know*
    that the value of a statement will never be null. Unfortunately,
    the linter doesn't know this. Thus, the rule is disabled for
    the whole file.
*/
// Deps
import { EventEmitter } from "node:events";
import { Numeric, commands } from "./commands.ts";

export type TlsOptions = {
    verify: boolean;
};

export type ConnectionOptions = {
    host: string;
    port: number;
    tlsOptions?: TlsOptions;
};

export class Connection extends EventEmitter {
    readonly host: string;
    readonly port: number;
    readonly tlsOptions: TlsOptions | undefined;
    socket: Bun.Socket | undefined;
    buffer = "";
    textDecoder = new TextDecoder();

    constructor({ host, port = 6667, tlsOptions }: ConnectionOptions) {
        super();
        this.host = host;
        this.port = port;
        this.tlsOptions = tlsOptions;
    }

    handleLine(line: string) {
        // First, check if the line starts with a colon. If it doesn't, we need to return
        if (!line.startsWith(":")) {
            this.emit("unknownLine", line);
            return;
        }

        // Now let's start parsing
        const splitLine = line.split(" ");
        // Really weird, but let's just return
        if (splitLine.length < 2) {
            return;
        }

        const origin = splitLine[0]!.replace(":", "") || null;
        const args = [];
        let multiFlag = false;

        for (let i = 2; i < splitLine.length; i++) {
            if (!multiFlag && splitLine[i]!.startsWith(":")) {
                multiFlag = true;
                args.push(splitLine[i]!.replace(":", ""));
            } else if (multiFlag) args[args.length - 1] += " " + splitLine[i]!;
            else args.push(splitLine[i]);
        }

        if (Object.values(Numeric).includes(splitLine[1]! as Numeric)) {
            this.emit("numericCommand", {
                command: splitLine[1],
                origin,
                arguments: args,
            });
        } else if (splitLine[1]! in commands) {
            this.emit("command", {
                command: splitLine[1],
                origin,
                arguments: args,
            });
        } else {
            this.emit("unknownCommand", {
                command: splitLine[1],
                origin,
                arguments: args,
            });
        }
    }

    async connect() {
        const tls = this.tlsOptions
            ? {
                  rejectUnauthorized: this.tlsOptions.verify,
              }
            : false;
        this.socket = await Bun.connect({
            hostname: this.host,
            port: this.port,
            tls,
            socket: {
                data: (_, data) => {
                    this.#handleData(data);
                },
                open: () => {
                    this.emit("open");
                },
                end: () => {
                    this.emit("end");
                },
                close: () => {
                    this.emit("close");
                },
                error: (_, error) => {
                    this.emit("error", error);
                },
                connectError: (_, error) => {
                    this.emit("connectError", error);
                },
                timeout: () => {
                    this.emit("timeout");
                },
            },
        });
        this.on("line", (line: string) => {
            this.handleLine(line);
        });
    }

    sendRaw(command: string[]) {
        if (!this.socket) return;
        const commandParts = [];
        for (const part of command) {
            if (part.includes(" ") || part.includes(":")) {
                commandParts.push(":" + part);
            } else commandParts.push(part);
        }

        this.socket.write(commandParts.join(" ") + "\r\n");
    }

    #handleData(data: Uint8Array) {
        this.buffer += this.textDecoder
            .decode(data)
            .replaceAll("\r", "\n")
            .replaceAll("\n\n", "\n");
        const lineOffset = Number(!this.buffer.endsWith("\n"));
        const splitBuffer = this.buffer.split("\n");
        if (!lineOffset) splitBuffer.pop();
        const bufferLength = splitBuffer.length;
        for (let i = 0; i < bufferLength - lineOffset; i++) {
            this.emit("line", splitBuffer.shift()!);
        }

        this.buffer = splitBuffer.length === 1 ? splitBuffer[0]! : "";
    }
}
