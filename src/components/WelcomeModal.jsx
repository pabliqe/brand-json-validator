import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogOverlay } from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { useState } from 'react';

export function WelcomeModal() {
  // Add these keyframes to your Tailwind config (tailwind.config.js) if not present:
  //   theme: {
  //     extend: {
  //       keyframes: {
  //         'fade-scale-in': {
  //           '0%': { opacity: 0, transform: 'scale(0.95) translateY(40px)' },
  //           '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
  //         },
  //         'fade-scale-out': {
  //           '0%': { opacity: 1, transform: 'scale(1) translateY(0)' },
  //           '100%': { opacity: 0, transform: 'scale(0.95) translateY(40px)' },
  //         },
  //         'fade-in': {
  //           '0%': { opacity: 0 },
  //           '100%': { opacity: 1 },
  //         },
  //         'fade-out': {
  //           '0%': { opacity: 1 },
  //           '100%': { opacity: 0 },
  //         },
  //       },
  //       animation: {
  //         'fade-scale-in': 'fade-scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
  //         'fade-scale-out': 'fade-scale-out 0.2s cubic-bezier(0.16,1,0.3,1) both',
  //         'fade-in': 'fade-in 0.2s ease-out both',
  //         'fade-out': 'fade-out 0.2s ease-in both',
  //       },
  //     },
  //   },
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out">
        <DialogContent
          className="relative max-w-md w-full rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-2xl border
          data-[state=open]:animate-fade-scale-in data-[state=closed]:animate-fade-scale-out duration-300"
        >
          <DialogTitle className="text-2xl font-bold mb-2">Welcome to Brand JSON Validator</DialogTitle>
          <DialogDescription className="mb-4 text-zinc-600 dark:text-zinc-300">
            <p className="mb-2">This tool helps you validate and correct <b>brand.json</b> files using the DTCG (Design Tokens Community Group) standard.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Validate your <b>brand.json</b> for DTCG compliance</li>
              <li>Drag & drop, paste, or upload files</li>
              <li>Auto-fix common JSON issues</li>
              <li>Download corrected results</li>
            </ul>
          </DialogDescription>
          <Button variant="brand" onClick={() => setOpen(false)} className="w-full mt-2">Get Started</Button>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
