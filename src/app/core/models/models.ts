export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Meeting {
  id: string;
  title: string;
  organizer: string;
  roomId: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  attendeesCount: number;
}

export type NewMeeting = Omit<Meeting, 'id'>;

export interface FreeSlot {
  startTime: string;
  endTime: string;
  durationInMinutes: number;
}
