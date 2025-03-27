
import React, { useState } from "react";
import MessageItem from "@/components/MessageItem";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: string;
  user: {
    name: string;
    avatar?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const Messages: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [messages] = useState<Message[]>([
    {
      id: "1",
      user: {
        name: "Jane Cooper",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        status: "online",
      },
      lastMessage: "Hey, are we still meeting today?",
      timestamp: "5m ago",
      unread: 2,
    },
    {
      id: "2",
      user: {
        name: "Alex Morgan",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
        status: "away",
      },
      lastMessage: "I just sent you the design files",
      timestamp: "1h ago",
      unread: 0,
    },
    {
      id: "3",
      user: {
        name: "Michael Williams",
        avatar: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=200",
        status: "offline",
      },
      lastMessage: "Let me know what you think about the proposal",
      timestamp: "2h ago",
      unread: 0,
    },
    {
      id: "4",
      user: {
        name: "Emma Davis",
        avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200",
        status: "online",
      },
      lastMessage: "Thanks for your help yesterday!",
      timestamp: "1d ago",
      unread: 0,
    },
  ]);
  
  const filteredMessages = messages.filter((message) =>
    message.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleOpenChat = (id: string) => {
    // In a real app, this would navigate to the chat screen
    console.log(`Opening chat ${id}`);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-md mx-auto h-full">
      <header className="sticky top-0 z-10 bg-background px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            type="text"
            placeholder="Search messages..."
            className="pl-10 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>
      
      <div className="divide-y divide-border">
        <AnimatePresence>
          {filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center text-gray-500"
            >
              No messages found
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-border"
            >
              {filteredMessages.map((message) => (
                <motion.div key={message.id} variants={item}>
                  <MessageItem
                    {...message}
                    onClick={() => handleOpenChat(message.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Messages;
