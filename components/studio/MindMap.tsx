import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MindMapNode as MindMapNodeData } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import MinusIcon from '../icons/MinusIcon';
import ArrowsPointingOutIcon from '../icons/ArrowsPointingOutIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import ArrowsPointingInIcon from '../icons/ArrowsPointingInIcon';
import ViewfinderIcon from '../icons/ViewfinderIcon';


// --- Constants for Layout and Styling ---
const NODE_WIDTH = 160;
const NODE_HEIGHT = 44; // Reduced for compactness
const HORIZONTAL_SPACING = 30; // Reduced for compactness
const VERTICAL_SPACING = 4;   // Reduced for compactness
const ZOOM_SENSITIVITY = 0.005; // Increased sensitivity
const ZOOM_BUTTON_FACTOR = 1.25;

interface PositionedNode extends MindMapNodeData {
  x: number;
  y: number;
  width: number;
  height: number;
  children: PositionedNode[];
  originalChildren?: MindMapNodeData[];
  subtreeHeight: number;
}

// --- Layout Calculation ---

/**
 * Pass 1: Recursively calculates the layout for each node relative to its parent.
 * It determines the total height required for each subtree and the relative Y position of nodes.
 * The 'x' coordinate is determined by the node's depth in the tree.
 */
function calculateInitialLayout(node: MindMapNodeData, collapsedNodes: Set<string>, depth = 0): PositionedNode {
  const isCollapsed = collapsedNodes.has(node.id);
  const children = (node.children && !isCollapsed) ? node.children : [];

  const positionedChildren = children.map(child => calculateInitialLayout(child, collapsedNodes, depth + 1));

  const totalChildHeight = positionedChildren.length > 0
    ? positionedChildren.reduce((acc, child) => acc + child.subtreeHeight, 0) + (positionedChildren.length - 1) * VERTICAL_SPACING
    : 0;

  const subtreeHeight = Math.max(NODE_HEIGHT, totalChildHeight);

  // Position children vertically relative to the parent's centerline (y=0)
  let currentRelativeY = -subtreeHeight / 2;
  for (const child of positionedChildren) {
    child.y = currentRelativeY + child.subtreeHeight / 2;
    currentRelativeY += child.subtreeHeight + VERTICAL_SPACING;
  }

  const positionedNode: PositionedNode = {
    ...node,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    x: depth * (NODE_WIDTH + HORIZONTAL_SPACING), // X is absolute based on depth
    y: 0, // Y is relative to its parent, starts at 0
    children: positionedChildren,
    originalChildren: node.children,
    subtreeHeight: subtreeHeight,
  };

  // Center the parent node vertically among its children
  if (positionedChildren.length > 0) {
    const firstChildY = positionedChildren[0].y;
    const lastChildY = positionedChildren[positionedChildren.length - 1].y;
    positionedNode.y = (firstChildY + lastChildY) / 2;
  }

  return positionedNode;
}

/**
 * Pass 2: Traverses the tree and converts the relative Y coordinates to absolute ones.
 * This is done by adding the parent's absolute Y position to each child's relative Y.
 */
function applyAbsoluteYPositions(node: PositionedNode, parentAbsoluteY = 0) {
  node.y += parentAbsoluteY;
  node.children.forEach(child => {
    applyAbsoluteYPositions(child, node.y);
  });
}


// --- SVG Path Generator ---
const getPath = (source: {x: number, y: number}, target: {x: number, y: number}) => {
  const [sx, sy] = [source.x, source.y];
  const [tx, ty] = [target.x, target.y];
  const halfX = sx + (tx - sx) / 2;
  
  // A smooth, horizontal elbow curve
  return `M ${sx},${sy} C ${halfX},${sy} ${halfX},${ty} ${tx},${ty}`;
};

