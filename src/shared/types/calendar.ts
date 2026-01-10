import type { Customer } from "./customer.ts";
import type { Service } from "./service.ts";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface Appointment {
  id: number,
  customer: Customer,
  teamMembers: Array<any>,
  service: Service,
  location: {
    id: number,
    name: string,
    address: string,
    description: string,
    phone: string,
    email: string,
  },
  scheduledAt: Date,
  endsAt: Date,
  status: string,
  notes: string,
  price: number,
  cancellationReason: string,
  createdAt: Date,
  updatedAt: Date,
}

export interface AppointmentSection {
  date: Date,
  appointments: Array<Appointment>
}