import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TextSelectionPopupProps {
  children: React.ReactNode;
  renderPopupContent: (selection: { text: string; close: () => void }) => ReactNode;
  isDisabled?: boolean;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  children,
  renderPopupContent,
  isDisabled = false,
}) => {
  const [popup, setPopup] = useState<{ top: number; left: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (isDisabled) return;

    setTimeout(() => {
        const selection = window.getSelection();
        const selectionText = selection?.toString().trim();

        if (selection && selectionText && selectionText.length > 2 && selectionText.length < 100) {
            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer.parentElement;

            if (containerRef.current && selectedNode && containerRef.current.contains(selectedNode)) {
                const rect = range.getBoundingClientRect();
                // Use viewport coordinates for a fixed-position popup.
                // getBoundingClientRect() already returns viewport-relative values,
                // so do NOT add window scroll offsets here, otherwise the popup
                // may jump far away (often to the bottom of the page).
                setPopup({
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2,
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

  const closePopup = () => setPopup(null);

  return (
    <div ref={containerRef}>
      {children}
      {popup && createPortal(
        <div
          ref={popupRef}
          onMouseUp={(e) => e.stopPropagation()}
          style={{ top: `${popup.top}px`, left: `${popup.left}px`, transform: 'translateX(-50%)' }}
          className="fixed z-50"
        >
          {renderPopupContent({ text: popup.text, close: closePopup })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TextSelectionPopup;
