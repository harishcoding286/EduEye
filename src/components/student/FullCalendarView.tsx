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
  // Format events for FullCalendar using the #3368A0, #66A3BF, #C8DFDB scheme
  const fcEvents = events.map((evt) => {
    const isRemediation = evt.category === 'REMEDIATION_LOCK';
    const isCompleted = evt.status === 'COMPLETED';
    const isClass = evt.category === 'CLASS';

    let bgColor = '#edf5f4'; // Light tint of #C8DFDB
    let borderColor = '#C8DFDB';
    let textColor = '#3368A0';

    if (isRemediation) {
      if (isCompleted) {
        bgColor = '#e6f2f0';
        borderColor = '#66A3BF';
        textColor = '#3368A0';
      } else {
        bgColor = '#fffbeb';
        borderColor = '#f59e0b';
        textColor = '#92400e';
      }
    } else if (isClass) {
      bgColor = '#eef5fc';
      borderColor = '#66A3BF';
      textColor = '#3368A0';
    } else {
      bgColor = '#f8fafc';
      borderColor = '#e2e8f0';
      textColor = '#64748b';
    }

    return {
      id: evt.id,
      title: evt.title,
      start: evt.startTime,
      end: evt.endTime,
      backgroundColor: bgColor,
      borderColor: borderColor,
      textColor: textColor,
      extendedProps: { rawEvent: evt },
    };
  });

  return (
    <div className="fullcalendar-aero-container p-2 rounded-2xl bg-white/70 border border-[#C8DFDB] shadow-xs">
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