// --- Node Component ---
interface MindMapNodeProps {
  node: PositionedNode;
  onToggleCollapse: (nodeId: string) => void;
  isCollapsed: boolean;
  onNodeClick?: (nodeId: string) => void;
  isActive: boolean;
}
const MindMapNode: React.FC<MindMapNodeProps> = React.memo(({ node, onToggleCollapse, isCollapsed, onNodeClick, isActive }) => {
  const hasChildren = node.originalChildren && node.originalChildren.length > 0;

  return (
    <g
      className="mindmap-node-group"
      transform={`translate(${node.x}, ${node.y - node.height / 2})`}
      style={{ opacity: 1 }}
      onClick={() => onNodeClick && onNodeClick(node.id)}
    >
      <foreignObject width={node.width} height={node.height}>
          <div className="w-full h-full flex items-center justify-center p-1 cursor-pointer">
              <div className={`mindmap-node-rect w-full h-full bg-slate-200/50 dark:bg-slate-800/50 border rounded-xl shadow-sm flex items-center justify-center transition-colors ${
                  isActive ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-700'
              }`}>
                  <p className={`mindmap-text ${isActive ? 'text-indigo-700 dark:text-indigo-200 font-bold' : 'text-slate-800 dark:text-slate-100'}`}>{node.label}</p>
              </div>
          </div>
      </foreignObject>
      {hasChildren && (
        <g
          className="mindmap-expander"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          transform={`translate(${node.width}, ${node.height / 2})`}
        >
          <circle className="fill-transparent" r="16" />
          <circle className="fill-slate-50 dark:fill-slate-900" r="10" />
          <path
            className="stroke-slate-600 dark:stroke-slate-300 transition-transform duration-200"
            d={isCollapsed ? "M -4 0 L 4 0 M 0 -4 L 0 4" : "M -4 0 L 4 0"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{transformOrigin: 'center'}}
          />
        </g>
      )}
    </g>
  );
});

