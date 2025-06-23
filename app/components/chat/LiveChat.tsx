'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  agentName?: string;
  agentAvatar?: string;
}

export default function LiveChat() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsConnected(true);
      loadMessages();
    }
  }, [isAuthenticated, user]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId || ''}`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.message_id.toString(),
          content: msg.message,
          sender: msg.is_agent ? 'agent' : 'user',
          timestamp: new Date(msg.sent_at),
          agentName: msg.is_agent ? `${msg.first_name} ${msg.last_name}`.trim() : undefined
        }));
        setMessages(formattedMessages.reverse()); // API returns newest first, we want oldest first
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          sessionId: sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update sessionId if this was the first message
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
        }
        // Reload messages to get the actual server data
        loadMessages();
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
        console.error('Failed to send message');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    // Note: Real-time typing indicators would need WebSocket/Server-Sent Events
    // For now, we'll skip the typing indicator functionality
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-[#1a365d] hover:bg-[#2d4a7c] shadow-lg transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      ) : (
        <div className="bg-[#f7fafc] rounded-lg shadow-xl w-96 max-w-[calc(100vw-2rem)] border border-[#e2e8f0]">
          {/* Chat Header */}
          <div className="p-4 bg-[#1a365d] text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#48bb78]' : 'bg-[#718096]'}`} />
              <h3 className="font-semibold">Customer Support</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender === 'agent' && (
                      <Avatar className="w-8 h-8 mr-2">
                        <AvatarImage src={message.agentAvatar} />
                        <AvatarFallback>
                          {message.agentName?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.sender === 'user'
                          ? 'bg-[#1a365d] text-white'
                          : 'bg-[#e2e8f0] text-[#2d3748]'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-[#718096]">
                    <div className="animate-bounce">•</div>
                    <div className="animate-bounce delay-100">•</div>
                    <div className="animate-bounce delay-200">•</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-[#f6ad55] hover:bg-[#ed8936] text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
} 