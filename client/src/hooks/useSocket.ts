import { useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket';

export function useSocket(roomCode?: string) {
  useEffect(() => {
    if (roomCode) {
      socketClient.connect(roomCode);
    }

    return () => {
      socketClient.disconnect();
    };
  }, [roomCode]);

  const on = useCallback((event: string, callback: Function) => {
    socketClient.on(event, callback);
    return () => socketClient.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketClient.send(event, data);
  }, []);

  return { on, emit };
}
