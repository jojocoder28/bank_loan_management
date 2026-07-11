import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getBanners, getBenefits } from "./admin/homepage/actions";
import { HomeLandingPage } from "./_components/home-landing-page";

export default async function RootPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "admin") {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  // Fetch active banners and benefits
  const banners = await getBanners(true);
  const benefits = await getBenefits(true);

  return <HomeLandingPage banners={banners} benefits={benefits} />;
}
