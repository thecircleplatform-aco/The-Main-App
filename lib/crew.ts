/**
 * Personal AI Crew roster for the chat UI.
 * Lumana (Circle AI) is default. Sam, Alex, Maya, Nova reply when called by name.
 */
export type CrewMember = {
  id: string;
  name: string;
  description: string;
};

export const CREW: CrewMember[] = [
  { id: "lumana", name: "Lumana", description: "Circle AI — your default companion" },
  { id: "sam", name: "Sam", description: "Friendly everyday assistant" },
  { id: "alex", name: "Alex", description: "Logical reasoning & research" },
  { id: "maya", name: "Maya", description: "Emotional & relationship advisor" },
  { id: "nova", name: "Nova", description: "Creative thinker" },
];
