import config from "@/config/config";

class BaseApiModule {

  public readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${['development', 'production'].includes(config.APP_ENV) ? 'https': 'http'}://${config.API_URL}`
  }

}

export default BaseApiModule;
