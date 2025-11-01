
import { useWikiStore } from '../stores/wikiStore';
import { useNotesStore } from '../stores/notesStore';
import { WikiEntry } from '../types';
import { 
    generateWikiEntry, 
    generateWikiTopics,
    generateRelatedTopics,
    generateSubTopics as generateSubTopicsService,
} from '../services/wikiAIService';

export class WikiManager {
    setActiveWikiHistory = (history: WikiEntry[] | ((prev: WikiEntry[]) => WikiEntry[])) => {
        useWikiStore.setState(state => ({
            activeWikiHistory: typeof history === 'function' ? history(state.activeWikiHistory) : history
        }));
    };

    fetchWikiTopics = async () => {
        const { notes } = useNotesStore.getState();
        const { wikiTopics } = useWikiStore.getState();
        if (notes.length > 0 && wikiTopics.length === 0) {
            useWikiStore.setState({ isLoadingWikiTopics: true });
            try {
                const topics = await generateWikiTopics(notes);
                useWikiStore.setState({ wikiTopics: topics });
            } catch (error) {
                console.error("Failed to fetch wiki topics", error);
                useWikiStore.setState({ wikiTopics: [] });
            } finally {
                useWikiStore.setState({ isLoadingWikiTopics: false });
            }
        }
    }

    generateWiki = async (term: string, sourceNoteId: string, parentId: string | null, contextContent: string): Promise<WikiEntry> => {
        try {
            const content = await generateWikiEntry(term, contextContent);
            const relatedTopics = await generateRelatedTopics(content);
            const newWiki: WikiEntry = {
                id: crypto.randomUUID(),
                term,
                content,
                createdAt: Date.now(),
                sourceNoteId,
                parentId,
                suggestedTopics: relatedTopics
            };
            useWikiStore.setState(state => ({ wikis: [...state.wikis, newWiki] }));
            return newWiki;
        } catch (error) {
            console.error("Wiki generation failed:", error);
            alert("Failed to generate Wiki entry. Please try again.");
            throw error;
        }
    }
    
    generateSubTopics = async (selection: string, contextContent: string): Promise<string[]> => {
        try {
            const topics = await generateSubTopicsService(selection, contextContent);
            return topics;
        } catch (error) {
            console.error("Failed to generate sub-topics", error);
            alert("Failed to suggest topics. Please try again.");
            throw error;
        }
    }

    updateWikiWithTopics = async (wikiId: string) => {
        const { wikis } = useWikiStore.getState();
        const wiki = wikis.find(w => w.id === wikiId);
        if (!wiki || (wiki.suggestedTopics && wiki.suggestedTopics.length > 0)) return;

        try {
            const relatedTopics = await generateRelatedTopics(wiki.content);
            useWikiStore.setState(state => ({
                wikis: state.wikis.map(w => w.id === wikiId ? { ...w, suggestedTopics: relatedTopics } : w)
            }));
        } catch (error) {
            console.error(`Failed to update wiki ${wikiId} with related topics`, error);
        }
    }
    
    regenerateWiki = async (wikiId: string, clearChildren: boolean) => {
        const { wikis } = useWikiStore.getState();
        const { notes } = useNotesStore.getState();
        const originalWiki = wikis.find(w => w.id === wikiId);
        if (!originalWiki) return;

        try {
            const sourceNote = notes.find(n => n.id === originalWiki.sourceNoteId);
            const context = sourceNote ? sourceNote.content : notes.map(n => n.content).join('\n');

            const newContent = await generateWikiEntry(originalWiki.term, context);
            const newRelatedTopics = await generateRelatedTopics(newContent);
            
            useWikiStore.setState(state => {
                let updatedWikis = state.wikis.map(w =>
                    w.id === wikiId
                        ? { ...w, content: newContent, suggestedTopics: newRelatedTopics }
                        : w
                );

                if (clearChildren) {
                    const getDescendants = (parentId: string, all: WikiEntry[]): Set<string> => {
                        const children = all.filter(wiki => wiki.parentId === parentId);
                        if (children.length === 0) return new Set();
                        
                        const descendantIds = new Set(children.map(c => c.id));
                        children.forEach(child => {
                            getDescendants(child.id, all).forEach(id => descendantIds.add(id));
                        });
                        return descendantIds;
                    };
                    const childrenToDelete = getDescendants(wikiId, updatedWikis);
                    updatedWikis = updatedWikis.filter(w => !childrenToDelete.has(w.id));
                }
                
                return { wikis: updatedWikis };
            });

        } catch (error) {
            console.error("Wiki regeneration failed:", error);
            alert("Failed to regenerate Wiki entry. Please try again.");
        }
    }

    deleteWikisBySourceNoteId = (noteId: string) => {
        useWikiStore.setState(state => ({
            wikis: state.wikis.filter(w => w.sourceNoteId !== noteId)
        }));
    }
}
