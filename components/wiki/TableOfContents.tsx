import React, { useMemo } from 'react';

interface Heading {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
}

const slugify = (text: string) => {
    // Must be identical to the one in MarkdownRenderer
    return (text || '') // Fix: Guard against null/undefined input
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') 
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
    const headings = useMemo<Heading[]>(() => {
        if(!content) return [];
        const headingRegex = /^(##|###)\s(.+)/gm;
        const matches = Array.from(content.matchAll(headingRegex));
        return matches.map(match => {
            const level = match[1].length;
            const text = match[2].trim();
            const slug = slugify(text);
            return { level, text, slug };
        });
    }, [content]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
        e.preventDefault();
        document.getElementById(slug)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    if (headings.length < 2) {
        return null; // Don't show ToC for articles with 0 or 1 heading
    }

    return (
        <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">On this page</h3>
            <ul className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700">
                {headings.map(({ level, text, slug }) => (
                    <li key={slug}>
                        <a 
                            href={`#${slug}`}
                            onClick={(e) => handleLinkClick(e, slug)}
                            className="block text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors py-1 pl-4"
                            style={{ paddingLeft: `${(level - 2) * 1 + 1}rem` }}
                        >
                            {text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TableOfContents;