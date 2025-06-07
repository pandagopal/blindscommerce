'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import VideoChat from '@/components/consultation/VideoChat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare } from 'lucide-react';

interface ConsultationDetails {
  id: string;
  expertId: string;
  userId: string;
  consultationType: string;
  notes: string;
  status: string;
  roomId: string;
}

export default function ConsultationRoom({ params }: { params: { id: string }}) {
  const { data: session } = useSession();
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: string; timestamp: Date }>>([]);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const response = await fetch(`/api/consultations/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch consultation');
        const data = await response.json();
        setConsultation(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchConsultation();
    }
  }, [params.id]);

  const isExpert = session?.user?.role === 'expert';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Consultation Not Found</h1>
          <p className="text-gray-600">This consultation may have ended or does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Video Chat */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">
            {isExpert ? 'Consultation with Customer' : 'Expert Consultation'}
          </h1>
          
          <VideoChat
            roomId={consultation.roomId}
            userId={session?.user?.id || ''}
            isExpert={isExpert}
          />
        </div>

        {/* Sidebar - Notes & Chat */}
        <div className="space-y-6">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="notes" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Consultation Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-48 p-2 border rounded-md"
                  placeholder="Take notes during the consultation..."
                />
                <Button
                  className="w-full mt-2"
                  onClick={async () => {
                    // Save notes to the database
                    await fetch(`/api/consultations/${consultation.id}/notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes })
                    });
                  }}
                >
                  Save Notes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === session?.user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === session?.user?.id
                            ? 'bg-primary text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <p>{message.text}</p>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const newMessage = {
                          id: Date.now().toString(),
                          text: e.currentTarget.value,
                          sender: session?.user?.id || '',
                          timestamp: new Date()
                        };
                        setMessages([...messages, newMessage]);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button variant="secondary">Send</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Consultation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Consultation Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium">{consultation.consultationType}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium capitalize">{consultation.status}</dd>
              </div>
              {consultation.notes && (
                <div>
                  <dt className="text-gray-600">Initial Notes:</dt>
                  <dd className="font-medium">{consultation.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
