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
        className="flex w-full max-w-[560px] flex-col gap-6 overflow-hidden border-0 px-0 py-0 shadow-none"
        style={{
          background: 'transparent',
          color: '#1e293b',
        }}
      >
        <div
          className="relative flex flex-col gap-6 overflow-hidden rounded-[30px] border px-6 py-7 sm:px-8 sm:py-8"
          style={{
            background: 'linear-gradient(180deg, #fffdfb 0%, #ffffff 100%)',
            borderColor: 'rgba(234,223,235,0.95)',
            boxShadow: '0 28px 72px rgba(58,36,72,0.16)',
          }}
        >
          <span
            className="pointer-events-none absolute -left-12 top-10 h-24 w-24 rounded-full opacity-90"
            style={{ background: '#ededff' }}
          />
          <span
            className="pointer-events-none absolute -right-10 bottom-8 h-28 w-28 rounded-full opacity-90"
            style={{ background: '#ffe6ef' }}
          />
          <span
            className="pointer-events-none absolute right-12 top-10 h-3 w-3 rounded-full"
            style={{ background: '#f6a43a' }}
          />

          <div className="relative flex flex-col gap-5">
            {image && (
              <div className="flex justify-center">
                <div
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
                  style={{
                    background: '#fff0bf',
                    border: '1px solid rgba(246,164,58,0.28)',
                    boxShadow: '0 12px 30px rgba(246,164,58,0.18)',
                  }}
                >
                  <Image src={image} alt="modal icon" width={38} height={38} />
                </div>
              </div>
            )}

            {!image && (
              <div className="flex justify-center">
                
              </div>
            )}

            <DialogHeader className="relative gap-3">
              <DialogTitle
                className={cn('text-center text-[2rem] font-black leading-[1.05] sm:text-[2.4rem]', className)}
                style={{ color: '#17141f' }}
              >
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription
                  className="mx-auto max-w-136 text-center text-[15px] leading-6"
                  style={{ color: '#75697c' }}
                >
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>

            {children && (
              <div
                className="relative flex flex-col gap-4 rounded-3xl border p-4 sm:p-5 [&_label]:text-xs [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wider"
                style={
                  {
                    '--label-color': '#75697c',
                    '--input-bg': '#fff8f1',
                    '--input-border': '#eadfeb',
                    '--input-color': '#17141f',
                    background: 'rgba(255,248,241,0.78)',
                    borderColor: 'rgba(234,223,235,0.9)',
                  } as React.CSSProperties
                }
              >
                {children}
              </div>
            )}

            <div
              className="relative overflow-hidden rounded-[22px] border p-1.5"
              style={{
                background: '#ffffff',
                borderColor: 'rgba(234,223,235,0.95)',
                boxShadow: '0 14px 32px rgba(58,36,72,0.08)',
              }}
            >
              <span
                className="pointer-events-none absolute left-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-80"
                style={{ background: '#ededff' }}
              />
              <span
                className="pointer-events-none absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-80"
                style={{ background: '#ffe6ef' }}
              />
              <Button
                className="relative h-14 w-full rounded-[18px] border-0 px-6 text-base font-black text-white transition-transform duration-200 hover:scale-[0.995] hover:opacity-100 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  background: 'linear-gradient(135deg, #9697f3 0%, #4f8ef7 100%)',
                  boxShadow: '0 18px 36px rgba(79,142,247,0.28)',
                }}
                onClick={handleClick}
              >
                {buttonIcon && (
                  <Image src={buttonIcon} alt="button icon" width={15} height={15} className="mr-1.5" />
                )}
                {buttonText || 'Confirmă'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
