import { useState, useEffect } from 'react';
import { AISummary, Todo, KnowledgeCard, Note, PulseReport } from '../types';
import useLocalStorage from './useLocalStorage';
import { generateSummary, generatePulseReport } from '../services/aiService';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return hash.toString();
}

const PULSE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useStudioAndPulse(notes: Note[]) {
    const [aiSummary, setAiSummary] = useLocalStorage<AISummary | null>('ai-notes-summary', null);
    const [myTodos, setMyTodos] = useLocalStorage<Todo[]>('ai-notes-mytodos', []);
    const [notesHashAtLastSummary, setNotesHashAtLastSummary] = useLocalStorage<string | null>('ai-notes-hash', null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    
    const [isLoadingPulse, setIsLoadingPulse] = useState(false);
    const [lastPulseTimestamp, setLastPulseTimestamp] = useLocalStorage<number | null>('ai-notes-pulse-timestamp', null);
    const [pulseReports, setPulseReports] = useLocalStorage<PulseReport[]>('ai-notes-pulse-reports', []);
    const [viewingPulseReport, setViewingPulseReport] = useState<PulseReport | null>(null);

    useEffect(() => {
        const now = Date.now();
        const shouldAutoGenerate = !lastPulseTimestamp || (now - lastPulseTimestamp > PULSE_INTERVAL);
        if (shouldAutoGenerate && notes.length > 0) {
            console.log("Auto-generating weekly Pulse report...");
            generateNewPulseReport(true);
        }
    }, [notes, lastPulseTimestamp, setLastPulseTimestamp, setPulseReports]);

    const generateNewSummary = async () => {
        const currentNotesHash = JSON.stringify(notes);
        if (notes.length > 0 && currentNotesHash !== notesHashAtLastSummary) {
            setIsLoadingAI(true);
            try {
                const rawSummary = await generateSummary(notes);
                const myTodoTexts = new Set(myTodos.map(t => t.text));
                const suggestedTodos = rawSummary.todos
                    .filter(text => !myTodoTexts.has(text))
                    .map((text: string): Todo => ({
                        id: simpleHash(text),
                        text,
                        completed: false,
                    }));
                const knowledgeCardsWithIds = rawSummary.knowledgeCards.map((card): KnowledgeCard => ({
                    ...card,
                    id: simpleHash(card.title + card.content),
                }));
                setAiSummary({
                    todos: suggestedTodos,
                    knowledgeCards: knowledgeCardsWithIds,
                });
                setNotesHashAtLastSummary(currentNotesHash);
            } catch (error) {
                console.error(error);
                alert('Failed to analyze notes. Please check the console for details.');
            } finally {
                setIsLoadingAI(false);
            }
        }
    };

    const toggleTodo = (id: string) => {
        setMyTodos(prevTodos => prevTodos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const adoptTodo = (todoToAdopt: Todo) => {
        setMyTodos(prev => [todoToAdopt, ...prev]);
        if (aiSummary) {
            const updatedSuggestedTodos = aiSummary.todos.filter(t => t.id !== todoToAdopt.id);
            setAiSummary({ ...aiSummary, todos: updatedSuggestedTodos });
        }
    };
    
    const generateNewPulseReport = async (isAuto = false) => {
        setIsLoadingPulse(true);
        try {
            const reportData = await generatePulseReport(notes);
            const newReport: PulseReport = {
                id: crypto.randomUUID(),
                ...reportData,
                createdAt: Date.now(),
            };
            setPulseReports(prev => [newReport, ...prev]);
            setLastPulseTimestamp(Date.now());
        } catch (error) {
            console.error("Pulse report generation failed:", error);
            if (!isAuto) {
                alert("Failed to generate Pulse Report. Please check the console for details.");
            }
        } finally {
            setIsLoadingPulse(false);
        }
    };

    return {
        aiSummary,
        myTodos,
        isLoadingAI,
        isLoadingPulse,
        pulseReports,
        viewingPulseReport,
        setViewingPulseReport,
        generateNewSummary,
        toggleTodo,
        adoptTodo,
        generateNewPulseReport,
    };
}