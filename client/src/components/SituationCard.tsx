import { useState } from 'react';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

interface SituationWithPlayer {
  id: string;
  content: string;
  number: number;
  position: number;
  playerId: string;
  player: {
    id: string;
    name: string;
    color: string;
    isHost: boolean;
  };
}

interface SituationCardProps {
  situation: SituationWithPlayer;
  onPositionUpdate?: (id: string, position: number) => void;
  canEdit: boolean;
  isOwned: boolean;
  isFreeRound?: boolean;
}

export function SituationCard({ 
  situation, 
  onPositionUpdate, 
  canEdit, 
  isOwned,
  isFreeRound = false 
}: SituationCardProps) {
  const { handleDragStart, handleDragEnd } = useDragAndDrop();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStartEvent = (e: React.DragEvent) => {
    if (!canEdit || (!isOwned && !isFreeRound)) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', situation.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag image
    const dragElement = e.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2);
    
    setIsDragging(true);
    handleDragStart({
      id: situation.id,
      type: 'situation',
      data: situation,
    });
  };

  const handleDragEndEvent = () => {
    setIsDragging(false);
    handleDragEnd();
  };

  const canDrag = canEdit && (isOwned || isFreeRound);

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStartEvent}
      onDragEnd={handleDragEndEvent}
      className={`
        p-4 rounded-xl border shadow-lg transition-all duration-200
        ${isDragging ? 'dragging' : ''}
        ${canDrag ? 'cursor-move hover:shadow-xl' : 'cursor-default'}
        ${isOwned 
          ? 'bg-primary/20 border-primary/50 hover:border-primary' 
          : 'bg-white/20 border-white/30 hover:border-white/50'
        }
      `}
      style={{ minWidth: '200px' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: situation.player.color }}
            >
              {situation.player.name.charAt(0).toUpperCase()}
            </div>
            <span className={`font-medium text-sm ${isOwned ? 'text-primary' : 'text-white'}`}>
              {situation.player.name}
              {isOwned && ' (You)'}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${isOwned ? 'text-primary/90' : 'text-white/90'}`}>
            {situation.content}
          </p>
          <div className="mt-2 text-right">
            <span className={`text-xs ${isOwned ? 'text-primary/70' : 'text-white/60'}`}>
              Position: {situation.position}
            </span>
          </div>
        </div>
        {canDrag && (
          <div className="flex flex-col items-center space-y-1 ml-4">
            <i className={`fas fa-grip-vertical text-sm ${isOwned ? 'text-primary/50' : 'text-white/50'}`}></i>
          </div>
        )}
      </div>
    </div>
  );
}