// --- Recursive Renderer ---
const renderGraph = (
  node: PositionedNode, 
  onToggleCollapse: (nodeId: string) => void,
  collapsedNodes: Set<string>,
  onNodeClick?: (nodeId: string) => void,
  activeNodePath?: Set<string>
): React.ReactNode[] => {
  const isCollapsed = collapsedNodes.has(node.id);
  const isActive = activeNodePath?.has(node.id) ?? false;
  let elements: React.ReactNode[] = [
    <MindMapNode
      key={node.id}
      node={node}
      onToggleCollapse={onToggleCollapse}
      isCollapsed={isCollapsed}
      onNodeClick={onNodeClick}
      isActive={isActive}
    />
  ];
  if (!isCollapsed) {
    node.children.forEach(child => {
      const isChildActive = activeNodePath?.has(child.id) ?? false;
      const isPathActive = isActive && isChildActive;
      elements.push(
        <path
          key={`${node.id}-${child.id}`}
          className={`mindmap-path transition-colors ${isPathActive ? 'text-indigo-400 dark:text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}
          stroke="currentColor"
          d={getPath(
            { x: node.x + node.width, y: node.y },
            { x: child.x, y: child.y }
          )}
        />
      );
      elements = elements.concat(renderGraph(child, onToggleCollapse, collapsedNodes, onNodeClick, activeNodePath));
    });
  }
  return elements;
};

// --- Main MindMap Component ---
interface MindMapProps { 
    data: MindMapNodeData; 
    onRegenerate: () => void; 
    isLoading: boolean;
    onNodeClick?: (nodeId: string) => void;
    activeNodePath?: Set<string>;
}

const MindMap: React.FC<MindMapProps> = ({ data, onRegenerate, isLoading, onNodeClick, activeNodePath }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });
  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  const layout = useMemo(() => {
    const treeWithRelativeY = calculateInitialLayout(data, collapsedNodes);
    applyAbsoluteYPositions(treeWithRelativeY);
    return treeWithRelativeY;
  }, [data, collapsedNodes]);

  const zoom = useCallback((factor: number, centerX: number, centerY: number) => {
    setViewBox(prev => {
      const newWidth = prev.width * factor;
      const newHeight = prev.height * factor;
      const newX = centerX - (centerX - prev.x) * factor;
      const newY = centerY - (centerY - prev.y) * factor;
      return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleWheel = (e: WheelEvent) => {
      const { clientX, clientY, deltaY, deltaX, ctrlKey } = e;

      // Pinch-to-zoom gesture (should work in both modes)
      if (ctrlKey) {
        e.preventDefault(); // Always prevent browser page zoom for this gesture
        const point = new DOMPoint(clientX, clientY);
        const ctm = svgElement.getScreenCTM();
        if (!ctm) return;
        const svgPoint = point.matrixTransform(ctm.inverse());
        
        const zoomFactor = 1 + deltaY * ZOOM_SENSITIVITY;
        zoom(zoomFactor, svgPoint.x, svgPoint.y);

      // Two-finger scroll/pan gesture
      } else { 
        // Only pan if in full-screen mode
        if (isFullScreen) {
          e.preventDefault(); // Prevent page scroll only in fullscreen
          const scale = viewBox.width / (svgRef.current?.clientWidth || 1);
          const dx = deltaX * scale * 0.5;
          const dy = deltaY * scale * 0.5;
          setViewBox(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
        // If not fullscreen, do nothing and let the browser handle the scroll
      }
    };

    svgElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svgElement.removeEventListener('wheel', handleWheel);
    };
  }, [isFullScreen, zoom, viewBox.width]);
  
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const fitToView = useCallback(() => {
      if (!layout || !svgRef.current) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const traverse = (node: PositionedNode) => {
          minX = Math.min(minX, node.x);
          minY = Math.min(minY, node.y - node.height / 2);
          maxX = Math.max(maxX, node.x + node.width);
          maxY = Math.max(maxY, node.y + node.height / 2);
          if (!collapsedNodes.has(node.id)) {
              node.children.forEach(traverse);
          }
      };
      traverse(layout);

      const padding = 100;
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      if (contentWidth > 0 && contentHeight > 0) {
        setViewBox({
            x: minX - padding,
            y: minY - padding,
            width: contentWidth + padding * 2,
            height: contentHeight + padding * 2,
        });
      }
  }, [layout, collapsedNodes]);
  
  // Ref to hold the latest fitToView function to avoid dependency issues
  const fitToViewRef = useRef(fitToView);
  useEffect(() => {
    fitToViewRef.current = fitToView;
  });

  // Call fitToView only when the map data changes or when entering/exiting fullscreen
  useEffect(() => {
    setTimeout(() => fitToViewRef.current(), 50);
  }, [data, isFullScreen]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);
  
  const toggleFullScreen = useCallback(() => {
    if (!fullScreenContainerRef.current) return;
    if (!document.fullscreenElement) {
      fullScreenContainerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current) return;
    const scale = viewBox.width / (svgRef.current?.clientWidth || 1);
    const dx = (e.clientX - lastPoint.current.x) * scale;
    const dy = (e.clientY - lastPoint.current.y) * scale;
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };
  
  const handleZoomButtonClick = (direction: 'in' | 'out') => {
    const svg = svgRef.current;
    if (!svg) return;
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const factor = direction === 'in' ? 1 / ZOOM_BUTTON_FACTOR : ZOOM_BUTTON_FACTOR;
    zoom(factor, centerX, centerY);
  };
  
  const allElements = useMemo(() => renderGraph(layout, handleToggleCollapse, collapsedNodes, onNodeClick, activeNodePath), [layout, collapsedNodes, handleToggleCollapse, onNodeClick, activeNodePath]);
  
  const containerClasses = isFullScreen
    ? "fixed inset-0 z-50 w-screen h-screen bg-slate-100 dark:bg-slate-900"
    : "relative w-full h-[70vh] bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner";

  return (
    <div ref={fullScreenContainerRef} className={containerClasses}>
      <svg
        ref={svgRef}
        className="mindmap-svg w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g>{allElements}</g>
      </svg>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <button onClick={() => handleZoomButtonClick('in')} title="Zoom In" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><PlusIcon className="w-5 h-5"/></button>
            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={() => handleZoomButtonClick('out')} title="Zoom Out" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><MinusIcon className="w-5 h-5"/></button>
            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={fitToView} title="Fit to View" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ViewfinderIcon className="w-5 h-5"/></button>
            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={toggleFullScreen} title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {isFullScreen ? <ArrowsPointingInIcon className="w-5 h-5"/> : <ArrowsPointingOutIcon className="w-5 h-5"/>}
            </button>
        </div>
        <button 
            onClick={onRegenerate} 
            disabled={isLoading}
            title="Regenerate Mind Map" 
            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading 
                ? <div className="w-5 h-5 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                : <ArrowPathIcon className="w-5 h-5"/>
            }
        </button>
      </div>
    </div>
  );
};

export default MindMap;