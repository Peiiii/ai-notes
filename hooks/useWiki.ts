import { useState } from 'react';
import { WikiEntry, Note } from '../types';
import useLocalStorage from './useLocalStorage';
import { 
    generateWikiEntry, 
    generateWikiTopics,
    generateRelatedTopics,
} from '../services/wikiAIService';

export function useWiki(notes: Note[]) {
    const [wikis, setWikis] = useLocalStorage<WikiEntry[]>('ai-notes-wikis', []);
    const [wikiTopics, setWikiTopics] = useLocalStorage<string[]>('ai-notes-wikitopics', []);
    const [isLoadingWikiTopics, setIsLoadingWikiTopics] = useState(false);
    const [initialWikiHistory, setInitialWikiHistory] = useState<(Note | WikiEntry)[] | null>(null);

    const fetchWikiTopics = async () => {
        if (notes.length > 0 && wikiTopics.length === 0) {
            setIsLoadingWikiTopics(true);
            try {
                const topics = await generateWikiTopics(notes);
                setWikiTopics(topics);
            } catch (error) {
                console.error("Failed to fetch wiki topics", error);
                setWikiTopics([]);
            } finally {
                setIsLoadingWikiTopics(false);
            }
        }
    };

    const generateWiki = async (term: string, sourceNoteId: string, parentId: string | null, contextContent: string): Promise<WikiEntry> => {
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
            setWikis(prev => [...prev, newWiki]);
            return newWiki;
        } catch (error) {
            console.error("Wiki generation failed:", error);
            alert("Failed to generate Wiki entry. Please try again.");
            throw error;
        }
    };
    
    const updateWikiWithTopics = async (wikiId: string) => {
        const wiki = wikis.find(w => w.id === wikiId);
        if (!wiki || (wiki.suggestedTopics && wiki.suggestedTopics.length > 0)) return;

        try {
            const relatedTopics = await generateRelatedTopics(wiki.content);
            setWikis(prev => prev.map(w => w.id === wikiId ? { ...w, suggestedTopics: relatedTopics } : w));
        } catch (error) {
            console.error(`Failed to update wiki ${wikiId} with related topics`, error);
        }
    };
    
    const regenerateWiki = async (wikiId: string, clearChildren: boolean) => {
        const originalWiki = wikis.find(w => w.id === wikiId);
        if (!originalWiki) return;

        try {
            const sourceNote = notes.find(n => n.id === originalWiki.sourceNoteId);
            const context = sourceNote ? sourceNote.content : notes.map(n => n.content).join('\n');

            const newContent = await generateWikiEntry(originalWiki.term, context);
            const newRelatedTopics = await generateRelatedTopics(newContent);
            
            setWikis(prevWikis => {
                let updatedWikis = prevWikis.map(w =>
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
                
                return updatedWikis;
            });

        } catch (error) {
            console.error("Wiki regeneration failed:", error);
            alert("Failed to regenerate Wiki entry. Please try again.");
        }
    };

    const deleteWikisBySourceNoteId = (noteId: string) => {
        setWikis(prevWikis => prevWikis.filter(w => w.sourceNoteId !== noteId));
    };

    return {
        wikis,
        wikiTopics,
        isLoadingWikiTopics,
        initialWikiHistory,
        setInitialWikiHistory,
        fetchWikiTopics,
        generateWiki,
        updateWikiWithTopics,
        regenerateWiki,
        deleteWikisBySourceNoteId,
    };
}
