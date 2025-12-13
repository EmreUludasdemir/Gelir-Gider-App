import { Injectable, Logger } from "@nestjs/common";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  recurring?: "daily" | "weekly" | "monthly" | "yearly";
  reminder?: number; // minutes before
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  // Generate iCal format for download
  generateICalEvent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const uid = `${event.id}@gelir-gider.app`;
    const start = formatDate(event.startDate);
    const end = event.endDate
      ? formatDate(event.endDate)
      : formatDate(new Date(event.startDate.getTime() + 3600000));

    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gelir-Gider Takip//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${start}
DTEND:${end}
SUMMARY:${this.escapeIcal(event.title)}`;

    if (event.description) {
      ical += `\nDESCRIPTION:${this.escapeIcal(event.description)}`;
    }

    if (event.reminder) {
      ical += `
BEGIN:VALARM
TRIGGER:-PT${event.reminder}M
ACTION:DISPLAY
DESCRIPTION:Hatırlatma: ${event.title}
END:VALARM`;
    }

    if (event.recurring) {
      const rruleMap = {
        daily: "FREQ=DAILY",
        weekly: "FREQ=WEEKLY",
        monthly: "FREQ=MONTHLY",
        yearly: "FREQ=YEARLY",
      };
      ical += `\nRRULE:${rruleMap[event.recurring]}`;
    }

    ical += `
END:VEVENT
END:VCALENDAR`;

    return ical;
  }

  // Generate multiple events for bills/payments
  generateBillReminders(
    bills: { name: string; dueDate: Date; amount: number }[]
  ): string {
    const events = bills.map((bill, index) => ({
      id: `bill-${index}-${Date.now()}`,
      title: `💳 Fatura: ${bill.name}`,
      description: `Tutar: ₺${bill.amount.toLocaleString("tr-TR")}`,
      startDate: bill.dueDate,
      reminder: 1440, // 1 day before
    }));

    return this.generateMultipleEvents(events);
  }

  // Generate recurring payment reminders
  generateRecurringPaymentCalendar(
    payments: { name: string; amount: number; day: number }[]
  ): string {
    const events: CalendarEvent[] = payments.map((payment, index) => {
      const now = new Date();
      const nextPayment = new Date(
        now.getFullYear(),
        now.getMonth(),
        payment.day
      );
      if (nextPayment < now) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
      }

      return {
        id: `recurring-${index}-${Date.now()}`,
        title: `🔄 ${payment.name}`,
        description: `Tutar: ₺${payment.amount.toLocaleString("tr-TR")}`,
        startDate: nextPayment,
        recurring: "monthly",
        reminder: 1440,
      };
    });

    return this.generateMultipleEvents(events);
  }

  private generateMultipleEvents(events: CalendarEvent[]): string {
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gelir-Gider Takip//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

    events.forEach((event) => {
      const eventIcal = this.generateICalEvent(event);
      // Extract just the VEVENT part
      const vevent = eventIcal.match(/BEGIN:VEVENT[\s\S]*END:VEVENT/)?.[0];
      if (vevent) {
        ical += `\n${vevent}`;
      }
    });

    ical += "\nEND:VCALENDAR";
    return ical;
  }

  private escapeIcal(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  // Google Calendar URL generator
  generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const start = formatGoogleDate(event.startDate);
    const end = event.endDate
      ? formatGoogleDate(event.endDate)
      : formatGoogleDate(new Date(event.startDate.getTime() + 3600000));

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || "",
    });

    if (event.recurring) {
      const rruleMap = {
        daily: "DAILY",
        weekly: "WEEKLY",
        monthly: "MONTHLY",
        yearly: "YEARLY",
      };
      params.append("recur", `RRULE:FREQ=${rruleMap[event.recurring]}`);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}
