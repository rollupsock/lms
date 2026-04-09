import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarView() {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const eventsSnap = await getDocs(collection(db, 'events'));
      const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Add some mock events if none exist
      if (eventsData.length === 0) {
        setEvents([
          { id: '1', title: 'Ramadan Starts', start: new Date(2026, 2, 1), type: 'holiday', description: 'Beginning of the holy month of Ramadan.' },
          { id: '2', title: 'Eid al-Fitr', start: new Date(2026, 2, 31), type: 'holiday', description: 'Celebration of breaking the fast.' },
          { id: '3', title: 'Arabic Grammar Exam', start: new Date(), type: 'exam', description: 'Final assessment for Level 1.' },
          { id: '4', title: 'Parent-Teacher Meeting', start: new Date(new Date().getTime() + 86400000 * 2), type: 'event', description: 'Quarterly review of student progress.' },
        ]);
      } else {
        setEvents(eventsData);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start.seconds ? event.start.seconds * 1000 : event.start);
    return date && eventDate.toDateString() === date.toDateString();
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-green-100 text-green-700 border-green-200';
      case 'exam': return 'bg-red-100 text-red-700 border-red-200';
      case 'event': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-stone-900">{t('calendar')}</h1>
        <p className="text-stone-500">Stay updated with school events, holidays, and exam schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Card */}
        <Card className="lg:col-span-2 border-stone-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row h-full">
              <div className="p-6 border-r border-stone-100 bg-stone-50/50">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-none"
                  modifiers={{
                    event: events.map(e => new Date(e.start.seconds ? e.start.seconds * 1000 : e.start))
                  }}
                  modifiersStyles={{
                    event: { fontWeight: 'bold', textDecoration: 'underline', color: '#44403c' }
                  }}
                />
              </div>
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    {date?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <Badge variant="outline" className="text-stone-500">
                    {selectedDateEvents.length} Events
                  </Badge>
                </div>

                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {selectedDateEvents.length > 0 ? (
                      selectedDateEvents.map(event => (
                        <div key={event.id} className="p-4 rounded-xl border border-stone-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={cn("px-2 py-0.5 text-[10px] uppercase tracking-wider", getEventTypeColor(event.type))}>
                              {event.type}
                            </Badge>
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <Clock size={12} /> 09:00 AM
                            </span>
                          </div>
                          <h4 className="font-bold text-stone-900 mb-1">{event.title}</h4>
                          <p className="text-sm text-stone-600 leading-relaxed">{event.description}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                            <span className="flex items-center gap-1"><MapPin size={12} /> Main Hall</span>
                            <span className="flex items-center gap-1"><Info size={12} /> Mandatory</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                        <CalendarIcon size={48} className="mb-4 opacity-20" />
                        <p>No events scheduled for this day.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Upcoming Highlights</CardTitle>
              <CardDescription>Don't miss these important dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.slice(0, 4).map(event => (
                <div key={event.id} className="flex gap-4 items-start p-3 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-stone-100 text-stone-600 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <span className="text-xs font-bold uppercase">{new Date(event.start.seconds ? event.start.seconds * 1000 : event.start).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(event.start.seconds ? event.start.seconds * 1000 : event.start).getDate()}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-stone-900 group-hover:text-stone-700">{event.title}</h5>
                    <p className="text-xs text-stone-500 line-clamp-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-stone-900 text-stone-100 border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-stone-100">Holiday Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-300 leading-relaxed">
                The Madrassa will be closed for the last 10 days of Ramadan to allow students and staff to focus on worship.
              </p>
              <Button variant="outline" className="w-full mt-4 border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white">
                View Holiday Policy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
