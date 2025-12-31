// VineConnection - Organic vine-like connections between buds

interface VineConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'spouse' | 'parent-child' | 'sibling';
}

export default function VineConnection({ fromX, fromY, toX, toY, type }: VineConnectionProps) {
  const isHorizontal = Math.abs(fromY - toY) < 20;
  
  if (type === 'spouse') {
    // Spouse connection: horizontal with heart in middle and decorative elements
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    // Create a gentle wave for the spouse connection
    const path = `M ${fromX} ${fromY} 
      C ${fromX + 20} ${fromY - 10}, ${midX - 20} ${midY - 10}, ${midX} ${midY}
      C ${midX + 20} ${midY - 10}, ${toX - 20} ${toY - 10}, ${toX} ${toY}`;
    
    return (
      <g className="animate-fade-in">
        {/* Main connection line */}
        <path
          d={path}
          fill="none"
          stroke="url(#spouseGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.9}
        />
        
        {/* Decorative dots along the path */}
        <circle cx={fromX + 15} cy={fromY - 5} r={2} fill="hsl(var(--primary))" opacity={0.6} />
        <circle cx={toX - 15} cy={toY - 5} r={2} fill="hsl(var(--primary))" opacity={0.6} />
        
        {/* Heart in the middle */}
        <g transform={`translate(${midX}, ${midY - 15})`}>
          <path
            d="M0,3 C0,0 -3,-3 -5,0 C-7,3 0,8 0,8 C0,8 7,3 5,0 C3,-3 0,0 0,3"
            fill="hsl(350 80% 60%)"
            opacity={0.9}
          />
        </g>
        
        {/* Small leaves near the heart */}
        <ellipse 
          cx={midX - 12} 
          cy={midY - 8} 
          rx={4} 
          ry={2} 
          fill="hsl(var(--bud))" 
          opacity={0.7}
          transform={`rotate(-30 ${midX - 12} ${midY - 8})`}
        />
        <ellipse 
          cx={midX + 12} 
          cy={midY - 8} 
          rx={4} 
          ry={2} 
          fill="hsl(var(--bud))" 
          opacity={0.7}
          transform={`rotate(30 ${midX + 12} ${midY - 8})`}
        />
      </g>
    );
  }
  
  if (type === 'sibling') {
    // Sibling connection: horizontal arc above
    const midX = (fromX + toX) / 2;
    const arcHeight = Math.min(40, Math.abs(toX - fromX) / 4);
    
    const path = `M ${fromX} ${fromY} 
      Q ${midX} ${fromY - arcHeight}, ${toX} ${toY}`;
    
    return (
      <g className="animate-fade-in">
        <path
          d={path}
          fill="none"
          stroke="url(#vineGradient)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.7}
        />
        {/* Small leaf nodes */}
        <circle cx={midX} cy={fromY - arcHeight + 5} r={3} fill="hsl(var(--bud))" opacity={0.8} />
      </g>
    );
  }
  
  // Parent-child connection: vertical vine with organic curves
  const isParentAbove = fromY < toY;
  const startY = isParentAbove ? fromY : toY;
  const endY = isParentAbove ? toY : fromY;
  const startX = isParentAbove ? fromX : toX;
  const endX = isParentAbove ? toX : fromX;
  
  const midY = (startY + endY) / 2;
  const curveOffset = (endX - startX) * 0.3;
  
  // Create organic vine path with slight curves
  const path = `M ${startX} ${startY + 40}
    C ${startX} ${startY + 60}, 
      ${startX + curveOffset * 0.5} ${midY - 20}, 
      ${(startX + endX) / 2} ${midY}
    C ${(startX + endX) / 2 + curveOffset * 0.5} ${midY + 20}, 
      ${endX} ${endY - 60}, 
      ${endX} ${endY - 40}`;
  
  // Calculate leaf positions along the path
  const leafPositions = [
    { x: startX + curveOffset * 0.2, y: startY + 70, rotation: -20 },
    { x: (startX + endX) / 2 - 5, y: midY - 10, rotation: 15 },
    { x: (startX + endX) / 2 + 5, y: midY + 10, rotation: -15 },
    { x: endX - curveOffset * 0.2, y: endY - 70, rotation: 20 },
  ];
  
  return (
    <g className="animate-fade-in">
      {/* Main vine stem */}
      <path
        d={path}
        fill="none"
        stroke="url(#vineGradient)"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.8}
      />
      
      {/* Decorative leaves along the vine */}
      {leafPositions.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={5}
          ry={3}
          fill="hsl(var(--bud))"
          opacity={0.5 + i * 0.1}
          transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}
        />
      ))}
      
      {/* Small circles at connection points */}
      <circle cx={startX} cy={startY + 40} r={3} fill="hsl(var(--branch))" opacity={0.8} />
      <circle cx={endX} cy={endY - 40} r={3} fill="hsl(var(--branch))" opacity={0.8} />
    </g>
  );
}
