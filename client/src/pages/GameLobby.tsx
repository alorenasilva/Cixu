import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/contexts/GameContext';
import { useSocket } from '@/hooks/useSocket';
import { PlayerCard } from '@/components/PlayerCard';

const themeOptions = [
  { value: 'life-events', label: 'Life Events', description: 'Major life milestones and experiences' },
  { value: 'historical-events', label: 'Historical Events', description: 'Important moments in history' },
  { value: 'daily-activities', label: 'Daily Activities', description: 'Common everyday situations' },
  { value: 'custom', label: 'Custom Prompts', description: 'Create your own prompt list' },
];

export default function GameLobby() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { on, emit } = useSocket(state.roomCode || undefined);

  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [customPrompts, setCustomPrompts] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!state.roomCode) {
      setLocation('/');
      return;
    }

    // Load game state
    loadGameState();

    // Socket event listeners
    const unsubscribers = [
      on('player:joined', (data: any) => {
        dispatch({ type: 'ADD_PLAYER', payload: data.player });
        toast({
          title: "Player Joined",
          description: `${data.player.name} joined the game`,
        });
      }),

      on('game:setup_updated', (data: any) => {
        toast({
          title: "Game Setup Updated",
          description: "Host updated the game configuration",
        });
      }),

      on('game:started', (data: any) => {
        dispatch({
          type: 'SET_CURRENT_ROUND',
          payload: { round: data.round, prompt: data.prompt }
        });
        dispatch({ type: 'SET_STATUS', payload: 'IN_PROGRESS' });
        setLocation('/game');
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [state.roomCode]);

  const loadGameState = async () => {
    try {
      const response = await apiRequest('GET', `/api/games/${state.roomCode}`);
      const gameData = await response.json();

      dispatch({
        type: 'SET_GAME_STATE',
        payload: {
          players: gameData.players,
          prompts: gameData.prompts,
          status: gameData.game.status,
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load game state",
        variant: "destructive",
      });
    }
  };

  const updateGameSetup = async () => {
    if (!selectedTheme) {
      toast({
        title: "Error",
        description: "Please select a theme",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = { theme: selectedTheme };
      
      if (selectedTheme === 'custom') {
        const promptLines = customPrompts.split('\n').filter(line => line.trim());
        if (promptLines.length < 3) {
          toast({
            title: "Error",
            description: "Please provide at least 3 custom prompts",
            variant: "destructive",
          });
          return;
        }
        payload.customPrompts = promptLines;
      }

      await apiRequest('PUT', `/api/games/${state.roomCode}/setup`, payload);
      
      toast({
        title: "Success",
        description: "Game setup updated",
      });

      // Reload prompts
      loadGameState();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update game setup",
        variant: "destructive",
      });
    }
  };

  const startGame = async () => {
    if (state.players.length < 2) {
      toast({
        title: "Error",
        description: "Need at least 2 players to start",
        variant: "destructive",
      });
      return;
    }

    if (state.prompts.length === 0) {
      toast({
        title: "Error",
        description: "Please configure prompts before starting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', `/api/games/${state.roomCode}/start`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(state.roomCode || '');
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/?join=${state.roomCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-white hover:bg-white/10"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </Button>
              <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/70">
                <i className="fas fa-users text-sm"></i>
                <span className="text-sm">{state.players.length} players</span>
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">{state.status}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Info Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Game Lobby</h2>
                <div className="flex items-center space-x-4 text-white/70">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-key"></i>
                    <span className="font-mono text-lg">{state.roomCode}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyRoomCode}
                      className="text-primary hover:text-primary/80"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                  <div className="w-px h-6 bg-white/30"></div>
                  <span>{state.players.length} players joined</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={copyInviteLink}
                  className="bg-white/20 hover:bg-white/30 border-white/20 text-white"
                >
                  <i className="fas fa-share mr-2"></i>
                  Share Invite
                </Button>
                {state.isHost && (
                  <Button
                    onClick={startGame}
                    disabled={isLoading || state.players.length < 2 || state.prompts.length === 0}
                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Starting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play mr-2"></i>
                        Start Game
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <i className="fas fa-users"></i>
                  <span>Players</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.players.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Setup Panel */}
          <div className="space-y-6">
            {/* Theme Selection */}
            {state.isHost && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <i className="fas fa-palette"></i>
                    <span>Theme</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select a theme..." />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          <div>
                            <div className="font-medium">{theme.label}</div>
                            <div className="text-sm text-muted-foreground">{theme.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTheme === 'custom' && (
                    <div>
                      <Label htmlFor="customPrompts" className="text-white">
                        Custom Prompts (one per line)
                      </Label>
                      <Textarea
                        id="customPrompts"
                        value={customPrompts}
                        onChange={(e) => setCustomPrompts(e.target.value)}
                        placeholder="Enter prompts, one per line..."
                        className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        rows={5}
                      />
                    </div>
                  )}

                  <Button
                    onClick={updateGameSetup}
                    disabled={!selectedTheme}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Update Setup
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Prompts Preview */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-list-ul"></i>
                    <span>Prompts</span>
                  </div>
                  <Badge variant="secondary">{state.prompts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.prompts.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {state.prompts.map((prompt, index) => (
                      <div key={prompt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white/80 text-sm">{prompt.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <i className="fas fa-list-ul text-3xl mb-2 opacity-50"></i>
                    <p>No prompts configured yet</p>
                    {state.isHost && <p className="text-sm">Select a theme to add prompts</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
