import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/contexts/GameContext';

export default function Home() {
  const [, setLocation] = useLocation();
  const { dispatch } = useGame();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hostName, setHostName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const createGame = async () => {
    if (!hostName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/games', { hostName });
      const { game, host } = await response.json();

      dispatch({
        type: 'SET_GAME_STATE',
        payload: {
          gameId: game.id,
          roomCode: game.roomCode,
          playerId: host.id,
          isHost: true,
          status: 'LOBBY',
          players: [host],
        }
      });

      setLocation('/lobby');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      toast({
        title: "Error", 
        description: "Please enter both room code and your name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/games/${roomCode.toUpperCase()}/join`, { 
        playerName 
      });
      const { game, player } = await response.json();

      dispatch({
        type: 'SET_GAME_STATE',
        payload: {
          gameId: game.id,
          roomCode: game.roomCode,
          playerId: player.id,
          isHost: false,
          status: game.status,
        }
      });

      setLocation('/lobby');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-6">
            <i className="fas fa-gamepad text-primary mr-2"></i>
            <span className="text-primary font-medium">Multiplayer Turn-Based Game</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            SituationSort
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Create situations, arrange them in order, and discover how well you and your friends think alike in this collaborative guessing game.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Create Game Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <div className="bg-primary/10 p-3 rounded-xl mr-4">
                  <i className="fas fa-plus text-primary text-xl"></i>
                </div>
                Create Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400">Start a new game session and invite friends to join with a shareable room code.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hostName" className="text-white">Your Name</Label>
                  <Input
                    id="hostName"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={createGame}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Game Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <div className="bg-purple-500/10 p-3 rounded-xl mr-4">
                  <i className="fas fa-sign-in-alt text-purple-500 text-xl"></i>
                </div>
                Join Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400">Enter a room code to join an existing game session.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomCode" className="text-white">Room Code</Label>
                  <Input
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-center font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="playerName" className="text-white">Your Name</Label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-500/90"
                  onClick={joinGame}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Joining...
                    </>
                  ) : (
                    'Join Room'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-500/10 p-4 rounded-xl inline-block mb-4">
              <i className="fas fa-users text-green-400 text-2xl"></i>
            </div>
            <h4 className="font-semibold mb-2 text-white">Real-time Multiplayer</h4>
            <p className="text-slate-400 text-sm">Play with friends in real-time with instant updates</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-500/10 p-4 rounded-xl inline-block mb-4">
              <i className="fas fa-brain text-yellow-400 text-2xl"></i>
            </div>
            <h4 className="font-semibold mb-2 text-white">Strategic Thinking</h4>
            <p className="text-slate-400 text-sm">Create and arrange situations based on hidden numbers</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-500/10 p-4 rounded-xl inline-block mb-4">
              <i className="fas fa-trophy text-purple-400 text-2xl"></i>
            </div>
            <h4 className="font-semibold mb-2 text-white">Collaborative Fun</h4>
            <p className="text-slate-400 text-sm">Work together in the free-hand round</p>
          </div>
        </div>
      </div>
    </div>
  );
}
