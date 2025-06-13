import { EventEmitter } from "node:events";

export type SaslOptions = {
    username: string;
    password: string;
};

export type TlsOptions = {
    verify: boolean;
};

export type ClientOptions = {
    nick?: string;
    userName?: string;
    realName?: string;
    host: string;
    port: number;
    saslOptions?: SaslOptions;
    tlsOptions?: TlsOptions;
};

export class Client extends EventEmitter {
    nick: string;
    readonly userName: string;
    readonly realName: string;
    readonly host: string;
    readonly port: number;
    readonly saslOptions: SaslOptions | undefined;
    readonly tlsOptions: TlsOptions | undefined;
    socket: Bun.Socket | undefined;
    buffer = "";
    textDecoder = new TextDecoder();

    constructor({
        nick = "sylvia",
        userName = "sylvia",
        realName = "sylvia",
        host,
        port = 6667,
        saslOptions,
        tlsOptions,
    }: ClientOptions) {
        super();
        this.nick = nick;
        this.userName = userName;
        this.realName = realName;
        this.host = host;
        this.port = port;
        this.saslOptions = saslOptions;
        this.tlsOptions = tlsOptions;
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
                    this.emit("open")
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
                }
            },
        });
    }

    #handleData(data: Uint8Array) {
        this.buffer += this.textDecoder.decode(data).replaceAll("\r", "\n").replaceAll("\n\n", "\n");
        const lineOffset = Number(!this.buffer.endsWith("\n"));
        const splitBuffer = this.buffer.split("\n");
        if (!lineOffset) splitBuffer.pop();
        const bufferLength = splitBuffer.length;
        for (let i = 0; i < bufferLength - lineOffset; i++) {
            this.emit(
                "line",
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                splitBuffer.shift()!,
            );
        }

        this.buffer = splitBuffer.join("\n");
    }
}
