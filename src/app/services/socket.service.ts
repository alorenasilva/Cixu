import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: WebSocket | null = null;
  private roomCode: string | null = null;
  private messageSubject = new Subject<any>();
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private reconnectTimeout: any = null;

  public messages$ = this.messageSubject.asObservable();
  public connected$ = this.connectionSubject.asObservable();

  connect(roomCode: string): void {
    this.roomCode = roomCode;
    this.disconnect();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?roomCode=${roomCode}`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.connectionSubject.next(true);
      this.emit('connected', {});
    };

    this.socket.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);
        this.messageSubject.next({ event: eventName, data });
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      this.connectionSubject.next(false);
      
      // Only reconnect if it wasn't a normal closure
      if (event.code !== 1000 && event.code !== 1001 && this.roomCode) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.connectionSubject.next(false);
  }

  send(event: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  on(eventName: string): Observable<any> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.event === eventName) {
          observer.next(message.data);
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }

  private emit(event: string, data: any): void {
    this.messageSubject.next({ event, data });
  }

  private scheduleReconnect(): void {
    if (this.roomCode && !this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect...');
        if (this.roomCode) {
          this.connect(this.roomCode);
        }
      }, 5000);
    }
  }
}