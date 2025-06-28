import WebApi from '@/helpers/api/WebApi';
import WebRequest from '@/helpers/api/WebRequest';
import { makeAutoObservable, runInAction, action } from 'mobx';
import { UserRole } from '@/types/auth';

// Business interface based on existing business models in the application
export interface Business {
    name: string;
    legal_name: string;
    email: string;
    phone: string;
//   id?: string;
//   name: string;
//   heroText: string;
//   about: string;
//   contact: {
//     email: string;
//     phone: string;
//     address: string;
//   };
//   images?: {
//     id: string;
//     url: string;
//     type: 'slideshow' | 'hero' | 'logo';
//     order?: number;
//   }[];
//   workingHours: {
//     day: string;
//     open: string;
//     close: string;
//     isClosed: boolean;
//   }[];
//   location: {
//     address: string;
//     city: string;
//     state: string;
//     zipCode: string;
//     country: string;
//     coordinates?: {
//       lat: number;
//       lng: number;
//     };
//   };
//   displayedSpecialists?: string[]; // Array of specialist IDs
//   services?: {
//     id?: string;
//     name: string;
//     price: number;
//     duration: number;
//     description: string;
//   }[];
//   ownerId?: string;
}

export class BusinessStore {
  business: Business | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  
  constructor() {
    makeAutoObservable(this, {
      // Mark actions explicitly to optimize performance
      createBusiness: action.bound,
    //   updateBusiness: action.bound,
    //   fetchBusiness: action.bound,
      setLoading: action.bound,
      setError: action.bound,
    }, { autoBind: true });
  }

  // Simple state setters
  setBusiness(business: Business | null) {
    this.business = business;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  createBusiness = async (businessData: Business): Promise<boolean> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });
      
      const { response, data }: any = await WebRequest.POST(WebApi.business.createBusiness(), businessData);

      console.log(
        'response', data
      );
      
      if ([200, 201].includes(response.status)) {
        runInAction(() => {
          this.business = data;
          this.isLoading = false;
        });
        return true;
      } else {
        runInAction(() => {
          this.error = data?.message || 'Failed to create business';
          this.isLoading = false;
        });
        return false;
      }
    } catch (error) {
      console.error('Business creation failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create business';
        this.isLoading = false;
      });
      return false;
    }
  }

  // Update existing business
//   updateBusiness = async (businessData: Partial<Business>): Promise<boolean> => {
//     try {
//       if (!this.business?.id) {
//         this.setError('No business to update');
//         return false;
//       }

//       runInAction(() => {
//         this.isLoading = true;
//         this.error = null;
//       });
      
//       // Use the actual API endpoint
//       const { response, data }: any = await WebRequest.PUT(
//         WebApi.business.updateBusiness(this.business.id), 
//         businessData
//       );
      
//       if ([200, 201].includes(response.status)) {
//         runInAction(() => {
//           this.business = data;
//           this.isLoading = false;
//         });
//         return true;
//       } else {
//         runInAction(() => {
//           this.error = data?.message || 'Failed to update business';
//           this.isLoading = false;
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Business update failed:', error);
//       runInAction(() => {
//         this.error = error instanceof Error ? error.message : 'Failed to update business';
//         this.isLoading = false;
//       });
//       return false;
//     }
//   }

//   // Fetch business by ID
//   fetchBusiness = async (businessId: string): Promise<boolean> => {
//     try {
//       runInAction(() => {
//         this.isLoading = true;
//         this.error = null;
//       });
      
//       // Use the actual API endpoint
//       const { response, data }: any = await WebRequest.GET(WebApi.business.getBusiness(businessId));
      
//       if ([200].includes(response.status)) {
//         runInAction(() => {
//           this.business = data;
//           this.isLoading = false;
//         });
//         return true;
//       } else {
//         runInAction(() => {
//           this.error = data?.message || 'Failed to fetch business';
//           this.isLoading = false;
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Business fetch failed:', error);
//       runInAction(() => {
//         this.error = error instanceof Error ? error.message : 'Failed to fetch business';
//         this.isLoading = false;
//       });
//       return false;
//     }
//   }
} 