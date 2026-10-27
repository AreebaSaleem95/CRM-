import { GoogleGenAI } from '@google/genai';

export interface DealData {
  title: string;
  company: string;
  value: number;
  currency?: string;
  stage?: string;
  priority?: string;
}

export interface AIPitchResult {
  probability: number;
  keyPoints: string[];
  pitch: string;
}

export interface ILLMProvider {
  generatePitch(deal: DealData): Promise<AIPitchResult>;
}

class GeminiProvider implements ILLMProvider {
  private ai: GoogleGenAI;

  constructor() {
    const rawKey = process.env.GEMINI_API_KEY?.trim() || '';
    this.ai = new GoogleGenAI({ apiKey: rawKey });
  }

  // Real-world dynamic engine (Stage, Priority, Currency, and Value sizing)
  private calculateDynamicProbability(
    stage?: string,
    priority?: string,
    value?: number,
    currency?: string
  ): number {
    const s = (stage || '').toLowerCase();
    const p = (priority || '').toLowerCase();
    const cur = (currency || '').toUpperCase();
    const rawVal = Number(value) || 0;

    let base = 30;
    if (s.includes('won')) return 100;
    if (s.includes('proposal')) base = 75;
    else if (s.includes('contacted')) base = 52;
    else if (s.includes('lead')) base = 25;

    if (p === 'high') base += 8;
    else if (p === 'low') base -= 8;

    let usdEquivalent = rawVal;
    if (cur.includes('PKR') || cur.includes('RS')) {
      usdEquivalent = rawVal / 278;
    } else if (cur.includes('EUR') || cur.includes('€')) {
      usdEquivalent = rawVal * 1.08;
    } else if (cur.includes('GBP') || cur.includes('£')) {
      usdEquivalent = rawVal * 1.28;
    }

    if (usdEquivalent > 10000) {
      base -= 10;
    } else if (usdEquivalent > 3000) {
      base -= 5;
    } else if (usdEquivalent > 0 && usdEquivalent < 500) {
      base += 7;
    }

    return Math.min(Math.max(Math.round(base), 15), 95);
  }

  async generatePitch(deal: DealData): Promise<AIPitchResult> {
    const calculatedBase = this.calculateDynamicProbability(
      deal.stage,
      deal.priority,
      deal.value,
      deal.currency
    );

    const currencyStr = deal.currency || 'PKR';
    const formattedVal = `${currencyStr} ${Number(deal.value || 0).toLocaleString()}`;

    const promptText = `You are an elite enterprise CRM sales director.
Analyze this deal:
- Title: "${deal.title}"
- Client: "${deal.company}"
- Value: ${formattedVal}
- Stage: "${deal.stage || 'Lead In'}"
- Priority: "${deal.priority || 'Medium'}"

Generate strictly valid JSON:
{
  "probability": ${calculatedBase},
  "keyPoints": [
    "Align core value proposition for ${deal.company}",
    "Address implementation timeline tailored for ${deal.title}",
    "Provide clear transparent commercial milestones for ${formattedVal}"
  ],
  "pitch": "Formal 2-paragraph outreach email to ${deal.company} finalizing terms."
}`;

    // Helper with quick 4-second timeout to prevent UI freeze
    const fetchWithTimeout = async (modelName: string): Promise<string> => {
      const apiCall = this.ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI Request Timeout')), 4000)
      );

      const response: any = await Promise.race([apiCall, timeout]);
      return response.text || '{}';
    };

    try {
      let rawText = '';
      try {
        // First try primary model
        rawText = await fetchWithTimeout('gemini-2.5-flash');
      } catch (firstErr: any) {
        // Fallback to alternate endpoint if busy or unavailable
        rawText = await fetchWithTimeout('gemini-2.0-flash');
      }

      let cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        probability: Number(parsed.probability) || calculatedBase,
        keyPoints:
          Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0
            ? parsed.keyPoints
            : [
                `Accelerate enterprise decision timeline with ${deal.company}`,
                `Position ${deal.title} against current business bottlenecks`,
                `Structure milestone delivery around ${formattedVal}`
              ],
        pitch:
          parsed.pitch ||
          `Dear ${deal.company} Team,\n\nFollowing up on our discussions regarding "${deal.title}". Our enterprise architecture delivers verified operational cost savings and scalable database resilience tailored to your business scope.\n\nWe would welcome a brief 15-minute briefing this week to present the implementation roadmap and secure closing terms for this engagement.`
      };
    } catch (fallbackError: any) {
      // Immediate resilient fallback (Never leaves UI spinning)
      return {
        probability: calculatedBase,
        keyPoints: [
          `Prioritize immediate operational ROI for ${deal.company}`,
          `Establish seamless technical deployment for ${deal.title}`,
          `Offer structured milestone payments for ${formattedVal}`
        ],
        pitch: `Dear ${deal.company} Team,\n\nFollowing up on our recent consultation regarding "${deal.title}". We have reviewed the scope requirements and prepared an optimized implementation strategy aligned with your current stage (${deal.stage || 'Lead'}).\n\nGiven the commercial valuation of ${formattedVal}, our team is prepared to offer dedicated SLA guarantees and proactive integration support. Please let us know if you have 10 minutes available this Thursday for a brief sync.`
      };
    }
  }
}

export const getLLMProvider = (): ILLMProvider => {
  return new GeminiProvider();
};