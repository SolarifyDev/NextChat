import { useState } from "react";

interface IAssistant {
  id: number;
  name: string;
  answeringNumberId: number;
  answeringNumber: string;
  modelUrl: string;
  modelProvider: number;
  modelVoice: string;
  agentId: number;
  customRecordAnalyzePrompt: string;
  channel: string;
  createdDate: string;
  createdBy: number;
  knowledge: {
    id: number;
    assistantId: number;
    json: string;
    prompt: string;
    isActive: boolean;
    brief: string;
    greetings: string;
    createdDate: string;
    createdBy: number;
  };
  channels: number[];
}

export const useAssistant = () => {
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<IAssistant | null>(
    null,
  );
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const getAssistants = async () => {
    setIsAssistantLoading(true);
    try {
      const response = await fetch("/api/assistants");
      const data = await response.json();
      if (!data.data || !data.data.assistants) {
        setAssistants([]);
        return;
      }

      setAssistants(data.data.assistants);
    } catch (error) {
      setAssistants([]);
      console.error("Error fetching assistants:", error);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const selectAssistant = (assistant: IAssistant | null) => {
    setSelectedAssistant(assistant);
  };

  return {
    assistants,
    isAssistantLoading,
    selectedAssistant,
    getAssistants,
    selectAssistant,
  };
};
