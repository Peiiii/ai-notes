
import React, { useState, useRef, useEffect, useLayoutEffect, ReactElement, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ClickPopoverProps {
  children: (props: { onClick: () => void; 'aria-expanded': boolean; ref: React.RefObject<any> }) => ReactElement;
  content: ReactElement | ((helpers: { close: () => void }) => ReactElement);
  className?: string;
}

const ClickPopover: React.FC<ClickPopoverProps> = ({ children, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const margin = 8;

    let top, left;

    // Default position: above the trigger
    top = triggerRect.top - popoverRect.height - margin;
    
    // If not enough space above, position below
    if (top < margin) {
      top = triggerRect.bottom + margin;
    }

    // Center horizontally
    left = triggerRect.left + (triggerRect.width / 2) - (popoverRect.width / 2);

    // Clamp to viewport edges horizontally
    left = Math.max(margin, left);
    left = Math.min(left, window.innerWidth - popoverRect.width - margin);

    setPosition({ top, left });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      // Position immediately
      updatePosition();
      // Add listeners for dynamic adjustments
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      {children({ onClick: handleTriggerClick, 'aria-expanded': isOpen, ref: triggerRef })}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          {typeof content === 'function' ? content({ close: () => setIsOpen(false) }) : content}
        </div>,
        document.body
      )}
    </>
  );
};

export default ClickPopover;