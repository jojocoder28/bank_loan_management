"use server";

import dbConnect from "@/lib/mongodb";
import Banner, { IBanner } from "@/models/banner";
import Benefit, { IBenefit } from "@/models/benefit";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function seedDefaultData() {
  const bannerCount = await Banner.countDocuments();
  const benefitCount = await Benefit.countDocuments();

  if (bannerCount === 0) {
    await Banner.insertMany([
      {
        title: "Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD",
        subtitle: "For Teachers, By Teachers",
        description: "Your trusted financial partner, dedicated to serving the teacher community with integrity and excellence. Grow your savings with Share, Guaranteed, and Thrift funds.",
        bgGradient: "from-blue-600/20 via-indigo-600/10 to-transparent",
        ctaText: "Become a Member",
        ctaLink: "/dashboard",
        isActive: true,
        order: 0,
      },
      {
        title: "Flexible & Fair Loans Up to ₹6,00,000",
        subtitle: "Competitive Interest Rates",
        description: "Get access to credit when you need it. Transparent terms, easy repayment structures, and quick approvals directly managed by teachers.",
        bgGradient: "from-emerald-600/20 via-teal-600/10 to-transparent",
        ctaText: "Calculate Repayments",
        ctaLink: "/calculator",
        isActive: true,
        order: 1,
      },
      {
        title: "Earn 10-12% Annual Dividends",
        subtitle: "Share Fund Growth",
        description: "Maximize the return on your cooperative contributions. Benefit from yearly dividend payouts on share funds during the Durga Puja festival.",
        bgGradient: "from-amber-600/20 via-orange-600/10 to-transparent",
        ctaText: "Contact Support",
        ctaLink: "/contact-us",
        isActive: true,
        order: 2,
      }
    ]);
  }

  if (benefitCount === 0) {
    await Benefit.insertMany([
      {
        title: "Annual Durga Puja Dividend",
        description: "10-12% on Share Fund",
        icon: "TrendingUp",
        isActive: true,
        order: 0,
      },
      {
        title: "One-Day Picnic",
        description: "Fully Co-operative Sponsored",
        icon: "UserCheck",
        isActive: true,
        order: 1,
      },
      {
        title: "Annual Tour Support",
        description: "Contribution from Profits",
        icon: "Landmark",
        isActive: true,
        order: 2,
      },
      {
        title: "Yearly Gift",
        description: "Yearly Gift",
        icon: "Award",
        isActive: true,
        order: 3,
      }
    ]);
  }
}

export async function getBanners(onlyActive = false): Promise<IBanner[]> {
  await dbConnect();
  await seedDefaultData();
  const query = onlyActive ? { isActive: true } : {};
  const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(banners));
}

export async function getBenefits(onlyActive = false): Promise<IBenefit[]> {
  await dbConnect();
  await seedDefaultData();
  const query = onlyActive ? { isActive: true } : {};
  const benefits = await Benefit.find(query).sort({ order: 1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(benefits));
}

export async function upsertBanner(
  id: string | null,
  data: {
    title: string;
    subtitle?: string;
    description: string;
    imageUrl?: string;
    bgGradient?: string;
    ctaText?: string;
    ctaLink?: string;
    isActive: boolean;
    order: number;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  if (!data.title || !data.description) {
    return { error: "Title and description are required." };
  }

  try {
    await dbConnect();
    if (id) {
      await Banner.findByIdAndUpdate(id, { $set: data });
    } else {
      await Banner.create(data);
    }
    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/dashboard");
    return { success: "Banner saved successfully." };
  } catch (error) {
    console.error("Upsert Banner Error:", error);
    return { error: "An unexpected error occurred while saving the banner." };
  }
}

export async function upsertBenefit(
  id: string | null,
  data: {
    title: string;
    description: string;
    icon: string;
    isActive: boolean;
    order: number;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  if (!data.title || !data.description || !data.icon) {
    return { error: "Title, description, and icon are required." };
  }

  try {
    await dbConnect();
    if (id) {
      await Benefit.findByIdAndUpdate(id, { $set: data });
    } else {
      await Benefit.create(data);
    }
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: "Benefit saved successfully." };
  } catch (error) {
    console.error("Upsert Benefit Error:", error);
    return { error: "An unexpected error occurred while saving the benefit." };
  }
}

export async function deleteBanner(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  try {
    await dbConnect();
    await Banner.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/dashboard");
    return { success: "Banner deleted successfully." };
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return { error: "An unexpected error occurred while deleting the banner." };
  }
}

export async function deleteBenefit(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  try {
    await dbConnect();
    await Benefit.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: "Benefit deleted successfully." };
  } catch (error) {
    console.error("Delete Benefit Error:", error);
    return { error: "An unexpected error occurred while deleting the benefit." };
  }
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  try {
    await dbConnect();
    await Banner.findByIdAndUpdate(id, { $set: { isActive } });
    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/dashboard");
    return { success: `Banner status ${isActive ? 'enabled' : 'disabled'}.` };
  } catch (error) {
    console.error("Toggle Banner Status Error:", error);
    return { error: "An unexpected error occurred while changing status." };
  }
}

export async function toggleBenefitStatus(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized access." };
  }

  try {
    await dbConnect();
    await Benefit.findByIdAndUpdate(id, { $set: { isActive } });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: `Benefit status ${isActive ? 'enabled' : 'disabled'}.` };
  } catch (error) {
    console.error("Toggle Benefit Status Error:", error);
    return { error: "An unexpected error occurred while changing status." };
  }
}
