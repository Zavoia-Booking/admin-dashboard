import AuthApiModule from "./modules/Auth.api.module";
import BaseApiModule from "./modules/Base.api.module";

class WebApi {

  public readonly base: BaseApiModule;
//   public readonly admin: AdminApiModule;
  public readonly auth: AuthApiModule;
//   public readonly business: BusinessApiModule;
//   public readonly schedule: ScheduleApiModule;
//   public readonly specialist: SpecialistApiModule;
//   public readonly user: UserApiModule;

  constructor() {
    this.base = new BaseApiModule();
    // this.admin = new AdminApiModule();
    this.auth = new AuthApiModule();
    // this.business = new BusinessApiModule();
    // this.schedule = new ScheduleApiModule();
    // this.specialist = new SpecialistApiModule();
    // this.user = new UserApiModule();
  }

}

const webApiInstance = new WebApi();

export default webApiInstance;
