'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getChatContacts, getChatMessages, sendChatMessage, getMe } from '@/lib/api-client';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  region: string;
  role: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sender_name: string;
  sender_avatar: string;
  is_read: number;
  created_at: string;
}

export default function ExecChatPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const autoSelected = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    getMe().then(d => setMyId(d.user.id)).catch(() => {});
    loadContacts();
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getChatContacts();
      setContacts(data.contacts);
      if (data.contacts.length === 1 && !autoSelected.current) {
        autoSelected.current = true;
        setSelectedContact(data.contacts[0]);
      }
    } catch {}
  }, []);

  const loadMessages = useCallback(async (contactId: string) => {
    try {
      const data = await getChatMessages(contactId);
      setMessages(data.messages);
      messagesRef.current = data.messages;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  }, []);

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact, loadMessages]);

  // Poll every 4s — only depends on selectedContact
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedContact) return;
    const contactId = selectedContact.id;
    pollRef.current = setInterval(async () => {
      try {
        const msgs = messagesRef.current;
        const last = msgs.length > 0 ? msgs[msgs.length - 1].created_at : undefined;
        const data = await getChatMessages(contactId, last);
        if (data.messages.length > 0) {
          const existingIds = new Set(msgs.map(m => m.id));
          const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        }
      } catch {}
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedContact]);

  const handleSend = async () => {
    if (!selectedContact || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const data = await sendChatMessage(selectedContact.id, newMessage.trim());
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
    setSending(false);
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // If multiple admin contacts, show contact list; otherwise go straight to chat
  const showContactList = contacts.length > 1 && !selectedContact;

  if (showContactList) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold text-navy-900 mb-4">Messages</h2>
        <div className="space-y-2">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-slate-100"
            >
              <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
                {contact.avatar || contact.name.slice(0, 2)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-navy-900">{contact.name}</p>
                <p className="text-xs text-slate-500 truncate">{contact.last_message || 'Office Admin'}</p>
              </div>
              {contact.unread_count > 0 && (
                <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {contact.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Chat Header */}
      {selectedContact && (
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
          {contacts.length > 1 && (
            <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-navy-900 mr-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
            {selectedContact.avatar || selectedContact.name.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-navy-900">{selectedContact.name}</p>
            <p className="text-[10px] text-slate-400">Office Admin</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {!selectedContact && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        )}
        {selectedContact && messages.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto text-slate-300 mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-sm text-slate-400">Send a message to the office</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                isMine
                  ? 'bg-teal-600 text-white rounded-br-md'
                  : 'bg-white text-navy-900 border border-slate-200 rounded-bl-md shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMine ? 'text-teal-200' : 'text-slate-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {selectedContact && (
        <div className="px-4 py-3 border-t border-slate-200 bg-white safe-area-bottom">
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 max-h-[100px]"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
