import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('');

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setTransport('');
    };

    const handleTransportChange = () => {
      setTransport(socket.io.engine.transport.name);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.engine.on('upgrade', handleTransportChange);

    setIsConnected(socket.connected);
    if (socket.connected) {
      setTransport(socket.io.engine.transport.name);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.engine.off('upgrade', handleTransportChange);
    };
  }, []);

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"}
      className="gap-1.5"
      data-testid="connection-status"
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Live</span>
          {transport === 'websocket' && (
            <span className="text-xs opacity-70">(WS)</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </Badge>
  );
}
