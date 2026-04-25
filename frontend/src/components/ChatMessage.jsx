import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { fadeIn } from '../utils/motion'

const ChatMessage = ({ message, currentUserId, delay = 0 }) => {
  const isSent = message.senderId === currentUserId

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-md ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isSent && (
          <span className="text-xs text-gray-500 px-2">{message.senderName}</span>
        )}
        <div className={isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}>
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isSent ? 'bg-white/20' : 'bg-gray-200'
                  }`}
                >
                  <Download size={14} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p className="text-xs opacity-75">{attachment.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 px-2">
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </motion.div>
  )
}

export default ChatMessage