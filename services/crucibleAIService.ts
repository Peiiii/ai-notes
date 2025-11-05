import { GenerateJsonParams } from './providers/types';
import { getConfig } from './aiService';
import { Type } from "@google/genai";
import { CrucibleStoryStructure, ConceptOperator } from '../types';

// Schema for generating divergent thoughts
const divergentThoughtsSchema = {
    type: Type.ARRAY,
    description: "A list of 15-20 diverse, associative, and thought-provoking words or short phrases related to the user's topic.",
    items: { type: Type.STRING }
};

// New function to generate initial ideas
export const generateDivergentThoughts = async (topic: string): Promise<string[]> => {
    const prompt = `
    You are a Creative Catalyst AI. Your goal is to shatter creative blocks by generating a wide spectrum of associations for a given topic.

    **CRITICAL LANGUAGE RULE:**
    1.  First, identify the primary language of the user's topic provided below.
    2.  Your entire response, including all generated words and phrases for all categories, MUST be in that single identified language.
    3.  For example, if the topic is in Chinese, all generated terms MUST be in Chinese. If the topic is in Spanish, all terms MUST be in Spanish. DO NOT revert to English unless English is the language of the topic.

    **User's Topic:** "${topic}"

    **Your Task:**
    Generate a rich list of 15-20 associated words or short phrases (2-5 words max) based on the topic. The list MUST be highly diverse and include a mix of the following categories, all in the identified language:

    1.  **Direct Associations (4-5 terms):** Words that are directly and semantically related to the topic.
    2.  **Imaginative & Metaphorical (4-5 terms):** Poetic or metaphorical concepts related to the topic.
    3.  **Philosophical & Abstract (4-5 terms):** High-level, abstract, or philosophical ideas related to the topic.
    4.  **Stochastic Wild Cards (2-3 terms):** Completely random and unrelated words to force novel connections. These wild cards MUST also be in the identified language and should not have any obvious link to the topic.

    Combine all generated terms into a single, shuffled JSON array. Variety is paramount. Avoid full sentences.

    Respond ONLY with a valid JSON array of strings that conforms to the schema. Remember the CRITICAL LANGUAGE RULE.
    `;

    const { provider, model } = getConfig('proactiveSuggestions'); 
    const params: GenerateJsonParams = { model, prompt, schema: divergentThoughtsSchema };
    return provider.generateJson(params);
};


// NEW function for concept operators
const expansionSchema = {
    type: Type.ARRAY,
    description: "A list of 3-5 new, related words or short phrases based on the operator.",
    items: { type: Type.STRING }
};

export const expandWithOperator = async (terms: string[], operator: ConceptOperator): Promise<string[]> => {
    const operatorDescriptions: Record<ConceptOperator, string> = {
        generalize: "Take the core idea of the terms and find a broader, more abstract category or concept they belong to (go up one level of abstraction).",
        specify: "Take the core idea of the terms and provide more specific examples, instances, or components (go down one level of abstraction).",
        analogize: "Find a compelling analogy or metaphor for the core idea from a completely different domain (e.g., explain a physics concept using a music analogy).",
        synthesize: "Combine the terms into a new, single, hybrid concept or a short phrase that encapsulates their fusion.",
        reverse: "Find the antonyms, opposites, or a complete inversion of the core idea presented by the terms.",
        perspective: "Imagine how different archetypes (e.g., an artist, an engineer, a child) would view these concepts. Provide short phrases from their perspectives."
    };
    
    const prompt = `
    You are a creative thinking assistant. Your task is to expand on a set of concepts using a specific thinking operator.

    **CRITICAL LANGUAGE RULE:** You MUST respond in the same language as the user's provided 'Concepts'.

    **Concepts:** "${terms.join('", "')}"

    **Thinking Operator to Apply:** ${operator.charAt(0).toUpperCase() + operator.slice(1)}
    **Operator Definition:** ${operatorDescriptions[operator]}

    **Task:**
    Based on the operator, generate a list of 3-5 new, creative, and relevant words or short phrases that expand upon the initial concepts.

    Respond ONLY with a valid JSON array of strings.
    `;

    const { provider, model } = getConfig('proactiveSuggestions'); 
    const params: GenerateJsonParams = { model, prompt, schema: expansionSchema };
    return provider.generateJson(params);
};


// NEW function for story structure
const storyStructureSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A compelling title for the story." },
        logline: { type: Type.STRING, description: "A one-sentence summary of the story's plot, character, and conflict." },
        worldview: { type: Type.STRING, description: "A detailed, multi-paragraph description of the story's world, setting, rules, and atmosphere, formatted in Markdown." },
        characters: {
            type: Type.ARRAY,
            description: "A list of 2-3 main characters.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A brief description of the character's motivations and role." }
                },
                required: ["name", "description"]
            }
        },
        outline: {
            type: Type.OBJECT,
            description: "A three-act story outline.",
            properties: {
                act_1: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A title for Act 1, e.g., 'The Setup'." },
                        plot_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 key plot points for the first act." }
                    },
                    required: ["title", "plot_points"]
                },
                act_2: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A title for Act 2, e.g., 'The Confrontation'." },
                        plot_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 key plot points for the second act." }
                    },
                     required: ["title", "plot_points"]
                },
                act_3: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A title for Act 3, e.g., 'The Resolution'." },
                        plot_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 key plot points for the final act." }
                    },
                     required: ["title", "plot_points"]
                }
            },
            required: ["act_1", "act_2", "act_3"]
        }
    },
    required: ["title", "logline", "worldview", "characters", "outline"]
};

export const generateStoryStructure = async (terms: string[]): Promise<CrucibleStoryStructure> => {
    if (terms.length === 0) throw new Error("Cannot generate a story from an empty list of terms.");
    
    const prompt = `
    You are a master storyteller and world-builder. Your task is to create a complete and captivating story architecture from a set of seed concepts.

    **CRITICAL LANGUAGE RULE:** You MUST write the entire story structure in the same language as the user's provided 'Seed Concepts'.

    **Seed Concepts:** "${terms.join('", "')}"

    **Your Two-Step Task:**

    **Step 1: Build the Worldview.**
    First, synthesize all of the seed concepts into a single, cohesive, and unique world. This "worldview" is the foundation of the story. It should be detailed and atmospheric. Describe the setting, the rules of this reality (physical or magical), the societal structure, and the overall mood. Use rich, descriptive language in Markdown format. This should be several paragraphs long.

    **Step 2: Create the Story Within the World.**
    After establishing the worldview, create the story components that exist *within* it. Make the story as engaging and imaginative as possible. Emphasize memorable characters, high-stakes conflict, and emotional resonance.
    -   **Title:** A compelling title.
    -   **Logline:** A one-sentence summary.
    -   **Characters:** 2-3 main characters with descriptions tied to the world you built.
    -   **Outline:** A standard three-act structure (Setup, Confrontation, Resolution), with 3-4 key plot points for each act that logically follow from the characters and the world's rules.

    Respond ONLY with a single, valid JSON object that conforms to the schema.
    `;

    const { provider, model } = getConfig('agent_final_answer'); // Use a powerful model for this
    const params: GenerateJsonParams = { model, prompt, schema: storyStructureSchema };
    return provider.generateJson(params);
};