// sidesa/contexts/ChatbotContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

type ChatbotPageContext = {
  pageId: string;
  pageTitle: string;
  filters: {
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
  };
  visibleDataSummary: Record<string, any> | null;
};

type ChatbotContextType = {
  pageContext: ChatbotPageContext;
  setPageContext: (context: ChatbotPageContext) => void;
};

const defaultContext: ChatbotPageContext = {
  pageId: "overview",
  pageTitle: "Overview",
  filters: {},
  visibleDataSummary: null,
};

const ChatbotContext = createContext<ChatbotContextType>({
  pageContext: defaultContext,
  setPageContext: () => {},
});

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<ChatbotPageContext>(defaultContext);

  return (
    <ChatbotContext.Provider value={{ pageContext, setPageContext }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbotContext() {
  return useContext(ChatbotContext);
}