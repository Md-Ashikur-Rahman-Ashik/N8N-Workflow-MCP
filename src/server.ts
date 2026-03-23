import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleN8nIntent } from "./n8nHandler.js";
import { WORKFLOW_MAP } from "./workflowRegistry.js";

export class N8nMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "n8n-bridge-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 1. Tell the AI what tools are available (The "Map")
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "trigger_automation",
          description:
            "Triggers an n8n workflow based on a plain English intent.",
          inputSchema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                description: `The user's goal. Supported intents: ${WORKFLOW_MAP.map((w) => w.intent).join(", ")}`,
              },
              data: {
                type: "object",
                description:
                  "Structured data extracted from the conversation (e.g., client name, email).",
              },
            },
            required: ["intent"],
          },
        },
      ],
    }));

    // 2. Handle the actual execution (The "Bridge")
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "trigger_automation") {
        const { intent, data } = request.params.arguments as {
          intent: string;
          data: any;
        };

        try {
          // We delegate the actual work to our Handler
          const result = await handleN8nIntent(intent, data || {});
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("n8n MCP Server running on stdio");
  }
}
