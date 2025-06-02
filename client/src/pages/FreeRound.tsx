import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/contexts/GameContext';
import { useSocket } from '@/hooks/useSocket';
import { DragDropZone } from '@/components/DragDropZone';

export default function FreeRound() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { on, emit } = useSocket(state.roomCode || undefined);

  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [playersReady, setPlayersReady] = useState<string[]>([]);

  useEffect(() => {
    if (!state.roomCode || state.status !== 'FREE_ROUND') {
      setLocation('/game');
      return;
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Socket event listeners
    const unsubscribers = [
      on('situation:moved', (data: any) => {
        dispatch({
          type: 'UPDATE_SITUATION_POSITION',
          payload: { id: data.situationId, position: data.position }
        });
      }),

      on('player:ready', (data: any) => {
        setPlayersReady(prev => {
          if (!prev.includes(data.playerId)) {
            return [...prev, data.playerId];
          }
          return prev;
        });
      }),

      on('results:ready', () => {
        dispatch({ type: 'SET_STATUS', payload: 'SHOW_RESULTS' });
        setLocation('/results');
      }),

      on('drag:move:update', (data: any) => {
        emit('mouse:move', { x: data.x, y: data.y, playerId: state.playerId });
      }),
    ];

    return () => {
      clearInterval(timer);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [state.roomCode, state.status]);

  const handlePositionUpdate = async (situationId: string, position: number) => {
    try {
      await apiRequest('PUT', `/api/situations/${situationId}/position`, {
        position,
        roomCode: state.roomCode,
      });

      emit('drag:move', {
        elementId: situationId,
        x: position,
        y: 0,
        playerId: state.playerId,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update position",
        variant: "destructive",
      });
    }
  };

  const markPlayerReady = () => {
    if (!playersReady.includes(state.playerId!)) {
      setPlayersReady(prev => [...prev, state.playerId!]);
      emit('player:ready', { playerId: state.playerId });
    }
  };

  const showResults = async () => {
    try {
      await apiRequest('POST', `/api/games/${state.roomCode}/results`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to show results",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const allPlayersReady = playersReady.length === state.players.length;
  const isPlayerReady = playersReady.includes(state.playerId!);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-white">Free-Hand Round</h1>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
                <span className="text-yellow-400 font-medium">Collaborative Phase</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white/70">
                <i className="fas fa-clock mr-2"></i>
                <span className="font-mono">{formatTime(timeRemaining)}</span> remaining
              </div>
              <div className="text-white/70">
                <span>{playersReady.length}</span> of <span>{state.players.length}</span> ready
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <Card className="bg-yellow-500/10 border-yellow-500/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="bg-yellow-500/20 p-2 rounded-lg mr-4">
                <i className="fas fa-info text-yellow-400"></i>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-400 mb-2">Collaborative Adjustment Phase</h3>
                <p className="text-slate-300">
                  Now everyone can move their own situation to better fit the sequence. Work together to create the most logical order!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Sequence Area */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-hands"></i>
                <span>Adjust the Sequence</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <span>0 (Low)</span>
                <div className="w-16 h-px bg-gradient-to-r from-green-400 to-red-400"></div>
                <span>100 (High)</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropZone
              situations={state.situations}
              onPositionUpdate={handlePositionUpdate}
              currentPlayerId={state.playerId}
              canEdit={true}
              isFreeRound={true}
            />

            {/* Player status */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center space-x-4">
                {state.players.map((player) => {
                  const isReady = playersReady.includes(player.id);
                  return (
                    <div key={player.id} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: player.color }}
                      ></div>
                      <span className="text-sm text-white">{player.name}</span>
                      {isReady ? (
                        <i className="fas fa-check text-green-400 ml-2"></i>
                      ) : (
                        <i className="fas fa-hourglass-half text-yellow-400 ml-2"></i>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center space-x-4">
                {!isPlayerReady && (
                  <Button
                    onClick={markPlayerReady}
                    className="bg-green-500 hover:bg-green-500/90"
                  >
                    <i className="fas fa-check mr-2"></i>
                    I'm Ready
                  </Button>
                )}
                
                {(state.isHost && allPlayersReady) || timeRemaining === 0 ? (
                  <Button
                    onClick={showResults}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <i className="fas fa-trophy mr-2"></i>
                    Show Results
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-white border-white/20">
                    Waiting for all players...
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center space-x-2">
              <i className="fas fa-broadcast-tower"></i>
              <span>Live Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm max-h-24 overflow-y-auto">
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Players are actively positioning their situations...</span>
                <span className="text-xs">Live</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
