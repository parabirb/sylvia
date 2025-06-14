import { Connection } from "./lib/connection.ts";

const connection = new Connection({
    host: "irc.rizon.net",
    port: 6697,
});

console.log(connection);
