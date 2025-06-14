// This TS file handles CTCPs.
// sorry eslint, i gotta do this
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { UnknownCommand } from "./commands.ts";

export const ctcps = ["VERSION", "TIME", "PING", "DCC"] as const;

export type CtcpMessage = {
    origin: string;
    target: string;
    command: (typeof ctcps)[number];
    arguments: string;
    request: boolean;
};

export type OutgoingCtcp = {
    command: (typeof ctcps)[number];
    arguments: string;
};

export function parseCtcp(command: UnknownCommand): CtcpMessage | false {
    let request;
    if (command.origin && command.command === "NOTICE") request = false;
    else if (command.origin && command.command === "PRIVMSG") request = true;
    else return false;

    // We're just gonna trust the server for now and assume the PRIVMSG and NOTICE commands work
    let args =
        command.arguments.length === 2
            ? command.arguments[1]!.split(" ")
            : command.arguments.slice(1);
    const target = command.arguments[0]!;
    const ctcp = args[0]!.replaceAll("\u0001", "");
    if (!ctcps.includes(ctcp as (typeof ctcps)[number])) return false;

    if (args[0]!.startsWith("\u0001") && args.at(-1)!.endsWith("\u0001")) {
        args = args.slice(1);
        const lastArg = args.at(-1);
        if (lastArg) {
            args[args.length - 1] = lastArg.replace("\u0001", "");
        }
    } else return false;

    return {
        origin: command.origin,
        request,
        command: ctcp as (typeof ctcps)[number],
        arguments: args.join(" "),
        target,
    };
}

export function ctcpToString(ctcp: OutgoingCtcp): string {
    return `\u0001${ctcp.command}${ctcp.arguments ? " " + ctcp.arguments : ""}\u0001`;
}
