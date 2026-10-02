"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/styles/insights.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function InsightsChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can help you analyze your research data and develop strategic insights. What would you like to know?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const userHasScrolled = useRef(false);
  const shouldAutoScroll = useRef(true);
  const lastMessageLength = useRef(0);

  // Track when user manually scrolls - wrapped in useCallback to use in dependency array
  const handleScroll = useCallback(() => {
    if (!chatMessagesRef.current || !isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;

    // If not at bottom and content has changed, user has scrolled up
    if (!isAtBottom) {
      userHasScrolled.current = true;
      shouldAutoScroll.current = false;
    } else {
      // If user scrolls back to bottom, resume auto-scrolling
      shouldAutoScroll.current = true;
    }
  }, [isLoading]);

  // Modified scroll function that respects user's position
  const scrollToBottom = (force = false) => {
    if (!chatMessagesRef.current) return;

    // Only scroll if we should auto-scroll or force is true
    if (shouldAutoScroll.current || force) {
      const { scrollHeight, clientHeight } = chatMessagesRef.current;
      chatMessagesRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  // Track content changes and scroll accordingly
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      scrollToBottom(true);
      return;
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // If it's an assistant message and we're loading
    if (lastMessage?.role === "assistant" && isLoading) {
      // Check if content length has changed significantly
      if (lastMessage.content.length > lastMessageLength.current + 50) {
        lastMessageLength.current = lastMessage.content.length;
        scrollToBottom(); // This will respect shouldAutoScroll
      }
    } else {
      // New messages (not streaming) - force scroll
      scrollToBottom(true);
      lastMessageLength.current = lastMessage?.content.length || 0;
    }
  }, [messages, isLoading]);

  // Set up scroll event listener
  useEffect(() => {
    const chatContainer = chatMessagesRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const sendMessage = async () => {
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    setIsLoading(true);
    setInputValue("");

    // Reset scroll tracking when sending new message
    userHasScrolled.current = false;
    shouldAutoScroll.current = true;
    lastMessageLength.current = 0;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Get file IDs and context data from localStorage
      const storedFiles = localStorage.getItem("discovr_uploaded_files");
      const fileIds = storedFiles
        ? JSON.parse(storedFiles)
            .map((file: { fileId: string }) => file.fileId)
            .filter((id: string) => id !== "demo_file_001")
        : [];

      // Include the strategy, metrics and data in the message for context
      const strategy = localStorage.getItem("discovr_strategy") || "";
      const metrics = JSON.parse(
        localStorage.getItem("discovr_metrics") || "[]"
      );
      const data = localStorage.getItem("discovr_data") || "";

      // Construct contextual prompt if there's any saved data
      let contextualPrompt = userMessage;
      if (strategy || metrics.length > 0 || data) {
        contextualPrompt =
          `Here's some context about our project:\n\n` +
          (strategy ? `Strategy: ${strategy}\n\n` : "") +
          (metrics.length > 0 ? `Metrics: ${metrics.join(", ")}\n\n` : "") +
          (data ? `Research Data: ${data}\n\n` : "") +
          `User Question: ${userMessage}`;
      }

      const response = await fetch("/api/insights-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextualPrompt,
          responseId,
          fileIds,
        }),
      });

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        throw new Error(failure.error || "Insights are temporarily unavailable.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let accumulatedMessage = "";
      let completed = false;
      let buffer = "";
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";
          for (const frame of frames) {
            const line = frame.split("\n").find(line => line.startsWith("data: "));
            if (!line) continue;
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.text) {
              accumulatedMessage += data.text;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: accumulatedMessage }]);
            }
            if (data.done) {
              completed = true;
              if (data.responseId) setResponseId(data.responseId);
            }
          }
          if (done) break;
        }
        if (!completed || !accumulatedMessage.trim()) throw new Error("The insights response was interrupted. Please try again.");
      } finally {
        await reader.cancel();
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Insights are temporarily unavailable.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I can help you analyze your research data and develop strategic insights. What would you like to know?",
      },
    ]);
    setResponseId(null);

    // Reset scroll tracking
    userHasScrolled.current = false;
    shouldAutoScroll.current = true;
    lastMessageLength.current = 0;
  };

  // Thinking animation component
  const ThinkingAnimation = () => (
    <div className={styles.loadingIndicator}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === "user"
                ? styles.userMessage
                : styles.assistantMessage
            }`}
          >
            {message.role === "assistant" ? (
              <>
                {message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  isLoading &&
                  index === messages.length - 1 && <ThinkingAnimation />
                )}
              </>
            ) : (
              message.content
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInputContainer}>
        <textarea
          className={styles.chatInput}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading}
        />
        <button
          className={styles.clearButton}
          onClick={clearChat}
          disabled={isLoading}
        >
          Clear
        </button>
        <button
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
} 