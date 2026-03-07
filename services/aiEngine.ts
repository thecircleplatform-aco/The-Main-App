import { deepseekChat } from "@/services/deepseek";

export type AgentId = "alex" | "sam" | "maya" | "victor" | "nova";

export type AgentPersona = {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
};

export type EngineRole = "user" | "agent" | "system";

export type EngineMessage = {
  id: string;
  role: EngineRole;
  content: string;
  agentId?: AgentId;
  agentName?: string;
  internal?: boolean;
  createdAt: string;
};

export type DiscussionOptions = {
  /**
   * Explicit list of agent IDs to use. If omitted, a random subset is chosen.
   */
  agentIds?: AgentId[];
  /**
   * Maximum number of agents to participate (default 4).
   */
  maxAgents?: number;
  /**
   * If true, agents will run an extra internal discussion round
   * (messages are marked with internal: true so callers can hide them).
   */
  internalDiscussion?: boolean;
  /**
   * If set to 1 or 2, stops after that many public rounds and sets paused: true.
   */
  pauseAfterRound?: 1 | 2;
  /**
   * If true, skip the "which agents should reply" LLM call and pick 1 agent at random for instant reply.
   */
  fastReply?: boolean;
};

export type DiscussionResult = {
  agents: AgentPersona[];
  messages: EngineMessage[];
  rounds: number;
  paused: boolean;
};

export type Insight = {
  title: string;
  summary: string;
};

