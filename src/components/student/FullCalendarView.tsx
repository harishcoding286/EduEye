'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarEvent } from '@/types';

export interface FullCalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const FullCalendarView: React.FC<FullCalendarViewProps> = ({ events, onEventClick }) => {
  // Format events for FullCalendar
  const fcEvents = events.map((evt) => {
    const isRemediation = evt.category === 'REMEDIATION_LOCK';
    const isCompleted = evt.status === 'COMPLETED';
    const isClass = evt.category === 'CLASS';

    let bgColor = '#e0f2fe'; // Light blue
    let borderColor = '#38bdf8';
    let textColor = '#0369a1';

    if (isRemediation) {
      if (isCompleted) {
        bgColor = '#d1fae5';
        borderColor = '#34d399';
        textColor = '#065f46';
      } else {
        bgColor = '#fef3c7';
        borderColor = '#f59e0b';
        textColor = '#92400e';
      }
    } else if (isClass) {
      bgColor = '#dbeafe';
      borderColor = '#60a5fa';
      textColor = '#1e40af';
    } else {
      bgColor = '#f1f5f9';
      borderColor = '#cbd5e1';
      textColor = '#475569';
    }

    return {
      id: evt.id,
      title: `${isRemediation ? (isCompleted ? '🌸 ' : '⚡ ') : isClass ? '🎒 ' : '☕ '}${evt.title}`,
      start: evt.startTime,
      end: evt.endTime,
      backgroundColor: bgColor,
      borderColor: borderColor,
      textColor: textColor,
      extendedProps: { rawEvent: evt },
    };
  });

  return (
    <div className="fullcalendar-aero-container p-2 rounded-2xl bg-white/60 border border-white/90 shadow-inner">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        events={fcEvents}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const raw = info.event.extendedProps.rawEvent as CalendarEvent;
          if (raw) {
            onEventClick(raw);
          }
        }}
        height="auto"
        nowIndicator={true}
        expandRows={true}
      />
    </div>
  );
};

export default FullCalendarView;
