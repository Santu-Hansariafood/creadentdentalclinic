import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Search, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ChatMessage from "../components/ChatMessage";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useQuery } from "@apollo/client";
import { GET_CONVERSATIONS, GET_CHAT_MESSAGES } from "../graphql/queries";

const Chat = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  const { data: convData, loading: convLoading } = useQuery(GET_CONVERSATIONS);
  const { data: msgData, loading: msgLoading } = useQuery(GET_CHAT_MESSAGES, {
    variables: { conversationId: selectedConversation?.id },
    skip: !selectedConversation,
  });

  const userConversations = convData?.getConversations || [];

  const filteredConversations = userConversations.filter((conv) =>
    conv.participants.some((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  const conversationMessages = msgData?.getChatMessages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    toast.success("Message sent!");
    setMessage("");
  };

  const handleFileAttach = () => {
    toast.success("File attachment feature");
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p.id !== user.id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-4 sm:mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Messages
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Communicate with your healthcare team
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        <motion.div
          {...fadeIn("right", 0.1)}
          className={`lg:col-span-1 ${selectedConversation ? "hidden lg:block" : "block"}`}
        >
          <div className="card">
            <div className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] lg:max-h-[600px] overflow-y-auto pr-1">
              {filteredConversations.map((conv, index) => {
                const otherParticipant = getOtherParticipant(conv);
                return (
                  <motion.div
                    key={conv.id}
                    {...fadeIn("up", index * 0.05)}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/10 border-primary"
                        : "bg-gray-50 hover:bg-gray-100 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {otherParticipant?.name}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span className="badge badge-primary">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {conv.lastMessage}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          {...fadeIn("left", 0.2)}
          className={`lg:col-span-2 ${selectedConversation ? "block" : "hidden lg:block"}`}
        >
          {selectedConversation ? (
            <div className="card flex flex-col h-[75vh] lg:h-[700px] p-0 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-2 -ml-2 rounded-full hover:bg-gray-100"
                >
                  <Search size={20} className="rotate-180" />{" "}
                </button>
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {getOtherParticipant(selectedConversation)?.name}
                  </h2>
                  <p className="text-xs text-gray-600 capitalize">
                    {getOtherParticipant(selectedConversation)?.role}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {conversationMessages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    currentUserId={user.id}
                    delay={index * 0.02}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white"
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFileAttach}
                    className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Paperclip size={20} className="text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-4 sm:px-6"
                    disabled={!message.trim()}
                  >
                    <Send size={18} sm:size={20} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-[50vh] lg:h-[700px]">
              <div className="text-center p-6">
                <User size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 max-w-xs mx-auto">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
