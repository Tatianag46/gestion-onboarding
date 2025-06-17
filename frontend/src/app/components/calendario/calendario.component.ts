import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones de FullCalendar
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { Router } from '@angular/router';
import { ColaboradoresService, Colaborador } from '../../services/colaboradores.service';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule
  ],

  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})

export class OnboardingCalendarComponent implements OnInit {

  calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin
    ],

    initialView: 'dayGridMonth',
    firstDay: 1,
    weekends: true,
    locale: esLocale,
    headerToolbar: {

      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek'

    },

    events: [],
    eventDidMount: this.handleEventDidMount.bind(this),
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(
    private colaboradoresService: ColaboradoresService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOnboardingDates();
  }

  loadOnboardingDates(): void {
    this.colaboradoresService.getColaboradores().subscribe({
      next: (colaboradores) => {
        const groupedEvents: { [key: string]: { count: number; collaborators: string[] } } = {};
        colaboradores.forEach(colab => {
          if (colab.fecha_onboarding && colab.tipo_onboarding_tecnico) {
            const tipo = colab.tipo_onboarding_tecnico.trim();
            const fecha = colab.fecha_onboarding;
            if (tipo !== 'Journey to Cloud' && tipo !== 'Otros') return;
            const day = new Date(fecha).getDate();
            const dayOfWeek = new Date(fecha).getDay();

            const isInvalid =
              dayOfWeek === 6 || dayOfWeek === 7 ||
              (tipo === 'Journey to Cloud' && day % 2 !== 0) ||
              (tipo === 'Otros' && day % 2 === 0);

            if (isInvalid) return;
            const dateKey = `${fecha}|${tipo}`;

            if (!groupedEvents[dateKey]) {
              groupedEvents[dateKey] = { count: 0, collaborators: [] };
            }

            groupedEvents[dateKey].count++;
            groupedEvents[dateKey].collaborators.push(
              colab.nombre_completo?.split(' ')[0] || 'Colab.'
            );
          }
        });

        const events: EventInput[] = [];
        for (const dateKey in groupedEvents) {
          const [dateString, tipo] = dateKey.split('|');
          const { count, collaborators } = groupedEvents[dateKey];

          events.push({
            title: `${count} ${tipo}`,
            start: dateString,
            allDay: false,
            extendedProps: {
              tipo,
              colaboradoresCount: count,
              nombresCompletos: collaborators.join(', ')
            },

            color: this.getEventColor(tipo),
            id: `${dateString}-${tipo}`
          });
        }

        this.calendarOptions.events = events;
        console.log('Eventos válidos cargados:', events);
      },

      error: (error) => {
        console.error('Error al cargar fechas:', error);
        alert('Error al cargar calendario: ' + (error.error?.message || error.message));
      }
    });
  }

  getEventColor(tipo: string | null): string {
    switch (tipo) {
      case 'Journey to Cloud':
        return '#CC4700';
      case 'Otros':
        return '#28a745';
      default:
        return '#666';
    }
  }

  handleEventDidMount(info: any) {
    const event = info.event;
    const eventDate = new Date(event.start);
    const dayOfMonth = eventDate.getDate();
    const dayOfWeek = eventDate.getDay();
    const tipoOnboarding = event.extendedProps['tipo'];

    const isInvalidDate =
      (dayOfWeek === 6 || dayOfWeek === 7) || // Fines de semana (Viernes o Sábado) son inválidos
      (tipoOnboarding === 'Journey to Cloud' && dayOfMonth % 2 !== 0) || // Journey es inválido si la fecha es IMPAR
      (tipoOnboarding === 'Otros' && dayOfMonth % 2 === 0); // Otros es inválido si la fecha es PAR
    let invalidReason = '';

    if (dayOfWeek === 6 || dayOfWeek === 7) {
      invalidReason = ' (Fin de semana no permitido)';
    } else if (tipoOnboarding === 'Journey to Cloud' && dayOfMonth % 2 !== 0) {
      invalidReason = ' (Día impar no permitido para Journey)';
    } else if (tipoOnboarding === 'Otros' && dayOfMonth % 2 === 0) {
      invalidReason = ' (Día par no permitido para Otros)';
    }
    info.el.title = `¡Fecha no válida! ${event.extendedProps['colaboradoresCount'] || ''} ${event.extendedProps['tipo']} - <span class="math-inline">\{event\.extendedProps\['nombresCompletos'\] \|\| ''\}</span>{invalidReason}`;
  }

  handleEventClick(clickInfo: any) {
    let details = `Tipo: ${clickInfo.event.extendedProps['tipo']}\n`;
    if (clickInfo.event.extendedProps['colaboradoresCount']) {
      details += `Total Colaboradores: ${clickInfo.event.extendedProps['colaboradoresCount']}\n`;
    }

    if (clickInfo.event.extendedProps['nombresCompletos']) {
      details += `Nombres: ${clickInfo.event.extendedProps['nombresCompletos']}\n`;
    }
    details += `Fecha: ${clickInfo.event.startStr.split('T')[0]}\nHora: 8 AM - 12 PM`;

    if (confirm(`Detalles del evento:\n${details}`)) {
      console.log('Evento clickeado, detalles completos:', clickInfo.event.extendedProps);
    }
  }
}

