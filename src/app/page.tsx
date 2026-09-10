import { getBranding } from "@/lib/branding";
import HomeClient from "./home-client";

export default async function HomePage() {
  const branding = await getBranding();
  return <HomeClient branding={branding} />;
}
