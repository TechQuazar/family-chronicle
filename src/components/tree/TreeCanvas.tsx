// Tree Canvas - Infinite canvas with auto-layout tree visualization

import { useMemo, useRef, useState, useEffect } from 'react';
import type { Bud, BudConnection } from '@/types/models';
import BudNode from './BudNode';

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
}

export default function TreeCanvas({ buds, connections, onBudClick, selectedBudId }: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto-layout calculation using hierarchical tree layout
  const layoutNodes = useMemo(() => {
    if (buds.length === 0) return [];

    // Build adjacency map
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    connections.forEach(conn => {
      if (conn.relationshipType === 'parent') {
        // fromBud is parent of toBud
        if (!childrenMap.has(conn.fromBudId)) {
          childrenMap.set(conn.fromBudId, []);
        }
        childrenMap.get(conn.fromBudId)!.push(conn.toBudId);
        parentMap.set(conn.toBudId, conn.fromBudId);
      } else if (conn.relationshipType === 'child') {
        // fromBud is child of toBud
        if (!childrenMap.has(conn.toBudId)) {
          childrenMap.set(conn.toBudId, []);
        }
        childrenMap.get(conn.toBudId)!.push(conn.fromBudId);
        parentMap.set(conn.fromBudId, conn.toBudId);
      }
    });

    // Find root nodes (no parents)
    const roots = buds.filter(bud => !parentMap.has(bud.id));
    
    // If no clear roots, use first bud
    if (roots.length === 0 && buds.length > 0) {
      roots.push(buds[0]);
    }

    // Layout constants
    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 80;
    const HORIZONTAL_SPACING = 40;
    const VERTICAL_SPACING = 100;

    const layoutResult: LayoutNode[] = [];
    const positioned = new Set<string>();

    // BFS layout from roots
    function layoutSubtree(nodeId: string, level: number, xOffset: number): number {
      const bud = buds.find(b => b.id === nodeId);
      if (!bud || positioned.has(nodeId)) return xOffset;
      
      positioned.add(nodeId);
      
      const children = childrenMap.get(nodeId) || [];
      const unpositionedChildren = children.filter(id => !positioned.has(id));
      
      if (unpositionedChildren.length === 0) {
        // Leaf node
        layoutResult.push({
          bud,
          x: xOffset,
          y: level * (NODE_HEIGHT + VERTICAL_SPACING),
          level,
        });
        return xOffset + NODE_WIDTH + HORIZONTAL_SPACING;
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
      
      // Position parent centered above children
      const minChildX = Math.min(...childXPositions);
      const maxChildX = Math.max(...childXPositions);
      const parentX = (minChildX + maxChildX) / 2;
      
      layoutResult.push({
        bud,
        x: parentX,
        y: level * (NODE_HEIGHT + VERTICAL_SPACING),
        level,
      });
      
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
  }, [buds, connections]);

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

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
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

  // Touch event handlers for mobile
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

  // Get connection lines
  const connectionLines = useMemo(() => {
    return connections.map(conn => {
      const fromNode = layoutNodes.find(n => n.bud.id === conn.fromBudId);
      const toNode = layoutNodes.find(n => n.bud.id === conn.toBudId);
      
      if (!fromNode || !toNode) return null;
      
      const fromX = fromNode.x + 70; // Center of node
      const fromY = fromNode.y + 40;
      const toX = toNode.x + 70;
      const toY = toNode.y + 40;
      
      // Create a curved path
      const midY = (fromY + toY) / 2;
      const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
      
      return (
        <path
          key={conn.id}
          d={path}
          fill="none"
          stroke="hsl(var(--connection))"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.6}
        />
      );
    }).filter(Boolean);
  }, [connections, layoutNodes]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div
        className="relative"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection lines SVG */}
        <svg
          className="absolute pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {connectionLines}
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
          />
        ))}
      </div>
    </div>
  );
}
