// BudNode - Individual bud representation on the tree

import type { Bud } from '@/types/models';
import { cn } from '@/lib/utils';

interface BudNodeProps {
  bud: Bud;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: () => void;
  hasSpouse?: boolean;
}

export default function BudNode({ bud, x, y, isSelected, onClick, hasSpouse }: BudNodeProps) {
  // Get initials from name
  const initials = bud.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'absolute w-[140px] transition-all duration-200 cursor-pointer group animate-grow',
        isSelected ? 'z-10' : 'z-0'
      )}
      style={{
        left: x,
        top: y,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div
        className={cn(
          'relative bg-card rounded-xl p-3 shadow-md border-2 transition-all duration-200',
          isSelected 
            ? 'border-primary shadow-lg scale-105' 
            : 'border-border/50 hover:border-primary/50 hover:shadow-lg'
        )}
      >
        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-bud text-primary-foreground'
          )}>
            {bud.avatarUrl ? (
              <img 
                src={bud.avatarUrl} 
                alt={bud.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{bud.name}</p>
            {bud.birthDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(bud.birthDate).getFullYear()}
                {bud.deathDate && ` - ${new Date(bud.deathDate).getFullYear()}`}
              </p>
            )}
          </div>
        </div>

        {/* Glow effect when selected */}
        {isSelected && (
          <div className="absolute -inset-1 bg-bud-glow/20 rounded-xl blur-md -z-10" />
        )}
      </div>

      {/* Connection dot at bottom */}
      <div className="absolute left-1/2 -bottom-2 w-3 h-3 -ml-1.5 rounded-full bg-branch border-2 border-card" />
    </div>
  );
}