const AGENTS: AgentPersona[] = [
  {
    id: "alex",
    name: "Alex",
    description: "Logical strategist",
    systemPrompt:
      "You are Alex, a logical strategist. Keep replies short and friendly. Focus on feasibility and next steps in plain language.",
  },
  {
    id: "sam",
    name: "Sam",
    description: "Calm observer",
    systemPrompt:
      "You are Sam, a calm observer. Keep replies short and friendly. Notice patterns and reframe simply; avoid long explanations.",
  },
  {
    id: "maya",
    name: "Maya",
    description: "Empathetic thinker",
    systemPrompt:
      "You are Maya, an empathetic thinker. Keep replies short and warm. Focus on how it affects people and one or two concrete ideas.",
  },
  {
    id: "victor",
    name: "Victor",
    description: "Critical challenger",
    systemPrompt:
      "You are Victor, a constructive critic. Keep replies short and friendly. Gently flag risks and gaps; stay helpful, not harsh.",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Creative thinker",
    systemPrompt:
      "You are Nova, a creative thinker. Keep replies short and fun. One or two fresh angles or ideas; no long tangents.",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(
    16
  )}`;
}

function getAgent(agentId: AgentId): AgentPersona {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }
  return agent;
}

function chooseAgents(
  { agentIds, maxAgents }: { agentIds?: AgentId[]; maxAgents?: number } = {},
): AgentPersona[] {
  const ids = agentIds && agentIds.length > 0 ? agentIds : (AGENTS.map((a) => a.id) as AgentId[]);
  const limit = Math.min(maxAgents ?? 4, ids.length);

  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit).map(getAgent);
}

/**
 * Pick 1–2 agents whose perspective best fits the user's message.
 * Returns agent IDs so only those reply (purpose-based, not everyone).
 */
async function selectRelevantAgents(
  userMessage: string,
  agents: AgentPersona[],
): Promise<AgentPersona[]> {
  if (agents.length <= 2) return agents;

  const agentList = agents
    .map((a) => `${a.id}: ${a.description}`)
    .join("\n");

  const system = [
    "You choose which AI agents should reply to the user. Only 1–2 agents should respond, the ones most relevant to the message.",
    "Reply with exactly 1 or 2 agent IDs from the list, comma-separated (e.g. alex,maya or nova). Use only: " +
      agents.map((a) => a.id).join(", "),
  ].join("\n");

  const user = [
    "Available agents:",
    agentList,
    "",
    "User message:",
    userMessage.slice(0, 800),
    "",
    "Which 1–2 agent IDs should reply? (comma-separated)",
  ].join("\n");

  try {
    const raw = await deepseekChat({
      system,
      user,
      temperature: 0.2,
    });
    const part = raw.split("\n")[0].toLowerCase().replace(/\s/g, "");
    const ids = part
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const validIds = new Set(agents.map((a) => a.id));
    const chosen = ids.filter((id) => validIds.has(id as AgentId)).slice(0, 2) as AgentId[];
    if (chosen.length > 0) {
      return chosen.map(getAgent);
    }
  } catch {
    // fallback: first 2 agents
  }
  return agents.slice(0, 2);
}

function formatHistoryForAgent(
  userMessage: string,
  history: EngineMessage[] | undefined,
  agentName: string,
): string {
  if (!history || history.length === 0) {
    return `User message: ${userMessage}`;
  }

  const lastMessages = history.slice(-8);
  const lines = lastMessages.map((m) => {
    const speaker =
      m.role === "user" ? "User" : m.agentName ?? m.agentId ?? m.role;
    return `${speaker}: ${m.content}`;
  });

  return [
    "Previous discussion so far:",
    ...lines,
    "",
    `New message from the user (respond as ${agentName}):`,
    userMessage,
  ].join("\n");
}

/**
 * Generate a single agent's reply to the user and the current discussion.
 */
export async function generateAgentReply(params: {
  agentId: AgentId;
  userMessage: string;
  history?: EngineMessage[];
  mode?: "user-facing" | "agent-to-agent" | "internal";
}): Promise<EngineMessage> {
  const { agentId, userMessage, history, mode = "user-facing" } = params;
  const agent = getAgent(agentId);

  const context = formatHistoryForAgent(userMessage, history, agent.name);

  let behaviorInstruction: string;
  switch (mode) {
    case "agent-to-agent":
      behaviorInstruction =
        "Briefly respond to other agents' points. One short paragraph or a few bullets. Friendly and clear.";
      break;
    case "internal":
      behaviorInstruction =
        "This is an internal, not user-visible reflection. Think out loud about the core risks, opportunities, and what you would recommend as next steps. Be blunt and analytical.";
      break;
    default:
      behaviorInstruction =
        "Reply in 2–4 short sentences or a few bullet points. Be warm, direct, and helpful. No long paragraphs or jargon. Stay in your personality.";
  }

  const system = [
    agent.systemPrompt,
    "",
    "General instructions:",
    behaviorInstruction,
  ].join("\n");

  const content = await deepseekChat({
    system,
    user: context,
  });

  return {
    id: generateId("msg"),
    role: mode === "internal" ? "system" : "agent",
    content,
    agentId: agent.id,
    agentName: agent.name,
    internal: mode === "internal",
    createdAt: nowIso(),
  };
}

/**
 * Run a multi-agent discussion:
 * - Round 1: agents reply to the user.
 * - Round 2: agents can respond to each other.
 * - Optional: internal discussion round.
 */
export async function runAgentDiscussion(params: {
  userMessage: string;
  history?: EngineMessage[];
  options?: DiscussionOptions;
}): Promise<DiscussionResult> {
  const { userMessage, history = [], options } = params;
  const { pauseAfterRound, internalDiscussion, fastReply } = options ?? {};

  const agents = chooseAgents(options);
  const speakingAgents = fastReply
    ? [agents[Math.floor(Math.random() * agents.length)]]
    : await selectRelevantAgents(userMessage, agents);

  const messages: EngineMessage[] = [
    ...history,
    {
      id: generateId("msg"),
      role: "user",
      content: userMessage,
      createdAt: nowIso(),
    },
  ];

  // Run all agent replies in parallel so we wait for the slowest, not the sum
  const replies = await Promise.all(
    speakingAgents.map((agent) =>
      generateAgentReply({
        agentId: agent.id,
        userMessage,
        history: messages,
        mode: "user-facing",
      })
    )
  );
  for (const reply of replies) {
    messages.push(reply);
  }

  const rounds = 1;

  if (pauseAfterRound === 1) {
    return {
      agents: speakingAgents,
      messages,
      rounds,
      paused: true,
    };
  }

  return {
    agents: speakingAgents,
    messages,
    rounds,
    paused: false,
  };
}

/**
 * Generate a high-level insight from a discussion.
 */
export async function generateInsight(params: {
  userMessage: string;
  messages: EngineMessage[];
}): Promise<Insight> {
  const { userMessage, messages } = params;

  const visibleMessages = messages.filter((m) => !m.internal);

  const transcript = visibleMessages
    .slice(-16)
    .map((m) => {
      const speaker =
        m.role === "user" ? "User" : m.agentName ?? m.agentId ?? m.role;
      return `${speaker}: ${m.content}`;
    })
    .join("\n");

  const system = [
    "You are an insight engine summarizing a multi-agent AI council discussion.",
    "Produce:",
    "1) A short, compelling title (max ~10 words).",
    "2) 3-5 bullet-point insights capturing agreements, disagreements, and next actions.",
    "Be concrete and avoid generic advice.",
  ].join("\n");

  const user = [
    "Original user message:",
    userMessage,
    "",
    "Discussion transcript (chronological):",
    transcript || "[no prior discussion]",
  ].join("\n");

  const content = await deepseekChat({
    system,
    user,
    temperature: 0.4,
  });

  const [rawTitle, ...rest] = content.split("\n").filter((line) => line.trim().length > 0);
  const title = rawTitle.replace(/^[#*\-\d\.\s]+/, "").trim();
  const summary = rest.join("\n").trim();

  return {
    title: title || "AI Council Insight",
    summary: summary || content.trim(),
  };
}

