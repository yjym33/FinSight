import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { Bot, User as UserIcon } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'flex w-full mb-10 items-start gap-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs shadow-sm",
        isUser 
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" 
          : "bg-toss-blue text-white"
      )}>
        {isUser ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className={cn(
        "flex flex-col gap-2 max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div
          className={cn(
            'relative px-6 py-4 text-[15px] font-medium leading-relaxed transition-all',
            isUser
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[28px] rounded-tr-[4px] shadow-xl shadow-slate-900/10'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-[28px] rounded-tl-[4px] border border-slate-100 dark:border-slate-700 shadow-sm'
          )}
        >
          <p className="whitespace-pre-wrap">{message.message}</p>
        </div>
        
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </span>
          {!isUser && (
             <span className="h-1 w-1 rounded-full bg-slate-300" />
          )}
          {!isUser && (
             <span className="text-[10px] font-black uppercase tracking-widest text-toss-blue">AI Verified</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
