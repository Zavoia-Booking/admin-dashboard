import BaseApiModule from "./Base.api.module";

class AuthApiModule extends BaseApiModule {

  readonly controller: string;

  constructor() {
    super();
    this.controller = 'auth';
  }

  registerRequest(): string {
    const methodUrl = "register"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`
  }

  loginRequest(): string {
    const methodUrl = "login"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`
  }

  logoutRequest(): string {
    const methodUrl = "logout"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`
  }

  confirmLoginRequest(): string {
    const methodUrl = "phone/verify"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`
  }

  getCurrentUser(): string {
    const methodUrl = "me"
    return `${this.baseUrl}/${this.controller}/${methodUrl}`
  }

}

export default AuthApiModule;
