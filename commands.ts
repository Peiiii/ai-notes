export interface Command {
    name: string;
    params: string;
    description: string;
    definition: string;
    isCustom: boolean;
}

export const defaultCommands: Command[] = [
    {
        name: 'search',
        params: '<query>',
        description: 'Search your notes for a specific topic.',
        definition: "The user wants to find information in their notes. Your primary goal is to use the `search_notes` tool with an appropriate query derived from the user's input. After getting the search results, present the answer concisely and directly based *only* on the provided context. You must cite the source notes you used.",
        isCustom: false,
    },
    {
        name: 'create',
        params: '<title>',
        description: 'Create a new note with a title.',
        definition: "The user wants to create a new note. Use the `create_note` tool. The user's input following the command is the title of the note. The content should be empty unless the user specifies it. Confirm the creation of the note in your response.",
        isCustom: false,
    }
];