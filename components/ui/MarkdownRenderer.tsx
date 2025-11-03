import React, { useMemo } from 'react';

// Ensure marked is available on the window
declare global {
  interface Window {
    marked: {
      parse: (markdown: string, options?: any) => string;
    };
  }
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!window.marked) return '';
    
    // Use the default parser without any custom renderers
    const parsedContent = window.marked.parse(content || '');
    return parsedContent;

  }, [content]);
  
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;