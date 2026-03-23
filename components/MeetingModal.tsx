import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  image?: string;
  buttonIcon?: string;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  handleClick,
  buttonText,
  image,
  buttonIcon,
}: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex w-full max-w-[520px] flex-col gap-6 px-6 py-8"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          color: '#1e293b',
        }}
      >
        <div className="flex flex-col gap-5">
          {image && (
            <div className="flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <Image src={image} alt="modal icon" width={36} height={36} />
              </div>
            </div>
          )}

          <DialogHeader>
            <DialogTitle
              className={cn('text-2xl font-bold leading-tight', className)}
              style={{ color: '#1e293b' }}
            >
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription style={{ color: '#64748b', fontSize: '14px' }}>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Children — form fields styled via globals or inline */}
          {children && (
            <div
              className="flex flex-col gap-4 [&_label]:text-xs [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wider"
              style={
                {
                  '--label-color': '#64748b',
                  '--input-bg': '#f8fafc',
                  '--input-border': '#e2e8f0',
                  '--input-color': '#1e293b',
                } as React.CSSProperties
              }
            >
              {children}
            </div>
          )}

          <Button
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ background: '#4f8ef7', border: 'none' }}
            onClick={handleClick}
          >
            {buttonIcon && (
              <Image src={buttonIcon} alt="button icon" width={14} height={14} className="mr-1.5" />
            )}
            {buttonText || 'Confirmă'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
