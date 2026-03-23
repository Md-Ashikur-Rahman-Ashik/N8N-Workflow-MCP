import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";

import { handleN8nIntent } from "./n8nHandler.js";

export class N8nMCPServer {
  private server: Server;
  // State to hold user credentials in memory for the session
  private userConfig = { apiKey: "", baseUrl: "" };

  constructor() {
    this.server = new Server(
      { name: "n8n-bridge-server", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "setup_n8n",
          description: "Connect your n8n instance by providing the URL and API Key.",
          inputSchema: {
            type: "object",
            properties: {
              apiKey: { type: "string" },
              baseUrl: { type: "string", description: "e.g., https://n8n.yourdomain.com" }
            },
            required: ["apiKey", "baseUrl"]
          }
        },
        {
          name: "trigger_automation",
          description: "Runs an n8n workflow based on a plain English goal.",
          inputSchema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              data: { type: "object" }
            },
            required: ["intent"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      if (name === "setup_n8n") {
        const { apiKey, baseUrl } = args as { apiKey: string; baseUrl: string };
        this.userConfig = { apiKey, baseUrl };
        return { content: [{ type: "text", text: "n8n Connection Successful!" }] };
      }

      if (name === "trigger_automation") {
        // FIX: Handle "Object is possibly undefined" with a Logic Guard
        if (!args || !args.intent) {
          throw new Error("Intent is required to trigger automation.");
        }

        if (!this.userConfig.apiKey) {
          throw new Error("Please run 'setup_n8n' first to provide your credentials.");
        }

        try {
          // Pass the in-memory config to the handler
          const result = await handleN8nIntent(
            args.intent as string, 
            (args.data as object) || {}, 
            this.userConfig
          );
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (error: any) {
          return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}