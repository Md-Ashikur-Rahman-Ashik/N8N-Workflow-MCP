import { WORKFLOW_MAP } from './workflowRegistry.js';

interface Workflow {
  intent: string;
  workflowId: string;
  description: string;
  requiredFields: string[];
}

// FIX: Update the function to accept THREE arguments: intent, payload, and config
export async function handleN8nIntent(
  userIntent: string, 
  payload: Record<string, any>, 
  config: { apiKey: string; baseUrl: string } // The 3rd argument
) {
  
  // 1. Logic Check: Find the intent
  const target = (WORKFLOW_MAP as Workflow[]).find((w: Workflow) =>
    userIntent.toLowerCase().includes(w.intent.toLowerCase())
  );

  if (!target) {
    throw new Error(`Intent '${userIntent}' not recognized.`);
  }

  // 2. Validation: Check for required fields
  const missingFields = target.requiredFields.filter((f: string) => !payload[f]);
  if (missingFields.length > 0) {
    return { 
      status: "error", 
      message: `I need more information: ${missingFields.join(", ")}` 
    };
  }

  // 3. Execution: Use the 'config' passed from the server session
  try {
    // Logic Verification: Ensure the URL is clean
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/webhook/${target.workflowId}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-N8N-API-KEY": config.apiKey // Using the key from the 3rd argument
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("n8n Execution Error:", error);
    throw new Error(`Automation failed: ${error.message}`);
  }
}