import React from 'react';

// Ensure marked is available on the window
declare global {
  interface Window {
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const htmlContent = window.marked.parse(content || '');
  
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;
