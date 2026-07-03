import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
const SOCKET_URL = API_URL.replace('/api', '');

interface UseSocketProps {
  serverId?: string;
  onVote?: (data: { votes: number; lastVoterId: string }) => void;
  onHype?: (data: { pointsAwarded: number; lastHyperId: string }) => void;
}

export function useSocket({ serverId, onVote, onHype }: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Store stable refs for callbacks to avoid re-triggering effect
  const onVoteRef = useRef(onVote);
  const onHypeRef = useRef(onHype);

  useEffect(() => {
    onVoteRef.current = onVote;
    onHypeRef.current = onHype;
  }, [onVote, onHype]);

  useEffect(() => {
    if (!serverId) return;

    try {
      const socket = io(`${SOCKET_URL}/live`, {
        reconnectionDelayMax: 10000,
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('subscribeToServer', serverId);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('serverVoted', (data) => {
        if (onVoteRef.current) {
          onVoteRef.current(data);
        }
      });

      socket.on('serverHyped', (data) => {
        if (onHypeRef.current) {
          onHypeRef.current(data);
        }
      });

      return () => {
        socket.emit('unsubscribeFromServer', serverId);
        socket.disconnect();
      };
    } catch (error) {
      console.error('Socket connection failed silently', error);
    }
  }, [serverId]);

  return { isConnected };
}
