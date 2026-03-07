/**
 * Council crew roster for the chat UI — who the user can call for planning.
 * Kept in sync with agents in services/aiEngine.
 */
export type CrewMember = {
  id: string;
  name: string;
  description: string;
};

export const CREW: CrewMember[] = [
  { id: "alex", name: "Alex", description: "Logical strategist" },
  { id: "sam", name: "Sam", description: "Calm observer" },
  { id: "maya", name: "Maya", description: "Empathetic thinker" },
  { id: "victor", name: "Victor", description: "Critical challenger" },
  { id: "nova", name: "Nova", description: "Creative thinker" },
];
