import { N8nMCPServer } from "./server.js";

const server = new N8nMCPServer();

server.run().catch((error) => {
  console.error("Critical Server Failure:", error);
  process.exit(1);
});
