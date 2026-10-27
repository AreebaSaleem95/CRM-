import api, { USE_MOCK } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";

export async function draftFollowUp({ leadId, tone }) {
  if (USE_MOCK) {
    await delay(600);
    return {
      subject: "Following up (mock draft)",
      body: "Hi,\n\nThis is a sample draft shown in mock mode. Connect the backend to get a real AI-written email.\n\nBest regards",
    };
  }
  const { data } = await api.post(`/ai/leads/${leadId}/follow-up`, { tone });
  return data;
}