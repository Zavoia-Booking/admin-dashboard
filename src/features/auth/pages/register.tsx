import { RegisterForm } from "../components/register-form"

export default function RegisterPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        <RegisterForm />
      </div>
    </div>
  )
}
