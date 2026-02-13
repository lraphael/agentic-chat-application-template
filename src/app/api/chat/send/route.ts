import type { NextRequest } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import {
  addMessage,
  createConversation,
  generateTitleFromMessage,
  getMessages,
  SendMessageSchema,
  streamChatCompletion,
} from "@/features/chat";
import { buildKnowledgeContext } from "@/features/knowledge";

const logger = getLogger("api.chat.send");

/**
 * POST /api/chat/send
 * Send a message and stream the AI response via SSE.
 * Automatically searches the shared knowledge base for relevant context.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, conversationId: existingConversationId } = SendMessageSchema.parse(body);

    // Create conversation if needed
    let conversationId = existingConversationId;
    if (!conversationId) {
      const title = generateTitleFromMessage(content);
      const conversation = await createConversation(title);
      conversationId = conversation.id;
      logger.info({ conversationId }, "chat.conversation_created");
    }

    // Save user message
    await addMessage(conversationId, "user", content);

    // Search knowledge base for relevant context
    const { context: knowledgeContext, sources } = await buildKnowledgeContext(content);
    if (sources.length > 0) {
      logger.info({ conversationId, sourceCount: sources.length }, "chat.knowledge_context_found");
    }

    // Get history for context
    const history = await getMessages(conversationId);

    // Stream completion with knowledge context
    const { stream, fullResponse } = await streamChatCompletion(history, { knowledgeContext });

    // Wrap the stream to prepend sources and save assistant message after completion
    const reader = stream.getReader();
    const encoder = new TextEncoder();
    let sourcesSent = false;

    const wrappedStream = new ReadableStream({
      async pull(controller) {
        // Send sources event before first content chunk
        if (!sourcesSent) {
          sourcesSent = true;
          if (sources.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`),
            );
          }
        }

        const { done, value } = await reader.read();
        if (!done) {
          controller.enqueue(value);
          return;
        }
        // Stream finished — save assistant message
        try {
          const fullText = await fullResponse;
          await addMessage(conversationId, "assistant", fullText, sources);
          logger.info({ conversationId }, "chat.assistant_message_saved");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", saved: true })}\n\n`),
          );
        } catch (err) {
          logger.error({ conversationId, error: err }, "chat.assistant_message_save_failed");
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Failed to save response" })}\n\n`,
            ),
          );
        }
        controller.close();
      },
    });

    // Return SSE response
    return new Response(wrappedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
