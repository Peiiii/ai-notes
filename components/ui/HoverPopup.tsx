
import React, { useState, useRef, ReactElement } from 'react';

interface HoverPopupProps {
  trigger: ReactElement;
  content: ReactElement;
  showDelay?: number;
  hideDelay?: number;
  className?: string;
  popupClassName?: string;
}

const HoverPopup: React.FC<HoverPopupProps> = ({
  trigger,
  content,
  showDelay = 50,
  hideDelay = 200,
  className = 'relative',
  popupClassName = 'absolute top-full right-0 mt-2',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    if (!isOpen) {
      showTimeout.current = window.setTimeout(() => {
        setIsOpen(true);
      }, showDelay);
    }
  };

  const handleMouseLeave = () => {
    if (showTimeout.current) {
      clearTimeout(showTimeout.current);
      showTimeout.current = null;
    }
    hideTimeout.current = window.setTimeout(() => {
      setIsOpen(false);
    }, hideDelay);
  };

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      {isOpen && (
        <div className={popupClassName}>
          {content}
        </div>
      )}
    </div>
  );
};

export default HoverPopup;
