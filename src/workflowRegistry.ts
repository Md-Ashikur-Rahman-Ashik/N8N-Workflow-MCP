export const WORKFLOW_MAP = [
  {
    intent: "send invoice",
    workflowId: "wf_abc_123",
    description: "Generates and emails a PDF invoice to a client.",
    requiredFields: ["client_name", "amount"],
  },
  {
    intent: "add lead",
    workflowId: "wf_xyz_789",
    description: "Adds a new contact to the CRM and n8n sequence.",
    requiredFields: ["email"],
  },
];
