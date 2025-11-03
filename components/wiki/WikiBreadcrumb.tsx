import React, { useState, useLayoutEffect, useRef } from 'react';
import { WikiEntry } from '../../types';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import HoverPopup from '../ui/HoverPopup';

interface WikiBreadcrumbProps {
    history: WikiEntry[];
    wikis: WikiEntry[];
    setHistory: React.Dispatch<React.SetStateAction<WikiEntry[]>>;
}

const BreadcrumbItem: React.FC<{
    item: WikiEntry;
    isLast: boolean;
    wikis: WikiEntry[];
    history: WikiEntry[];
    setHistory: React.Dispatch<React.SetStateAction<WikiEntry[]>>;
}> = ({ item, isLast, wikis, history, setHistory }) => {
    const children = wikis.filter(w => w.parentId === item.id);
    const title = item.term;

    const handleItemClick = () => {
        const itemIndex = history.findIndex(h => h.id === item.id);
        if (itemIndex !== -1) {
            setHistory(prev => prev.slice(0, itemIndex + 1));
        }
    };
    
    const trigger = (
        <button
            onClick={handleItemClick}
            title={title} // Tooltip for truncated text
            className={`text-sm font-medium ${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            <span className="block truncate max-w-40">{title}</span>
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

const WikiBreadcrumb: React.FC<WikiBreadcrumbProps> = ({ history, wikis, setHistory }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // This effect detects if the container is overflowing and sets a flag.
    // It's designed to prevent infinite render loops by only setting state when the overflow status changes.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // The ResizeObserver will notify us of any size changes to the container.
        const observer = new ResizeObserver(() => {
            const hasOverflow = container.scrollWidth > container.clientWidth;
            // Only update state if the overflow status has actually changed.
            if (hasOverflow !== isOverflowing) {
                setIsOverflowing(hasOverflow);
            }
        });

        observer.observe(container);

        return () => observer.disconnect();
    }, [isOverflowing, history]); // Re-attach observer if history or overflow state changes.

    const handleCollapsedItemClick = (item: WikiEntry) => {
        const itemIndex = history.findIndex(h => h.id === item.id);
        if (itemIndex !== -1) {
            setHistory(prev => prev.slice(0, itemIndex + 1));
        }
    };

    // We only collapse if there are more than 2 items to avoid collapsing into just [first, ..., last].
    const shouldCollapse = isOverflowing && history.length > 2;
    const collapsedItems = shouldCollapse ? history.slice(1, -1) : [];

    return (
        <div ref={containerRef} className="flex items-center flex-nowrap gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            {!shouldCollapse ? (
                history.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <BreadcrumbItem 
                            item={item} 
                            isLast={index === history.length - 1} 
                            {...{ wikis, history, setHistory }} 
                        />
                        {index < history.length - 1 && <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                    </React.Fragment>
                ))
            ) : (
                <>
                    <BreadcrumbItem item={history[0]} isLast={false} {...{ wikis, history, setHistory }} />
                    <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    
                    <HoverPopup
                        trigger={
                            <button className="px-2 py-1 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50">
                                ...
                            </button>
                        }
                        content={
                            <div className="max-h-60 overflow-y-auto w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 p-2 animate-in fade-in zoom-in-95">
                                {collapsedItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleCollapsedItemClick(item)}
                                        className="w-full text-left block px-3 py-2 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        {item.term}
                                    </button>
                                ))}
                            </div>
                        }
                        popupClassName="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20"
                        className="relative"
                    />
                    
                    <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />

                    <BreadcrumbItem item={history[history.length - 1]} isLast={true} {...{ wikis, history, setHistory }} />
                </>
            )}
        </div>
    );
};

export default WikiBreadcrumb;