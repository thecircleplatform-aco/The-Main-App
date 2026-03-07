export type CouncilPersona = {
  id: string;
  name: string;
  tagline: string;
  systemPrompt: string;
  accent: "cyan" | "violet" | "amber" | "emerald" | "rose";
};

export type CouncilMessage = {
  id: string;
  role: "user" | "assistant";
  personaId?: string;
  personaName?: string;
  content: string;
  createdAt: string;
};

export type CouncilRequest = {
  idea: string;
};

export type CouncilResponse = {
  messages: CouncilMessage[];
};

