interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: player.color }}
        >
          <span>{player.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-white font-medium">{player.name}</p>
          <p className="text-white/60 text-sm flex items-center">
            {player.isHost && <i className="fas fa-crown text-yellow-400 mr-1"></i>}
            {player.isHost ? 'Host' : 'Player'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        <span className="text-white/60 text-sm">Online</span>
      </div>
    </div>
  );
}
