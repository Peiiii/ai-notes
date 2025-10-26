
import React, { useState, useRef, useCallback, useEffect } from 'react';
import BookOpenIcon from '../icons/BookOpenIcon';
import ThoughtBubbleIcon from '../icons/ThoughtBubbleIcon';

interface TextSelectionPopupProps {
  children: React.ReactNode;
  onExplore: (text: string) => void;
  onSuggest: (text: string) => void;
  isDisabled?: boolean;
  isLoadingExplore?: boolean;
  isLoadingSuggest?: boolean;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  children,
  onExplore,
  onSuggest,
  isDisabled = false,
  isLoadingExplore = false,
  isLoadingSuggest = false,
}) => {
  const [popup, setPopup] = useState<{ top: number; left: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (isDisabled) return;

    // A small delay to allow other click events to fire (like closing other popups)
    setTimeout(() => {
        const selection = window.getSelection();
        const selectionText = selection?.toString().trim();

        if (selection && selectionText && selectionText.length > 2 && selectionText.length < 100) {
            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer.parentElement;

            if (containerRef.current && selectedNode && containerRef.current.contains(selectedNode)) {
                const rect = range.getBoundingClientRect();
                setPopup({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX + rect.width / 2,
                    text: selectionText,
                });
            } else {
                setPopup(null);
            }
        } else {
            setPopup(null);
        }
    }, 10);
  }, [isDisabled]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Check if the click is on a new selection to avoid immediate closing
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
            setPopup(null);
        }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleMouseUp, handleClickOutside]);

  const handleExplore = () => {
    if (popup) {
      onExplore(popup.text);
      setPopup(null);
    }
  };

  const handleSuggest = () => {
    if (popup) {
      onSuggest(popup.text);
      setPopup(null);
    }
  };

  return (
    <div ref={containerRef}>
      {children}
      {popup && (
        <div
          ref={popupRef}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ top: `${popup.top}px`, left: `${popup.left}px`, transform: 'translateX(-50%)' }}
          className="fixed z-10 animate-in fade-in zoom-in-95 duration-150 flex items-center bg-slate-800 rounded-lg shadow-lg"
        >
          <button onClick={handleExplore} disabled={isDisabled} className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-l-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
            {isLoadingExplore ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <BookOpenIcon className="w-4 h-4" />}
            Explore
          </button>
          <div className="w-px h-4 bg-slate-600"></div>
          <button onClick={handleSuggest} disabled={isDisabled} className="flex items-center gap-2 text-sm px-3 py-1.5 text-white hover:bg-slate-700 rounded-r-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
            {isLoadingSuggest ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <ThoughtBubbleIcon className="w-4 h-4" />}
            Suggest Topics
          </button>
        </div>
      )}
    </div>
  );
};

export default TextSelectionPopup;
