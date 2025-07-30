export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface Appointment {
  id: number;
  client: { name: string; initials: string; avatar: string };
  service: string;
  time: string;
  date: Date;
  status: 'completed' | 'pending' | 'no-show';
  location: string;
  teamMembers: string[];
  seriesId?: string;
} 