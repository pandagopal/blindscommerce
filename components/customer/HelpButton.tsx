'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import AssistanceRequest from './AssistanceRequest';

interface HelpButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export default function HelpButton({ 
  className = '',
  variant = 'outline',
  size = 'default'
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRequestSubmitted = (data: { accessPin: string; sessionId: number }) => {
    // You could add additional handling here, like showing notifications
    console.log('Assistance request created:', data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`${className}`}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Need Help?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customer Assistance</DialogTitle>
        </DialogHeader>
        <AssistanceRequest onRequestSubmitted={handleRequestSubmitted} />
      </DialogContent>
    </Dialog>
  );
}