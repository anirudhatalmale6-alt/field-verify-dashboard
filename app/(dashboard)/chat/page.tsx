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

export default function AdminChatPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    getMe().then(d => setMyId(d.user.id)).catch(() => {});
    loadContacts();
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getChatContacts();
      setContacts(data.contacts);
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

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    loadMessages(contact.id);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread_count: 0 } : c));
  };

  // Poll for new messages every 4 seconds — only depends on selectedContact
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
          // Deduplicate by id
          const existingIds = new Set(msgs.map(m => m.id));
          const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        }
      } catch {}
      loadContacts();
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedContact, loadContacts]);

  const handleSend = async () => {
    if (!selectedContact || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const data = await sendChatMessage(selectedContact.id, newMessage.trim());
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      // Update last message in contacts
      setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString() } : c));
    } catch {}
    setSending(false);
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.region?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dt: string) => {
    const d = new Date(dt + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
      {/* Contact List */}
      <div className={`w-[320px] border-r border-slate-200 flex flex-col ${selectedContact ? 'hidden lg:flex' : 'flex'} lg:w-[320px]`}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-navy-900 mb-3">Messages</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search executives..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => selectContact(contact)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left ${
                selectedContact?.id === contact.id ? 'bg-teal-50 border-l-2 border-l-teal-500' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {contact.avatar || contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-900 truncate">{contact.name}</p>
                  {contact.last_message_at && (
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(contact.last_message_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-slate-500 truncate">{contact.last_message || contact.region || 'No messages yet'}</p>
                  {contact.unread_count > 0 && (
                    <span className="bg-teal-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">No executives found</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden lg:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 bg-white">
              <button onClick={() => setSelectedContact(null)} className="lg:hidden text-slate-400 hover:text-navy-900 mr-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
                {selectedContact.avatar || selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-navy-900">{selectedContact.name}</p>
                <p className="text-[10px] text-slate-400">{selectedContact.region} &middot; Field Executive</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto text-slate-300 mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map(msg => {
                const isMine = msg.sender_id === myId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-white text-navy-900 border border-slate-200 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${isMine ? 'text-teal-200' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                        {isMine && msg.is_read ? ' · Read' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
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
                  className="flex-1 resize-none px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 max-h-[120px]"
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto text-slate-300 mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <h3 className="text-lg font-display font-bold text-navy-900 mb-1">Internal Chat</h3>
              <p className="text-sm text-slate-400">Select an executive to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
