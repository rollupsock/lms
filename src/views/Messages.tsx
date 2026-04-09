import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MessageSquare, MoreVertical, Phone, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchContacts() {
      if (!user) return;
      
      // Fetch users to chat with (simplified: fetch all other users)
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user.uid);
      
      setContacts(usersData);
      setLoading(false);
    }
    fetchContacts();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedContact) return;

    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [user.uid, selectedContact.id]),
      where('receiverId', 'in', [user.uid, selectedContact.id]),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [user, selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedContact) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: selectedContact.id,
        text: newMessage,
        createdAt: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in duration-500">
      {/* Contacts Sidebar */}
      <Card className="w-80 border-stone-200 shadow-sm flex flex-col overflow-hidden">
        <CardHeader className="p-4 border-b border-stone-100">
          <CardTitle className="text-lg font-serif">Messages</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <Input placeholder="Search contacts..." className="pl-9 h-9 text-sm bg-stone-50 border-none focus-visible:ring-1 focus-visible:ring-stone-200" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {contacts.map(contact => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  selectedContact?.id === contact.id ? "bg-stone-100" : "hover:bg-stone-50"
                )}
              >
                <Avatar className="h-10 w-10 border border-stone-200">
                  <AvatarImage src={contact.photoURL} />
                  <AvatarFallback className="bg-stone-200 text-stone-600">
                    {contact.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-stone-900 truncate">{contact.displayName}</p>
                    <span className="text-[10px] text-stone-400">12:45 PM</span>
                  </div>
                  <p className="text-xs text-stone-500 truncate capitalize">{contact.role}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 border-stone-200 shadow-sm flex flex-col overflow-hidden relative bg-white">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-stone-200">
                  <AvatarImage src={selectedContact.photoURL} />
                  <AvatarFallback className="bg-stone-200 text-stone-600">
                    {selectedContact.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-stone-900">{selectedContact.displayName}</p>
                  <p className="text-[10px] text-green-600 font-medium">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900"><Phone size={18} /></Button>
                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900"><Video size={18} /></Button>
                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900"><MoreVertical size={18} /></Button>
              </div>
            </div>

            {/* Messages List */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                        isMe ? "bg-stone-900 text-stone-100 rounded-tr-none" : "bg-stone-100 text-stone-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 px-1">
                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </span>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-100 bg-stone-50/50 flex gap-3">
              <Input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-white border-stone-200 rounded-xl focus-visible:ring-stone-800"
              />
              <Button type="submit" size="icon" className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-lg">
                <Send size={18} />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Your Conversations</h3>
            <p className="max-w-xs">Select a contact from the left to start messaging with teachers or parents.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
