import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/contexts/GameContext';
import { useSocket } from '@/hooks/useSocket';
import { SituationCard } from '@/components/SituationCard';

interface ResultsData {
  playerOrder: any[];
  actualOrder: any[];
  accuracy: number;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { on } = useSocket(state.roomCode || undefined);

  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!state.roomCode || state.status !== 'SHOW_RESULTS') {
      setLocation('/game');
      return;
    }

    // Load results
    loadResults();

    // Socket event listeners
    const unsubscribers = [
      on('next_round:started', (data: any) => {
        dispatch({
          type: 'SET_CURRENT_ROUND',
          payload: { round: data.round, prompt: data.prompt }
        });
        dispatch({ type: 'SET_STATUS', payload: 'IN_PROGRESS' });
        setLocation('/game');
      }),

      on('game:completed', () => {
        dispatch({ type: 'SET_STATUS', payload: 'COMPLETED' });
        toast({
          title: "Game Complete!",
          description: "All rounds have been completed",
        });
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [state.roomCode, state.status]);

  const loadResults = async () => {
    try {
      const response = await apiRequest('GET', `/api/games/${state.roomCode}`);
      const gameData = await response.json();
      
      if (gameData.situations.length > 0) {
        const playerOrder = [...gameData.situations].sort((a, b) => a.position - b.position);
        const actualOrder = [...gameData.situations].sort((a, b) => a.number - b.number);
        const accuracy = calculateAccuracy(playerOrder, actualOrder);
        
        setResults({ playerOrder, actualOrder, accuracy });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load results",
        variant: "destructive",
      });
    }
  };

  const calculateAccuracy = (playerOrder: any[], actualOrder: any[]): number => {
    let correctPositions = 0;
    
    for (let i = 0; i < playerOrder.length; i++) {
      if (playerOrder[i].id === actualOrder[i].id) {
        correctPositions++;
      }
    }
    
    return Math.round((correctPositions / playerOrder.length) * 100);
  };

  const nextRound = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/games/${state.roomCode}/next-round`);
      const data = await response.json();
      
      if (data.completed) {
        dispatch({ type: 'SET_STATUS', payload: 'COMPLETED' });
        toast({
          title: "Game Complete!",
          description: "All rounds have been completed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start next round",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionGrade = (accuracy: number) => {
    if (accuracy >= 90) return { grade: 'A+', color: 'text-green-400' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-400' };
    if (accuracy >= 70) return { grade: 'B+', color: 'text-blue-400' };
    if (accuracy >= 60) return { grade: 'B', color: 'text-blue-400' };
    if (accuracy >= 50) return { grade: 'C+', color: 'text-yellow-400' };
    return { grade: 'C', color: 'text-orange-400' };
  };

  const gradeInfo = results ? getPositionGrade(results.accuracy) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-green-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-white">Round Results</h1>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                <span className="text-green-400 font-medium">Round Complete</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white/70">
                Round {state.currentRound?.roundNumber || 1}
              </div>
              {state.isHost && state.status !== 'COMPLETED' && (
                <Button
                  onClick={nextRound}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Starting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play mr-2"></i>
                      Next Round
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-trophy text-white text-3xl"></i>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Round Results</h2>
          <p className="text-xl text-slate-300">See how close you got to the actual order!</p>
          <div className="mt-4 text-lg font-semibold text-white">
            Prompt: <span className="text-primary">{state.currentPrompt?.text}</span>
          </div>
        </div>

        {results && (
          <>
            {/* Comparison View */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Player Order */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-white text-sm"></i>
                    </div>
                    <span>Your Team's Order</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.playerOrder.map((situation, index) => (
                      <div key={situation.id} className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className="w-5 h-5 rounded-full"
                              style={{ backgroundColor: situation.player.color }}
                            ></div>
                            <span className="font-medium text-white">{situation.player.name}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{situation.content}</p>
                          <div className="text-xs text-slate-400 mt-1">
                            Positioned at: {situation.position}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actual Order */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-target text-white text-sm"></i>
                    </div>
                    <span>Actual Order</span>
                    <Badge variant="outline" className="text-xs">by secret numbers</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.actualOrder.map((situation, index) => {
                      const wasCorrect = results.playerOrder[index]?.id === situation.id;
                      return (
                        <div
                          key={situation.id}
                          className={`flex items-center space-x-4 p-4 rounded-xl border-l-4 ${
                            wasCorrect 
                              ? 'bg-green-500/10 border-green-400' 
                              : 'bg-red-500/10 border-red-400'
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div 
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: situation.player.color }}
                              ></div>
                              <span className="font-medium text-white">{situation.player.name}</span>
                              <Badge 
                                variant={wasCorrect ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {wasCorrect ? 'Correct!' : 'Misplaced'}
                              </Badge>
                            </div>
                            <p className="text-slate-300 text-sm">{situation.content}</p>
                            <div className={`text-xs mt-1 font-medium ${
                              wasCorrect ? 'text-green-400' : 'text-red-400'
                            }`}>
                              Secret number: {situation.number}
                              {!wasCorrect && ` • Was placed ${results.playerOrder.findIndex(s => s.id === situation.id) + 1}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Summary */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-6">Round Score</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">
                        {results.playerOrder.filter((s, i) => results.actualOrder[i]?.id === s.id).length}
                      </div>
                      <div className="text-sm text-slate-400">Correct Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-400 mb-2">
                        {results.playerOrder.length - results.playerOrder.filter((s, i) => results.actualOrder[i]?.id === s.id).length}
                      </div>
                      <div className="text-sm text-slate-400">Misplaced</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${gradeInfo?.color}`}>
                        {results.accuracy}%
                      </div>
                      <div className="text-sm text-slate-400">Team Accuracy</div>
                      {gradeInfo && (
                        <Badge variant="outline" className={`mt-2 ${gradeInfo.color}`}>
                          Grade: {gradeInfo.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Continue Game Controls */}
        {state.status !== 'COMPLETED' ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Ready for the next round?</h3>
                  <p className="text-slate-400">More prompts await your team!</p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/lobby')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    View Lobby
                  </Button>
                  {state.isHost && (
                    <Button
                      onClick={nextRound}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Starting...
                        </>
                      ) : (
                        'Next Round'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-flag-checkered text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Game Complete!</h3>
              <p className="text-slate-300 mb-6">Thanks for playing! All rounds have been completed.</p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
