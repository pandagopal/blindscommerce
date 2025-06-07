'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic, MicOff, VideoOff } from 'lucide-react';

interface VideoChatProps {
  roomId: string;
  userId: string;
  isExpert: boolean;
}

export default function VideoChat({ roomId, userId, isExpert }: VideoChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Create WebRTC peer connection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream);
        });

        // Handle incoming tracks
        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Connect to signaling server and handle signaling
        // This would connect to your WebSocket server
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '');
        
        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'offer' && !isExpert) {
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.current?.createAnswer();
            await peerConnection.current?.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'answer', answer, roomId }));
          }
          
          if (data.type === 'answer' && isExpert) {
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          
          if (data.type === 'ice-candidate') {
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        };

        // Handle connection state changes
        peerConnection.current.onconnectionstatechange = () => {
          setIsConnected(peerConnection.current?.connectionState === 'connected');
        };

        // If expert, create and send offer
        if (isExpert) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.send(JSON.stringify({ type: 'offer', offer, roomId }));
        }

      } catch (error) {
        console.error('Error initializing video chat:', error);
      }
    };

    init();

    return () => {
      // Cleanup
      peerConnection.current?.close();
      if (localVideoRef.current?.srcObject instanceof MediaStream) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, isExpert]);

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    stream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    stream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Remote Video (Full Size) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 p-4 bg-black/50 rounded-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className={`rounded-full ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-white'}`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVideo}
          className={`rounded-full ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'text-white'}`}
        >
          {isVideoOff ? <VideoOff /> : <Camera />}
        </Button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connecting to your consultation...</p>
          </div>
        </div>
      )}
    </div>
  );
}
