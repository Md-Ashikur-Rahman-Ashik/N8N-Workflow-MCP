import { WORKFLOW_MAP } from './workflowRegistry.js';

export async function handleN8nIntent(userIntent: string, payload: any) {
  // 1. Normalize the intent (Plain English to internal ID)
  const target = WORKFLOW_MAP.find(w => 
    userIntent.toLowerCase().includes(w.intent)
  );

  // 2. Error Handling
  if (!target) {
    throw new Error(`Intent '${userIntent}' not recognized. Please try: ${WORKFLOW_MAP.map(w => w.intent).join(', ')}`);
  }

  // 3. Validation Logic (Security & Accuracy)
  const missingFields = target.requiredFields.filter(field => !payload[field]);
  if (missingFields.length > 0) {
    return {
      status: "error",
      message: `I need more information: ${missingFields.join(', ')}`
    };
  }

  // 4. Execution (The actual n8n call)
  try {
    const response = await fetch(`https://your-n8n-instance.com/webhook/${target.workflowId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error("n8n Execution Error:", error);
    throw new Error("Failed to trigger automation. Check n8n logs.");
  }
}