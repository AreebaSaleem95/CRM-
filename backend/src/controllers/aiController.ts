import { Request, Response } from 'express';
import { getLLMProvider } from '../services/llmProvider';

export const generateDealPitch = async (req: Request, res: Response) => {
  try {
    const { title, company, value, currency, stage, priority } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        success: false,
        message: 'Deal title and company name are required.'
      });
    }

    const provider = getLLMProvider();
    const result = await provider.generatePitch({
      title,
      company,
      value: Number(value) || 0,
      currency,
      stage,
      priority
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI pitch. Please check your Gemini API key.'
    });
  }
};