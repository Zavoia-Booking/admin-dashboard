import BaseApiModule from "./Base.api.module";

class BusinessApiModule extends BaseApiModule {
  readonly controller: string;

  constructor() {
    super();
    this.controller = 'business';
  }

  createBusiness(): string {
    const methodUrl = "create"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`;
  }

//   getBusiness(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}`;
//   }

//   updateBusiness(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}`;
//   }

//   deleteBusiness(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}`;
//   }

//   addService(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/services`;
//   }

//   updateService(businessId: string, serviceId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/services/${serviceId}`;
//   }

//   deleteService(businessId: string, serviceId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/services/${serviceId}`;
//   }

//   listServices(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/services`;
//   }

//   inviteTeamMember(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/invite`;
//   }

//   listTeamMembers(businessId: string): string {
//     return `${this.baseUrl}/${this.controller}/${businessId}/team`;
//   }
}

export default BusinessApiModule; 