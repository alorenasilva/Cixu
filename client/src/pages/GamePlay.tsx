import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/contexts/GameContext';
import { useSocket } from '@/hooks/useSocket';
import { DragDropZone } from '@/components/DragDropZone';

export default function GamePlay() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { on, emit } = useSocket(state.roomCode || undefined);

  const [situationText, setSituationText] = useState('');
  const [secretNumber] = useState(() => Math.floor(Math.random() * 101));
  const [hasSubmittedSituation, setHasSubmittedSituation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!state.roomCode || state.status !== 'IN_PROGRESS') {
      setLocation('/lobby');
      return;
    }

    // Socket event listeners
    const unsubscribers = [
      on('situation:created', (data: any) => {
        dispatch({ type: 'ADD_SITUATION', payload: data.situation });
      }),

      on('situation:moved', (data: any) => {
        dispatch({
          type: 'UPDATE_SITUATION_POSITION',
          payload: { id: data.situationId, position: data.position }
        });
      }),

      on('free_round:started', () => {
        dispatch({ type: 'SET_STATUS', payload: 'FREE_ROUND' });
        setLocation('/free-round');
      }),

      on('drag:move:update', (data: any) => {
        emit('mouse:move', { x: data.x, y: data.y, playerId: state.playerId });
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [state.roomCode, state.status]);

  const submitSituation = async () => {
    if (!situationText.trim()) {
      toast({
        title: "Error",
        description: "Please write a situation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', `/api/games/${state.roomCode}/situations`, {
        content: situationText.trim(),
        position: secretNumber, // Initial position based on secret number
        playerId: state.playerId,
      });

      setHasSubmittedSituation(true);
      toast({
        title: "Success",
        description: "Situation submitted! Now position it in the sequence.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit situation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const startFreeRound = async () => {
    try {
      await apiRequest('POST', `/api/games/${state.roomCode}/free-round`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start free round",
        variant: "destructive",
      });
    }
  };

  const allPlayersSubmitted = state.situations.length === state.players.length;
  const myPlayer = state.players.find(p => p.id === state.playerId);
  const mySituation = state.situations.find(s => s.playerId === state.playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Game Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-white">
                Round {state.currentRound?.roundNumber || 1}
              </h1>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
                <span className="text-primary font-medium">In Progress</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white/70">
                <span>{state.situations.length}</span> of <span>{state.players.length}</span> submitted
              </div>
              
              {/* Players Status */}
              <div className="flex items-center space-x-2">
                {state.players.map((player) => {
                  const hasSubmitted = state.situations.some(s => s.playerId === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`w-3 h-3 rounded-full ${
                        hasSubmitted ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{ backgroundColor: player.color }}
                      title={`${player.name} - ${hasSubmitted ? 'Submitted' : 'Writing...'}`}
                    ></div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Prompt */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Current Prompt</h2>
            <p className="text-xl text-slate-300">{state.currentPrompt?.text}</p>
          </CardContent>
        </Card>

        {/* Player's Secret Number */}
        {!hasSubmittedSituation && (
          <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-primary mb-2">Your Secret Number</h3>
                  <div className="bg-primary text-white font-bold text-4xl rounded-xl px-6 py-4 inline-block mb-2">
                    {secretNumber}
                  </div>
                  <p className="text-sm text-slate-400">Create a situation that matches this number (0-100 scale)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Situation Input */}
        {!hasSubmittedSituation && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Create Your Situation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={situationText}
                onChange={(e) => setSituationText(e.target.value)}
                placeholder="Write a situation that represents your number..."
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 resize-none h-24"
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">
                  Think about where this fits on the 0-100 scale
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-400">
                    {situationText.length}/200
                  </span>
                  <Button
                    onClick={submitSituation}
                    disabled={isLoading || !situationText.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      'Add to Sequence'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drag and Drop Sequence Area */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-sort"></i>
                <span>Situation Sequence</span>
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
              canEdit={hasSubmittedSituation}
            />

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-slate-400">
                {state.situations.length} of {state.players.length} players have positioned their situations
              </div>
              
              {state.isHost && allPlayersSubmitted && (
                <Button
                  onClick={startFreeRound}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <i className="fas fa-hands mr-2"></i>
                  Start Free Round
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
