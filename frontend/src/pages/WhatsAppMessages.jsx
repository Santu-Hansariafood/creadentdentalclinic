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
  const messagesEndRef = useRef(null);
  const { data: patientData, loading: patientsLoading } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 500, search },
  });
  const {
    data: messageData,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery(GET_WHATSAPP_MESSAGES, {
    variables: { limit: 500 },
  });
  const [sendMessage, { loading: sending }] = useMutation(SEND_WHATSAPP_MESSAGE);
  const [markMessagesRead] = useMutation(MARK_WHATSAPP_MESSAGES_READ);

  const patients = patientData?.getPatients?.patients || [];
  const allMessages = messageData?.getWhatsAppMessages || [];
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const historyRecipients = Array.from(
    allMessages.reduce((recipients, item) => {
      const key = item.patientId || item.phone;
      const current = recipients.get(key);
      if (!current) {
        recipients.set(key, {
          id: item.patientId || item.phone,
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
      `${recipient.name} ${recipient.phone}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  const activePatient = selectedPatient || historyRecipients[0] || null;
  const messages = allMessages
    .filter((item) =>
      activePatient &&
      (activePatient.patientId
        ? item.patientId === activePatient.patientId
        : item.phone === activePatient.phone),
    )
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  const latestMessageId = messages.length ? messages[messages.length - 1].id : null;
  const unreadCount = allMessages.filter(
    (item) => item.direction === "inbound" && !item.read,
  ).length;

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    if (patient.patientId) {
      await markMessagesRead({ variables: { patientId: patient.patientId } });
      await refetchMessages();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePatient?.id, messages.length, latestMessageId]);

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
              if (patient) void handleSelectPatient({ patientId: patient.id, ...patient });
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
              <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-gray-50/60">
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
                      <div className={`flex ${item.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-3 ${item.direction === "outbound" ? "bg-[#d9fdd3]" : "bg-white border border-gray-200"}`}>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{item.text || "No text content"}</p>
                          <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-2">
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
