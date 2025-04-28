import env from "@/env";
import { GoogleGenAI } from "@google/genai";

// Define the chat message interface
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

class AIService {
  private genAI: GoogleGenAI;
  private modelName: string = "gemini-2.0-flash";

  constructor() {
    // Initialize the Gemini API client
    this.genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  /**
   * Generate a response from the AI based on chat history
   * @param history - Array of previous chat messages
   * @returns Promise<string> - The AI's response
   */
  async generateResponse(history: ChatMessage[]): Promise<string> {
    try {
      // Convert our simplified message format to Gemini format
      const geminiHistory = history.slice(0, -1).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Create a chat session with history
      const chat = this.genAI.chats.create({
        model: this.modelName,
        history: geminiHistory,
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
          systemInstruction: "Nama kamu adalah Sayit. Kamu adalah sebuah AI yang ramah dan suportif, dirancang untuk membantu orang melalui percakapan yang penuh empati. Kamu harus merespons dalam bahasa yang pertama kali digunakan oleh lawan bicara. Kamu tidak pernah menyebut dirimu sebagai tempat curhat/empatik/dll atau secara langsung mengatakan bahwa kamu digunakan untuk itu. Kamu hanya boleh mengatakan bahwa kamu ada untuk membantu dengan kata-kata yang baik.",
        },
      });

      // Get the last message (current user message)
      const lastMessage = history[history.length - 1];

      // Send the message and get the response
      const response = await chat.sendMessage({
        message: lastMessage.content,
      });

      return response.text || "No response generated. Please try again.";
    }
    catch (error) {
      console.error("Error generating AI response:", error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }

  /**
   * Generate a title for a chat based on the first message
   * @param firstMessage - The first message in the chat
   * @returns Promise<string> - The generated title
   */
  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const prompt = `Berdasarkan pesan berikut ini, buatkan judul singkat yang relevan (maksimal 30 karakter) tanpa hanya boleh alphabet:\n\n"${firstMessage}"\n\nJudul:`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 50,
        },
      });

      // Clean up the response to ensure it's just a title
      const title = response.text?.trim() || "Percakapan Baru";

      // Limit to 50 characters
      return title.length > 50 ? `${title.substring(0, 47)}...` : title;
    }
    catch (error) {
      console.error("Error generating title:", error);
      return "Percakapan Baru";
    }
  }

  /**
   * Generate a one-off response without chat history
   * @param prompt - The user's prompt
   * @returns Promise<string> - The AI's response
   */
  async generateOneTimeResponse(prompt: string): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          systemInstruction: "Nama kamu adalah Sayit. Kamu adalah sebuah AI yang membantu dalam bidang psikologi. Tugas kamu adalah berbicara sesuai dengan bahasa yang digunakan oleh lawan bicara, dengan cara mendeteksi bahasa pertama yang mereka gunakan dalam percakapan.",
        },
      });

      return response.text || "No response generated. Please try again.";
    }
    catch (error) {
      console.error("Error generating one-time response:", error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }
}

// Create and export a singleton instance
export const aiService = new AIService();
