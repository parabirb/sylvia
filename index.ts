import { Client } from "./lib/client.ts";

const client = new Client({
    host: "irc.rizon.net",
    port: 6697
});

console.log(client);