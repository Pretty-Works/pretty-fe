"use client";

import { useMemo } from "react";

import { usePathname } from "next/navigation";

import EmptyChat from "@/features/agent/components/EmptyChat/EmptyChat";
import { useAgentSuggestionsQuery } from "@/features/agent/hooks/queries/useAgentSuggestionsQuery";
import { suggestionScreen } from "@/features/agent/screenRegistry/screenRegistry";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useDismissedSuggestionsStore } from "@/features/agent/stores/useDismissedSuggestionsStore";

export default function EmptyChatContainer({
  sendMessage,
}: {
  sendMessage: (prompt: string) => void;
}) {
  const pathname = usePathname();
  const folded = useAgentStore((state) => state.folded);
  const { data: suggestions, isLoading } = useAgentSuggestionsQuery(
    suggestionScreen(pathname),
    !folded,
  );
  const dismissedPrompts = useDismissedSuggestionsStore(
    (state) => state.prompts,
  );
  const dismissSuggestion = useDismissedSuggestionsStore(
    (state) => state.dismiss,
  );
  const visibleSuggestions = useMemo(
    () =>
      (suggestions ?? []).filter(
        (suggestion) => !dismissedPrompts.includes(suggestion.prompt),
      ),
    [suggestions, dismissedPrompts],
  );

  return (
    <EmptyChat
      suggestions={visibleSuggestions}
      loading={isLoading}
      onSelectPrompt={(prompt) => {
        dismissSuggestion(prompt);
        sendMessage(prompt);
      }}
    />
  );
}
