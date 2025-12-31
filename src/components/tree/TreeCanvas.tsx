// Tree Canvas - Infinite canvas with auto-layout tree visualization

import { useMemo, useRef, useState, useEffect } from 'react';
import type { Bud, BudConnection } from '@/types/models';
import BudNode from './BudNode';
import VineConnection from './VineConnection';

interface TreeCanvasProps {
  buds: Bud[];
  connections: BudConnection[];
  onBudClick: (budId: string) => void;
  selectedBudId: string | null;
}

interface LayoutNode {
  bud: Bud;
  x: number;
  y: number;
  level: number;
  isSpouse?: boolean;
  spouseId?: string;
}

export default function TreeCanvas({ buds, connections, onBudClick, selectedBudId }: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Track space key for Figma-style panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsDragging(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Build spouse pairs map
  const spousePairs = useMemo(() => {
    const pairs = new Map<string, string>();
    connections.forEach(conn => {
      if (conn.relationshipType === 'spouse') {
        pairs.set(conn.fromBudId, conn.toBudId);
        pairs.set(conn.toBudId, conn.fromBudId);
      }
    });
    return pairs;
  }, [connections]);

  // Auto-layout calculation using hierarchical tree layout with spouse handling
  const layoutNodes = useMemo(() => {
    if (buds.length === 0) return [];

    // Build adjacency maps
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string[]>();
    
    connections.forEach(conn => {
      if (conn.relationshipType === 'parent') {
        // fromBud is parent of toBud
        if (!childrenMap.has(conn.fromBudId)) {
          childrenMap.set(conn.fromBudId, []);
        }
        childrenMap.get(conn.fromBudId)!.push(conn.toBudId);
        
        if (!parentMap.has(conn.toBudId)) {
          parentMap.set(conn.toBudId, []);
        }
        parentMap.get(conn.toBudId)!.push(conn.fromBudId);
      } else if (conn.relationshipType === 'child') {
        // fromBud is child of toBud
        if (!childrenMap.has(conn.toBudId)) {
          childrenMap.set(conn.toBudId, []);
        }
        childrenMap.get(conn.toBudId)!.push(conn.fromBudId);
        
        if (!parentMap.has(conn.fromBudId)) {
          parentMap.set(conn.fromBudId, []);
        }
        parentMap.get(conn.fromBudId)!.push(conn.toBudId);
      }
    });

    // Find root nodes (no parents, excluding spouses of roots)
    const roots = buds.filter(bud => {
      const parents = parentMap.get(bud.id) || [];
      return parents.length === 0;
    });
    
    // If no clear roots, use first bud
    if (roots.length === 0 && buds.length > 0) {
      roots.push(buds[0]);
    }

    // Layout constants
    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 80;
    const HORIZONTAL_SPACING = 40;
    const VERTICAL_SPACING = 120;
    const SPOUSE_GAP = 30; // Smaller gap between spouses

    const layoutResult: LayoutNode[] = [];
    const positioned = new Set<string>();

    // BFS layout from roots
    function layoutSubtree(nodeId: string, level: number, xOffset: number): number {
      const bud = buds.find(b => b.id === nodeId);
      if (!bud || positioned.has(nodeId)) return xOffset;
      
      positioned.add(nodeId);
      
      // Check for spouse
      const spouseId = spousePairs.get(nodeId);
      const spouse = spouseId ? buds.find(b => b.id === spouseId) : null;
      const hasUnpositionedSpouse = spouse && !positioned.has(spouseId);
      
      // Get all children (from this node and spouse)
      let allChildren: string[] = [...(childrenMap.get(nodeId) || [])];
      if (spouseId) {
        const spouseChildren = childrenMap.get(spouseId) || [];
        spouseChildren.forEach(childId => {
          if (!allChildren.includes(childId)) {
            allChildren.push(childId);
          }
        });
      }
      
      const unpositionedChildren = allChildren.filter(id => !positioned.has(id));
      
      if (unpositionedChildren.length === 0) {
        // Leaf node (with possible spouse)
        if (hasUnpositionedSpouse) {
          positioned.add(spouseId);
          layoutResult.push({
            bud,
            x: xOffset,
            y: level * (NODE_HEIGHT + VERTICAL_SPACING),
            level,
            isSpouse: true,
            spouseId,
          });
          layoutResult.push({
            bud: spouse,
            x: xOffset + NODE_WIDTH + SPOUSE_GAP,
            y: level * (NODE_HEIGHT + VERTICAL_SPACING),
            level,
            isSpouse: true,
            spouseId: nodeId,
          });
          return xOffset + (NODE_WIDTH * 2) + SPOUSE_GAP + HORIZONTAL_SPACING;
        } else {
          layoutResult.push({
            bud,
            x: xOffset,
            y: level * (NODE_HEIGHT + VERTICAL_SPACING),
            level,
          });
          return xOffset + NODE_WIDTH + HORIZONTAL_SPACING;
        }
      }
      
      // Layout children first
      let currentX = xOffset;
      const childXPositions: number[] = [];
      
      unpositionedChildren.forEach(childId => {
        const startX = currentX;
        currentX = layoutSubtree(childId, level + 1, currentX);
        const childNode = layoutResult.find(n => n.bud.id === childId);
        if (childNode) {
          childXPositions.push(childNode.x);
        }
      });
      
      // Position parent (and spouse) centered above children
      const minChildX = Math.min(...childXPositions);
      const maxChildX = Math.max(...childXPositions);
      
      if (hasUnpositionedSpouse) {
        positioned.add(spouseId);
        // Center the spouse pair above children
        const pairWidth = (NODE_WIDTH * 2) + SPOUSE_GAP;
        const centerX = (minChildX + maxChildX + NODE_WIDTH) / 2;
        const pairStartX = centerX - pairWidth / 2;
        
        layoutResult.push({
          bud,
          x: pairStartX,
          y: level * (NODE_HEIGHT + VERTICAL_SPACING),
          level,
          isSpouse: true,
          spouseId,
        });
        layoutResult.push({
          bud: spouse,
          x: pairStartX + NODE_WIDTH + SPOUSE_GAP,
          y: level * (NODE_HEIGHT + VERTICAL_SPACING),
          level,
          isSpouse: true,
          spouseId: nodeId,
        });
      } else {
        const parentX = (minChildX + maxChildX) / 2;
        layoutResult.push({
          bud,
          x: parentX,
          y: level * (NODE_HEIGHT + VERTICAL_SPACING),
          level,
        });
      }
      
      return currentX;
    }

    // Layout from each root
    let currentX = 0;
    roots.forEach(root => {
      currentX = layoutSubtree(root.id, 0, currentX);
      currentX += HORIZONTAL_SPACING * 2; // Extra spacing between trees
    });

    // Add any unpositioned buds (disconnected)
    buds.forEach(bud => {
      if (!positioned.has(bud.id)) {
        layoutResult.push({
          bud,
          x: currentX,
          y: 0,
          level: 0,
        });
        currentX += NODE_WIDTH + HORIZONTAL_SPACING;
      }
    });

    return layoutResult;
  }, [buds, connections, spousePairs]);

  // Center the view on initial load
  useEffect(() => {
    if (layoutNodes.length > 0 && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const minX = Math.min(...layoutNodes.map(n => n.x));
      const maxX = Math.max(...layoutNodes.map(n => n.x)) + 140;
      const minY = Math.min(...layoutNodes.map(n => n.y));
      const maxY = Math.max(...layoutNodes.map(n => n.y)) + 80;
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const centerX = (containerRect.width - contentWidth) / 2 - minX;
      const centerY = (containerRect.height - contentHeight) / 2 - minY + 40;
      
      setOffset({ x: centerX, y: centerY });
    }
  }, [layoutNodes.length]);

  // Mouse event handlers for panning (only when space is pressed or touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (!spacePressed) return; // Only pan when space is pressed
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile (always pan on touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel handler for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.3), 2);
    setScale(newScale);
  };

  // Build connection visuals with vine styles
  const vineConnections = useMemo(() => {
    const result: Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      type: 'spouse' | 'parent-child' | 'sibling';
    }> = [];

    connections.forEach(conn => {
      const fromNode = layoutNodes.find(n => n.bud.id === conn.fromBudId);
      const toNode = layoutNodes.find(n => n.bud.id === conn.toBudId);
      
      if (!fromNode || !toNode) return;
      
      const fromX = fromNode.x + 70; // Center of node
      const fromY = fromNode.y + 40;
      const toX = toNode.x + 70;
      const toY = toNode.y + 40;
      
      let type: 'spouse' | 'parent-child' | 'sibling' = 'parent-child';
      if (conn.relationshipType === 'spouse') {
        type = 'spouse';
      } else if (conn.relationshipType === 'sibling') {
        type = 'sibling';
      }

      result.push({
        id: conn.id,
        fromX,
        fromY,
        toX,
        toY,
        type,
      });
    });

    return result;
  }, [connections, layoutNodes]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full transition-cursor ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Hint for space+drag */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 z-10">
        Hold <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono mx-1">Space</kbd> + drag to pan
      </div>

      <div
        className="relative"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection vines SVG */}
        <svg
          className="absolute pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Gradient for vines */}
            <linearGradient id="vineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--branch))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--bud))" stopOpacity="0.6" />
            </linearGradient>
            {/* Heart gradient for spouse connection */}
            <linearGradient id="spouseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="50%" stopColor="hsl(350 80% 60%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {vineConnections.map(conn => (
            <VineConnection
              key={conn.id}
              fromX={conn.fromX}
              fromY={conn.fromY}
              toX={conn.toX}
              toY={conn.toY}
              type={conn.type}
            />
          ))}
        </svg>

        {/* Bud nodes */}
        {layoutNodes.map(node => (
          <BudNode
            key={node.bud.id}
            bud={node.bud}
            x={node.x}
            y={node.y}
            isSelected={node.bud.id === selectedBudId}
            onClick={() => onBudClick(node.bud.id)}
            hasSpouse={!!node.spouseId}
          />
        ))}
      </div>
    </div>
  );
}
