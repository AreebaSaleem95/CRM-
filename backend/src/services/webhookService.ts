/**
 * Interface definition for standardized outbound CRM webhook payloads
 */
export interface WebhookPayload {
  event: 'deal.won' | 'deal.updated' | 'task.completed' | 'calendar.event_created';
  timestamp: string;
  triggeredBy?: {
    id: number | string;
    name: string;
    role: string;
  };
  data: Record<string, any>;
}

/**
 * Generic dispatch function to push real-time CRM events to n8n automation gateway
 * Uses Node.js native fetch API without requiring external dependencies
 * @param event - Standardized event name
 * @param data - The entity payload (deal, task, or calendar event)
 * @param user - Current authenticated user context
 */
export const triggerCrmWebhook = async (
  event: WebhookPayload['event'],
  data: Record<string, any>,
  user?: { id: number | string; name: string; role: string }
): Promise<void> => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  // Fallback gracefully if automation URL is not configured
  if (!webhookUrl) {
    console.log(`[Automation Notice] N8N_WEBHOOK_URL is not set. Skipped event: ${event}`);
    return;
  }

  try {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      triggeredBy: user || { id: 'system', name: 'CRM Automated System', role: 'admin' },
      data,
    };

    console.log(`[Automation] Triggering "${event}" to n8n webhook endpoint...`);

    // Using native fetch API with timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enterprise-CRM-Engine/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`[Automation Success] Webhook payload delivered for event: ${event}`);
    } else {
      console.warn(`[Automation Warning] n8n responded with status code: ${response.status}`);
    }
  } catch (error: any) {
    // Non-blocking error handler so core operations never crash
    console.error(`[Automation Warning] Failed to dispatch webhook (${event}):`, error?.message || error);
  }
};