import React from 'react';
// Fix: Removed Note and ExplorationItem type as history now only contains WikiEntry.
import { WikiEntry } from '../../types';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import HoverPopup from '../ui/HoverPopup';

interface WikiBreadcrumbProps {
    // Fix: Updated history to be of type WikiEntry[]
    history: WikiEntry[];
    wikis: WikiEntry[];
    // Fix: Updated setHistory to work with WikiEntry[]
    setHistory: React.Dispatch<React.SetStateAction<WikiEntry[]>>;
}

const WikiBreadcrumb: React.FC<WikiBreadcrumbProps> = ({ history, wikis, setHistory }) => {
    // Fix: Updated item to be of type WikiEntry and simplified title logic.
    const BreadcrumbItem = ({ item, isLast }: { item: WikiEntry; isLast: boolean }) => {
        const children = wikis.filter(w => w.parentId === item.id);
        const title = item.term;

        const handleItemClick = () => {
            const itemIndex = history.findIndex(h => h.id === item.id);
            if (itemIndex !== -1) {
                setHistory(prev => prev.slice(0, itemIndex + 1));
            }
        }
        
        const trigger = (
            <button
                onClick={handleItemClick}
                className={`text-sm font-medium ${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                {title}
            </button>
        );

        if (children.length === 0) {
            return trigger;
        }

        const content = (
            <div 
                className="w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 p-2 animate-in fade-in zoom-in-95"
            >
                <button onClick={handleItemClick} className="w-full text-left block px-3 py-2 text-sm font-semibold rounded-md text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/50 mb-1">{title}</button>
                
                <div className="border-t border-slate-200 dark:border-slate-700 my-1 -mx-2"></div>
                <p className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 max-h-24 overflow-hidden">
                    {item.content.substring(0, 150)}{item.content.length > 150 ? '...' : ''}
                </p>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1 -mx-2"></div>
                
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setHistory(prev => [...prev.slice(0, prev.findIndex(h => h.id === item.id) + 1), child])}
                        className="w-full text-left block px-3 py-2 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {child.term}
                    </button>
                ))}
            </div>
        );

        return (
            <HoverPopup 
                trigger={trigger}
                content={content}
                popupClassName="absolute top-full left-0 mt-2 z-20"
                className="relative"
            />
        );
    };

    return (
        <div className="flex items-center flex-wrap gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
            {history.map((item, index) => (
                <React.Fragment key={item.id}>
                    <BreadcrumbItem item={item} isLast={index === history.length - 1} />
                    {index < history.length - 1 && <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default WikiBreadcrumb;