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
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  description: string;
  workingHours: WorkingHours;
  isActive: boolean;
  createdAt: string;
  timezone: string;
  isRemote: boolean;
}