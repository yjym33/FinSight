import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    sender: 'user' | 'bot';
    message: string;
    createdAt: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn('flex items-end gap-2 mb-6', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-toss-blue/10 text-[12px] font-bold text-toss-blue flex-shrink-0">
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-toss-base px-5 py-4 text-[15px] leading-relaxed shadow-sm',
          isUser
            ? 'bg-toss-blue text-white rounded-tr-none'
            : 'bg-white text-toss-text-primary rounded-tl-none border border-gray-100'
        )}
      >
        <p className="whitespace-pre-wrap">{message.message}</p>
      </div>
      <span className="mb-1 text-[11px] font-medium text-toss-text-placeholder whitespace-nowrap">
        {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })}
      </span>
    </motion.div>
  );
}
