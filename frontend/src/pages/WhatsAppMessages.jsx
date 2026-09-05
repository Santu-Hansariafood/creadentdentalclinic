import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { MessageCircle, RefreshCw, Send, Smartphone, User } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Preloader from "../components/Preloader";
import { GET_PATIENTS, GET_WHATSAPP_MESSAGES } from "../graphql/queries";
import {
  MARK_WHATSAPP_MESSAGES_READ,
  SEND_WHATSAPP_MESSAGE,
} from "../graphql/mutations";

const getStatusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "read":
      return "Read";
    case "delivered":
      return "Delivered";
    case "sent":
      return "Sent";
    case "received":
      return "Received";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return "Pending";
  }
};

const TemplateMessage = ({ message }) => {
  const hasPreview = message.text && !message.text.startsWith("Template:");

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white/75">
      <div className="flex items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50/80 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Approved template
          </p>
          <p className="mt-0.5 break-all text-sm font-semibold text-gray-900">
            {message.templateName || "Unnamed template"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            message.status === "sent" || message.status === "delivered" || message.status === "read"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {getStatusLabel(message.status)}
        </span>
      </div>

      <div className="space-y-3 px-3 py-3">
        {hasPreview ? (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Message preview
            </p>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-gray-800">
              {message.text}
            </p>
          </div>
        ) : null}

        {message.templateParameters?.length ? (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Template variables
            </p>
            <div className="space-y-1.5">
              {message.templateParameters.map((parameter, index) => (
                <div
                  key={`${message.id}-parameter-${index}`}
                  className="flex gap-2 text-xs text-gray-700"
                >
                  <span className="font-semibold text-emerald-700">{`{{${index + 1}}}`}</span>
                  <span className="min-w-0 break-words">{parameter || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!hasPreview && !message.templateParameters?.length ? (
          <p className="text-xs text-gray-500">
            Template content is managed in Meta WhatsApp Manager.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const normalizeConversationPhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(-10);

const getConversationKey = (item) =>
  normalizeConversationPhone(item?.phone) ||
  String(item?.patientId || item?.id || "");

const isSameConversation = (message, recipient) => {
  const messagePhone = normalizeConversationPhone(message?.phone);
  const recipientPhone = normalizeConversationPhone(recipient?.phone);

  if (messagePhone && recipientPhone) {
    return messagePhone === recipientPhone;
  }

  if (message?.patientId && recipient?.patientId) {
    return String(message.patientId) === String(recipient.patientId);
  }

  return false;
};

const getDateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const getDateLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return "Today";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const WhatsAppMessages = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const messagePageSize = 30;
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: patientData, loading: patientsLoading } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 500, search: debouncedSearch },
  });
  const {
    data: messageData,
    loading: messagesLoading,
    refetch: refetchMessages,
    fetchMore: fetchMoreMessages,
  } = useQuery(GET_WHATSAPP_MESSAGES, {
    variables: { limit: messagePageSize },
  });
  const [sendMessage, { loading: sending }] = useMutation(SEND_WHATSAPP_MESSAGE);
  const [markMessagesRead] = useMutation(MARK_WHATSAPP_MESSAGES_READ);

  const patients = patientData?.getPatients?.patients || [];
  const allMessages = messageData?.getWhatsAppMessages || [];
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const historyRecipients = Array.from(
    allMessages.reduce((recipients, item) => {
      const key = getConversationKey(item);
      const current = recipients.get(key);
      if (!current) {
        recipients.set(key, {
          id: key,
          patientId: item.patientId,
          name: item.patientName || patientMap.get(item.patientId)?.name || item.phone,
          phone: item.phone,
          createdAt: item.createdAt,
          unreadCount: 0,
        });
      } else if (new Date(item.createdAt) > new Date(current.createdAt)) {
        current.name = item.patientName || patientMap.get(item.patientId)?.name || current.name;
        current.phone = item.phone;
        current.createdAt = item.createdAt;
      }
      if (!item.read && item.direction === "inbound") {
        recipients.get(key).unreadCount += 1;
      }
      return recipients;
    }, new Map()).values(),
  )
    .filter((recipient) =>
      `${recipient.name} ${recipient.phone}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()),
    )
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  const activePatient = selectedPatient || historyRecipients[0] || null;
  const messages = allMessages
    .filter((item) => activePatient && isSameConversation(item, activePatient))
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  const latestMessageId = messages.length ? messages[messages.length - 1].id : null;
  const unreadCount = allMessages.filter(
    (item) => item.direction === "inbound" && !item.read,
  ).length;

  const handleLoadOlder = async () => {
    if (loadingOlder || !hasOlderMessages || !allMessages.length) return;
    const oldestMessage = allMessages.reduce((oldest, item) =>
      new Date(item.createdAt) < new Date(oldest.createdAt) ? item : oldest,
    );
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    const previousScrollTop = container?.scrollTop || 0;
    setLoadingOlder(true);
    try {
      const { data } = await fetchMoreMessages({
        variables: {
          limit: messagePageSize,
          before: oldestMessage.createdAt,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const olderMessages = fetchMoreResult?.getWhatsAppMessages || [];
          if (!olderMessages.length) return previousResult;
          return {
            ...previousResult,
            getWhatsAppMessages: [
              ...(previousResult.getWhatsAppMessages || []),
              ...olderMessages,
            ],
          };
        },
      });
      if ((data?.getWhatsAppMessages || []).length < messagePageSize) {
        setHasOlderMessages(false);
      }
      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop =
          previousScrollTop + container.scrollHeight - previousScrollHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    if (patient.patientId) {
      await markMessagesRead({ variables: { patientId: patient.patientId } });
      await refetchMessages();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePatient?.id, latestMessageId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!activePatient || !message.trim()) return;
    try {
      const { data } = await sendMessage({
        variables: {
          patientId: activePatient.patientId,
          phone: activePatient.phone,
          message: message.trim(),
        },
      });
      const result = data?.sendWhatsAppMessage;
      if (result?.success) {
        toast.success("WhatsApp message sent");
        setMessage("");
        await refetchMessages();
      } else {
        toast.error(result?.message || "Message was not sent");
      }
    } catch {
      toast.error("Message was not sent");
    }
  };

  if ((patientsLoading || messagesLoading) && !patientData && !messageData) return <Preloader />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="WhatsApp Messages"
        subtitle={`Review WhatsApp API activity and contact patients directly. ${unreadCount} unread`}
        action={
          <button
            type="button"
            onClick={() => refetchMessages()}
            className="btn-secondary inline-flex items-center gap-2"
            title="Refresh message history"
          >
            <RefreshCw size={17} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6">
        <section className="card p-4 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <User size={19} className="text-primary" />
            <h2 className="font-heading font-semibold text-gray-900">Message History</h2>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patients..."
            className="input-field mb-3"
          />
          <select
            value={activePatient?.patientId || ""}
            onChange={(event) => {
              const patient = patients.find((item) => item.id === event.target.value);
              if (patient) {
                void handleSelectPatient({
                  id: getConversationKey(patient),
                  patientId: patient.id,
                  name: patient.name,
                  phone: patient.phone,
                });
              }
            }}
            className="input-field mb-3"
          >
            <option value="">Send to a patient...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name} ({patient.phone})</option>
            ))}
          </select>
          <div className="space-y-2 max-h-[35rem] overflow-y-auto">
            {historyRecipients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => void handleSelectPatient(patient)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activePatient?.id === patient.id
                    ? "border-primary bg-primary/10"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs text-gray-500">{patient.phone}</p>
                  {patient.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-600 text-white text-[11px] font-semibold flex items-center justify-center">
                      {patient.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {!historyRecipients.length && <p className="text-sm text-gray-500 py-4">No WhatsApp messages found.</p>}
          </div>
        </section>

        <section className="card p-0 overflow-hidden min-h-[38rem] flex flex-col">
          {activePatient ? (
            <>
              <header className="p-5 border-b border-gray-200 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                  <MessageCircle className="text-[#128C7E]" size={24} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-gray-900">{activePatient.name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Smartphone size={14} /> {activePatient.phone}</p>
                </div>
              </header>
              <div
                ref={messagesContainerRef}
                onScroll={(event) => {
                  if (event.currentTarget.scrollTop <= 80) {
                    void handleLoadOlder();
                  }
                }}
                className="flex-1 px-4 py-5 sm:px-6 space-y-3 overflow-y-auto bg-gray-50/60"
              >
                {loadingOlder && (
                  <p className="py-2 text-center text-xs text-gray-500">
                    Loading previous messages...
                  </p>
                )}
                {messagesLoading ? <Preloader /> : messages.length ? messages.map((item, index) => {
                  const previousItem = messages[index - 1];
                  const showDate =
                    !previousItem ||
                    getDateKey(previousItem.createdAt) !== getDateKey(item.createdAt);
                  return (
                    <div key={item.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 rounded-full bg-gray-200 text-[11px] font-medium text-gray-600">
                            {getDateLabel(item.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${
                          item.direction === "outbound"
                            ? "justify-end pl-8 sm:pl-16"
                            : "justify-start pr-8 sm:pr-16"
                        }`}
                      >
                        <div
                          className={`w-fit max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-3 shadow-sm ${
                            item.direction === "outbound"
                              ? "bg-[#d9fdd3] text-gray-900"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          {item.messageType === "template" ? (
                            <TemplateMessage message={item} />
                          ) : (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{item.text || "No text content"}</p>
                          )}
                          <p
                            className={`text-[11px] text-gray-500 mt-2 flex items-center gap-2 ${
                              item.direction === "outbound" ? "justify-end" : "justify-start"
                            }`}
                          >
                            {item.direction === "outbound" ? "Sent" : "Received"} · {getStatusLabel(item.status)} · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }) : <div className="h-full flex items-center justify-center text-sm text-gray-500">No WhatsApp messages recorded for this patient.</div>}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-2">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a WhatsApp message..."
                  rows={2}
                  className="input-field flex-1 resize-none"
                  maxLength={4096}
                />
                <button type="submit" className="btn-primary self-end inline-flex items-center gap-2" disabled={sending || !message.trim()}>
                  <Send size={17} /> {sending ? "Sending" : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a patient to view messages.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WhatsAppMessages;
