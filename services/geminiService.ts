
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameEvent, Item, ItemRarity, SlotType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Fallback event if API fails or no key
const FALLBACK_EVENT: GameEvent = {
  title: "废弃信号",
  description: "你收到了一个来自被摧毁的运输船的微弱信号。调查它看起来很安全，但海盗可能就在附近。",
  choices: [
    {
      text: "打捞残骸",
      outcomeDescription: "你在残骸中发现了一些可用的材料。",
      reward: { materials: 15 }
    },
    {
      text: "离开",
      outcomeDescription: "安全第一。你离开了。",
    }
  ]
};

const eventSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          outcomeDescription: { type: Type.STRING },
          rewardType: { type: Type.STRING, enum: ['CREDITS', 'MATERIALS', 'REPAIR', 'DAMAGE', 'NOTHING'] },
          rewardValue: { type: Type.NUMBER }
        },
        required: ['text', 'outcomeDescription', 'rewardType']
      }
    }
  },
  required: ['title', 'description', 'choices']
};

export const generateMysteryEvent = async (sectorLevel: number): Promise<GameEvent> => {
  if (!ai) {
    console.warn("Gemini API Key missing, using fallback.");
    return FALLBACK_EVENT;
  }

  try {
    const prompt = `生成一个科幻肉鸽太空遭遇事件（类似FTL或EVE Online），请使用中文。
    玩家处于危险的扇区（等级 ${sectorLevel}）。
    创建一个标题，一个简短的氛围描述（最多50字），以及2-3个选择。
    每个选择都需要一个后果。
    
    奖励指南：
    - CREDITS（信用点）: 100-1000
    - MATERIALS（材料）: 10-50
    - REPAIR（维修）: 恢复结构
    - DAMAGE（伤害）: 结构伤害 (10-100)
    - NOTHING（无）: 仅剧情文本
    
    输出必须严格符合JSON格式。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Map the raw JSON to our internal GameEvent structure with typed rewards
    return {
      title: data.title,
      description: data.description,
      choices: data.choices.map((c: any) => ({
        text: c.text,
        outcomeDescription: c.outcomeDescription,
        reward: c.rewardType === 'NOTHING' ? undefined : {
          credits: c.rewardType === 'CREDITS' ? c.rewardValue : undefined,
          materials: c.rewardType === 'MATERIALS' ? c.rewardValue : undefined,
          repair: c.rewardType === 'REPAIR' ? true : undefined,
          damage: c.rewardType === 'DAMAGE' ? c.rewardValue : undefined,
        }
      }))
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return FALLBACK_EVENT;
  }
};
