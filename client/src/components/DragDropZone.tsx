import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { SituationCard } from './SituationCard';

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

interface DragDropZoneProps {
  situations: SituationWithPlayer[];
  onPositionUpdate: (id: string, position: number) => void;
  currentPlayerId: string | null;
  canEdit: boolean;
  isFreeRound?: boolean;
}

export function DragDropZone({ 
  situations, 
  onPositionUpdate, 
  currentPlayerId, 
  canEdit,
  isFreeRound = false 
}: DragDropZoneProps) {
  const { calculatePosition, isDragging } = useDragAndDrop();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const situationId = e.dataTransfer.getData('text/plain');
    
    if (!situationId) return;

    const dropZone = e.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const position = calculatePosition(e.clientX, rect);
    
    onPositionUpdate(situationId, position);
  };

  // Sort situations by position for display
  const sortedSituations = [...situations].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Scale Indicators */}
      <div className="flex justify-between text-xs text-slate-400 px-2">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      
      {/* Drop Zone */}
      <div 
        className={`
          relative min-h-32 border-2 border-dashed rounded-xl p-4 transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-slate-600 bg-slate-800/30'
          }
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Position indicators */}
        <div className="absolute top-0 left-0 w-full h-full flex">
          <div className="flex-1 border-r border-slate-700/50"></div>
          <div className="flex-1 border-r border-slate-700/50"></div>
          <div className="flex-1 border-r border-slate-700/50"></div>
          <div className="flex-1"></div>
        </div>

        {/* Situation Cards */}
        {sortedSituations.length > 0 ? (
          <div className="relative z-10 min-h-24">
            {sortedSituations.map((situation, index) => (
              <div
                key={situation.id}
                className="absolute transition-all duration-200"
                style={{ 
                  left: `${Math.min(Math.max(situation.position, 5), 85)}%`,
                  transform: 'translateX(-50%)',
                  top: `${Math.floor(index / 3) * 120}px`
                }}
              >
                <SituationCard
                  situation={situation}
                  onPositionUpdate={onPositionUpdate}
                  canEdit={canEdit}
                  isOwned={situation.playerId === currentPlayerId}
                  isFreeRound={isFreeRound}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
            <div className="text-center">
              <i className="fas fa-mouse-pointer text-2xl mb-2 opacity-50"></i>
              <p>Situations will appear here once players submit them</p>
              <p className="text-xs mt-1">You can drag your own situation to reposition it</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Position Feedback */}
      <div className="flex justify-between items-center px-2">
        <div className="text-slate-400 text-xs">Lower values / Less intense</div>
        <div className="text-slate-400 text-xs">Higher values / More intense</div>
      </div>
    </div>
  );
}
