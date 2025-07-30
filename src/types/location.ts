export interface WorkingHoursDay {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface WorkingHours {
  monday: WorkingHoursDay;
  tuesday: WorkingHoursDay;
  wednesday: WorkingHoursDay;
  thursday: WorkingHoursDay;
  friday: WorkingHoursDay;
  saturday: WorkingHoursDay;
  sunday: WorkingHoursDay;
}

export interface LocationType {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  description: string;
  workingHours: WorkingHours;
  status: 'active' | 'inactive';
  createdAt: string;
} 