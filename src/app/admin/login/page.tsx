import { getBranding } from "@/lib/branding";
import AdminLoginForm from "./login-form";
import CafeLogo from "@/components/cafe-logo";

export default async function AdminLoginPage() {
  const branding = await getBranding();
  const year = new Date().getFullYear();

  return (
    <main className="order-bg relative flex min-h-screen min-h-dvh flex-col items-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-brand bg-brand-surface shadow-md">
            <CafeLogo
              branding={branding}
              size="lg"
              className="h-full w-full max-w-none object-contain p-2"
            />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-heading">
            {branding.appName}
          </h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-brand-subtle">
            Admin Portal
          </p>
        </div>

        <div className="card space-y-5 shadow-lg">
          <div className="text-center">
            <h2 className="text-lg font-bold text-cafe-900">Welcome back</h2>
            <p className="mt-1 text-sm text-cafe-600">
              Sign in to manage menu and orders
            </p>
          </div>

          <AdminLoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-brand-subtle">
          © {year} {branding.appName}
        </p>
      </div>
    </main>
  );
}
