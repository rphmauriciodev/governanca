import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type Message = {
  role: Role;
  content: string;
};

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
};

export type InvokeResult = {
  choices: Array<{
    message: {
      role: Role;
      content: string;
    };
  }>;
};

// Inicializa o SDK do Google Gemini
const genAI = new GoogleGenerativeAI(ENV.forgeApiKey);

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.forgeApiKey) {
    throw new Error("GOOGLE_API_KEY (OPENAI_API_KEY) is not configured");
  }

  // O modelo é pego do ENV (ex: gemini-1.5-flash)
  const modelName = ENV.llmModel || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName });

  // Separa as mensagens do sistema das mensagens do usuário/assistente
  const systemMessage = params.messages.find(m => m.role === "system");
  const otherMessages = params.messages.filter(m => m.role !== "system");

  // Converte o histórico para o formato do Google
  const history = otherMessages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = otherMessages[otherMessages.length - 1].content;

  const generationConfig: any = {
    maxOutputTokens: params.maxTokens || 4096,
    temperature: 0.3,
  };

  // Se o formato for JSON, configura o modelo para responder em JSON
  if (params.responseFormat?.type === "json_object") {
    generationConfig.responseMimeType = "application/json";
  }

  const chat = model.startChat({
    history: history as any,
    generationConfig,
    systemInstruction: systemMessage ? { role: "system", parts: [{ text: systemMessage.content }] } : undefined,
  });

  try {
    const sendMessageWithRetry = async (msg: string, retries = 5): Promise<any> => {
      try {
        return await chat.sendMessage(msg);
      } catch (error: any) {
        // Tenta novamente em caso de limite de taxa (429) ou serviço ocupado (503)
        if ((error.status === 429 || error.status === 503) && retries > 0) {
          console.log(`[Gemini] Servidor ocupado (${error.status}), aguardando 15s para tentar novamente... (Tentativas restantes: ${retries})`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          return sendMessageWithRetry(msg, retries - 1);
        }
        throw error;
      }
    };

    const result = await sendMessageWithRetry(lastMessage);
    const response = await result.response;
    let text = response.text();

    // Extração cirúrgica do JSON: encontra o primeiro [ ou { e o último ] ou }
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start !== -1 && end !== -1 && end > start) {
      text = text.substring(start, end + 1);
    } else {
      // Fallback para limpeza manual se não achar delimitadores
      text = text.replace(/```json\n?|```\n?/g, "").trim();
    }

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: text,
          },
        },
      ],
    };
  } catch (error) {
    console.error("[Gemini] Erro ao invocar LLM:", error);
    throw error;
  }
}
