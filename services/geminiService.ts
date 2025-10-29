import { GoogleGenAI, Modality } from "@google/genai";

function base64ToGeminiPart(base64: string) {
    const match = base64.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
    if (!match) {
        // Fallback for non-data-URI base64 strings
        if (base64.length > 0) {
          return {
            inlineData: {
                // Assume jpeg as a common fallback
                mimeType: 'image/jpeg',
                data: base64,
            },
          };
        }
        throw new Error("Invalid base64 image string format");
    }
    return {
        inlineData: {
            mimeType: match[1],
            data: match[2],
        },
    };
}


export async function generateImage(prompt: string, base64Image: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Image re-creation with gemini-2.5-flash-image
    const imagePart = base64ToGeminiPart(base64Image);
    const textPart = { text: `Following the user's instructions, re-create this food photograph. Instructions: ${prompt}` };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image was generated in the response for re-creation.");

  } catch (error) {
    console.error("Error re-creating image with Gemini:", error);
    if (error instanceof Error) {
        return Promise.reject(error.message);
    }
    return Promise.reject("An unknown error occurred while re-creating the image.");
  }
}
