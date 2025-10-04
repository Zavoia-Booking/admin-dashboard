import type { Service } from '../shared/types/service';

export const mockServices: Service[] = [
  {
    id: 1,
    name: 'Haircut',
    price: 30,
    duration: 30,
    description: 'Basic haircut service including consultation and styling',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: ''
  },
  {
    id: 2,
    name: 'Hair Coloring',
    price: 80,
    duration: 120,
    description: 'Full hair coloring service with premium products',
    isActive: true,
    createdAt: '2024-01-20T14:15:00Z',
    updatedAt: ''
  },
  {

    id: 3,
    name: 'Manicure',
    price: 25,
    duration: 45,
    description: 'Classic manicure with polish',
    isActive: true,
    createdAt: '2024-01-25T09:45:00Z',
    updatedAt: ''
  },
  {
    id: 4,
    name: 'Pedicure',
    price: 45,
    duration: 60,
    description: 'Luxury pedicure with massage',
    isActive: true,
    createdAt: '2024-01-30T11:20:00Z',
    updatedAt: ''
  },
  {
    id: 5,
    name: 'Facial Treatment',
    price: 60,
    duration: 60,
    description: 'Deep cleansing facial with mask',
    isActive: true,
    createdAt: '2024-02-05T13:10:00Z',
    updatedAt: ''
  },
  {
    id: 6,
    name: 'Hot Stone Massage',
    price: 120,
    duration: 90,
    description: 'Relaxing hot stone massage therapy',
    isActive: true,
    createdAt: '2024-02-10T16:30:00Z',
    updatedAt: ''
  },
  {
    id: 7,
    name: 'Eyebrow Shaping',
    price: 20,
    duration: 20,
    description: 'Professional eyebrow shaping and trimming',
    isActive: true,
    createdAt: '2024-03-05T13:30:00Z',
    updatedAt: ''
  },
  {
    id: 8,
    name: 'Deep Conditioning',
    price: 40,
    duration: 45,
    description: 'Intensive hair conditioning treatment',
    createdAt: '2024-03-05T13:30:00Z',
    isActive: true,
    updatedAt: ''
  },
  {
    id: 9,
    name: 'Bridal Hair Style',
    price: 200,
    duration: 180,
    description: 'Special occasion bridal hair styling',
    createdAt: '2024-03-01T09:00:00Z',
    isActive: true,
    updatedAt: ''
  },
  {
    id: 10,
    name: 'Swedish Massage',
    price: 100,
    duration: 75,
    description: 'Classic Swedish massage for relaxation',
    createdAt: '2024-03-05T13:30:00Z',
    isActive: true,
    updatedAt: ''
  },
];
