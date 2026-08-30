import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { PH, Card, Chip } from '@/components/shared/FigmaComponents';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  type: 'MILESTONE' | 'DELIVERY' | 'TASK' | 'LEAVE';
}

const EVENT_COLORS: Record<string, string> = {
  MILESTONE: 'bg-primary',
  DELIVERY: 'bg-amber-400',
  TASK: 'bg-emerald-500',
  LEAVE: 'bg-red-500',
};

const CHIP_COLORS: Record<string, "blue" | "yellow" | "green" | "red" | "gray"> = {
  MILESTONE: 'blue',
  DELIVERY: 'yellow',
  TASK: 'green',
  LEAVE: 'red',
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    apiClient.get<any>('/calendar').then(res => {
      if (res.success && res.data) {
        setEvents(Array.isArray(res.data) ? res.data : res.data.events || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: Array<number | null> = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1)
  ];

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day: number | null): CalendarEvent[] => {
    if (!day) return [];
    return events.filter(e => {
      const d = new Date(e.start);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  const today = new Date();

  const monthsList = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = -2; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({
        date: d,
        label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        isSelected: d.getFullYear() === year && d.getMonth() === month,
        isCurrent: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(),
      });
    }
    return list;
  }, [year, month]);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Calendar" sub="Project milestones, deliveries & key dates" />

      {/* Horizontally Scrollable Month Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth no-scrollbar">
        {monthsList.map((mItem, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentDate(mItem.date)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              mItem.isSelected
                ? 'bg-primary text-white border-primary shadow-sm'
                : mItem.isCurrent
                ? 'bg-white text-primary border-primary/40 hover:bg-primary/5'
                : 'bg-white text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {mItem.label}
          </button>
        ))}
      </div>

      <Card noPad>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-extrabold text-foreground">{monthLabel}</span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 px-2 pt-2 border-b border-border pb-2 bg-muted/10">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2">
          {cells.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            
            return (
              <div key={idx} className="min-h-[48px] p-1 rounded-lg hover:bg-muted/30 transition-colors">
                {day && (
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-primary text-white font-bold shadow-sm' : 'text-foreground'}`}>
                      {day}
                    </span>
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.type] || 'bg-muted-foreground'}`} />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground opacity-30" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="pt-2">
        <h3 className="text-xs font-bold text-foreground mb-3">Upcoming Events</h3>
        <Card noPad>
          {upcomingEvents.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-muted-foreground">No upcoming events</div>
          ) : (
            upcomingEvents.map((ev, i) => {
              const date = new Date(ev.start);
              return (
                <div key={ev.id || i} className={`flex items-center gap-3 px-4 py-3 ${i < upcomingEvents.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-9 h-9 rounded-lg bg-secondary flex flex-col items-center justify-center flex-shrink-0 border border-border">
                    <span className="text-[9px] font-bold text-primary uppercase leading-none">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xs font-black text-foreground leading-none mt-0.5">{date.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{ev.type}</p>
                  </div>
                  <Chip color={CHIP_COLORS[ev.type] || 'gray'}>{ev.type}</Chip>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
