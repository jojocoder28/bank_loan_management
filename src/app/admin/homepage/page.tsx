"use client";

import { useEffect, useState } from "react";
import {
  getBanners,
  getBenefits,
  upsertBanner,
  upsertBenefit,
  deleteBanner,
  deleteBenefit,
  toggleBannerStatus,
  toggleBenefitStatus,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { IBanner } from "@/models/banner";
import { IBenefit } from "@/models/benefit";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  UserCheck,
  Landmark,
  Award,
  Handshake,
  PiggyBank,
  HeartHandshake,
  Users,
  ShieldCheck,
  Mail,
  Settings as SettingsIcon,
  HelpCircle,
  Briefcase,
  CircleDollarSign,
  Loader2,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

const IconMap: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  UserCheck,
  Landmark,
  Award,
  Handshake,
  PiggyBank,
  HeartHandshake,
  Users,
  ShieldCheck,
  Mail,
  SettingsIcon,
  HelpCircle,
  Briefcase,
  CircleDollarSign,
};

const GradientPresets = [
  { value: "from-blue-600/20 via-indigo-600/10 to-transparent", name: "Classic Ocean (Blue)" },
  { value: "from-emerald-600/20 via-teal-600/10 to-transparent", name: "Forest Growth (Green)" },
  { value: "from-amber-600/20 via-orange-600/10 to-transparent", name: "Sunset Gold (Amber)" },
  { value: "from-purple-600/20 via-pink-600/10 to-transparent", name: "Royal Orchid (Purple)" },
  { value: "from-rose-600/20 via-red-600/10 to-transparent", name: "Velvet Crimson (Rose)" },
  { value: "from-slate-800/40 via-zinc-800/20 to-transparent", name: "Premium Slate (Dark)" },
];

export default function AdminHomepageConfigPage() {
  const [activeTab, setActiveTab] = useState("banners");
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [benefits, setBenefits] = useState<IBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Modals state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<IBanner | null>(null);

  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<IBenefit | null>(null);

  // Banner Form State
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    bgGradient: "from-blue-600/20 via-indigo-600/10 to-transparent",
    ctaText: "",
    ctaLink: "",
    isActive: true,
    order: 0,
  });

  // Benefit Form State
  const [benefitForm, setBenefitForm] = useState({
    title: "",
    description: "",
    icon: "TrendingUp",
    isActive: true,
    order: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedBanners = await getBanners();
      const fetchedBenefits = await getBenefits();
      setBanners(fetchedBanners);
      setBenefits(fetchedBenefits);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "Failed to load homepage configuration.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBannerModal = (banner: IBanner | null) => {
    if (banner) {
      setSelectedBanner(banner);
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || "",
        description: banner.description,
        imageUrl: banner.imageUrl || "",
        bgGradient: banner.bgGradient || "from-blue-600/20 via-indigo-600/10 to-transparent",
        ctaText: banner.ctaText || "",
        ctaLink: banner.ctaLink || "",
        isActive: banner.isActive,
        order: banner.order,
      });
    } else {
      setSelectedBanner(null);
      setBannerForm({
        title: "",
        subtitle: "",
        description: "",
        imageUrl: "",
        bgGradient: "from-blue-600/20 via-indigo-600/10 to-transparent",
        ctaText: "",
        ctaLink: "",
        isActive: true,
        order: banners.length,
      });
    }
    setBannerModalOpen(true);
  };

  const handleOpenBenefitModal = (benefit: IBenefit | null) => {
    if (benefit) {
      setSelectedBenefit(benefit);
      setBenefitForm({
        title: benefit.title,
        description: benefit.description,
        icon: benefit.icon,
        isActive: benefit.isActive,
        order: benefit.order,
      });
    } else {
      setSelectedBenefit(null);
      setBenefitForm({
        title: "",
        description: "",
        icon: "TrendingUp",
        isActive: true,
        order: benefits.length,
      });
    }
    setBenefitModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertBanner(selectedBanner ? selectedBanner._id.toString() : null, bannerForm);
      if (res.error) {
        toast({ variant: "destructive", title: "Save Failed", description: res.error });
      } else {
        toast({ title: "Success", description: res.success });
        setBannerModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertBenefit(selectedBenefit ? selectedBenefit._id.toString() : null, benefitForm);
      if (res.error) {
        toast({ variant: "destructive", title: "Save Failed", description: res.error });
      } else {
        toast({ title: "Success", description: res.success });
        setBenefitModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await deleteBanner(id);
      if (res.error) {
        toast({ variant: "destructive", title: "Delete Failed", description: res.error });
      } else {
        toast({ title: "Deleted", description: res.success });
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this benefit?")) return;
    try {
      const res = await deleteBenefit(id);
      if (res.error) {
        toast({ variant: "destructive", title: "Delete Failed", description: res.error });
      } else {
        toast({ title: "Deleted", description: res.success });
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    }
  };

  const handleToggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleBannerStatus(id, !currentStatus);
      if (res.error) {
        toast({ variant: "destructive", title: "Update Failed", description: res.error });
      } else {
        toast({ title: "Status Updated", description: res.success });
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    }
  };

  const handleToggleBenefit = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleBenefitStatus(id, !currentStatus);
      if (res.error) {
        toast({ variant: "destructive", title: "Update Failed", description: res.error });
      } else {
        toast({ title: "Status Updated", description: res.success });
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred." });
    }
  };

  if (loading && banners.length === 0 && benefits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-sm">Loading homepage settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Card className="border-primary/20 shadow-lg shadow-primary/5">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="size-6 text-primary animate-pulse" />
              Homepage Customization Panel
            </CardTitle>
            <CardDescription>
              Configure the dynamic sliding advertisement banners and core benefits showcase without touch coding. Changes reflect instantly.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => (activeTab === "banners" ? handleOpenBannerModal(null) : handleOpenBenefitModal(null))}
              className="shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-2 size-4" />
              {activeTab === "banners" ? "Add Slider Banner" : "Add Benefit Card"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="banners" className="text-sm font-medium">Sliding Banners</TabsTrigger>
          <TabsTrigger value="benefits" className="text-sm font-medium">Benefits Showcase</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {banners.map((banner) => (
              <Card key={banner._id.toString()} className="flex flex-col overflow-hidden border border-border hover:shadow-md transition-shadow">
                <div className={`h-24 bg-gradient-to-r ${banner.bgGradient || "from-blue-600/20 via-indigo-600/10 to-transparent"} p-4 flex flex-col justify-end border-b`}>
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Order: {banner.order}</span>
                  <h3 className="font-bold text-base line-clamp-1">{banner.title}</h3>
                </div>
                <CardContent className="flex-1 p-4 space-y-2">
                  {banner.subtitle && <p className="text-xs text-primary font-medium">{banner.subtitle}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-3">{banner.description}</p>
                  {(banner.ctaText || banner.ctaLink) && (
                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                      {banner.ctaText && <span className="bg-secondary px-2.5 py-1 rounded-full font-medium">Button: {banner.ctaText}</span>}
                      {banner.ctaLink && <span className="bg-secondary px-2.5 py-1 rounded-full font-mono text-muted-foreground truncate max-w-[200px]">Link: {banner.ctaLink}</span>}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 bg-muted/40 flex items-center justify-between border-t gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`banner-switch-${banner._id}`}
                      checked={banner.isActive}
                      onCheckedChange={() => handleToggleBanner(banner._id.toString(), banner.isActive)}
                    />
                    <Label htmlFor={`banner-switch-${banner._id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                      {banner.isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => handleOpenBannerModal(banner)}>
                      <Edit className="size-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 hover:bg-destructive/10" onClick={() => handleDeleteBanner(banner._id.toString())}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          {banners.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground text-sm">
              No sliding banners found. Click "Add Slider Banner" to create one.
            </div>
          )}
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const BenefitIcon = IconMap[benefit.icon] || HelpCircle;
              return (
                <Card key={benefit._id.toString()} className="flex flex-col border border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                      <BenefitIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Order: {benefit.order}</span>
                      </div>
                      <CardTitle className="text-base font-semibold truncate mt-1">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-0 px-6">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{benefit.description}</p>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/40 flex items-center justify-between border-t gap-2 mt-auto">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`benefit-switch-${benefit._id}`}
                        checked={benefit.isActive}
                        onCheckedChange={() => handleToggleBenefit(benefit._id.toString(), benefit.isActive)}
                      />
                      <Label htmlFor={`benefit-switch-${benefit._id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                        {benefit.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => handleOpenBenefitModal(benefit)}>
                        <Edit className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 hover:bg-destructive/10" onClick={() => handleDeleteBenefit(benefit._id.toString())}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {benefits.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground text-sm">
              No benefits cards found. Click "Add Benefit Card" to create one.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Banner Edit/Add Modal */}
      <Dialog open={bannerModalOpen} onOpenChange={setBannerModalOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <form onSubmit={handleSaveBanner}>
            <DialogHeader>
              <DialogTitle>{selectedBanner ? "Edit Sliding Advertisement" : "Add Sliding Advertisement"}</DialogTitle>
              <DialogDescription>Create or edit marketing texts and media displayed in the sliding homepage advertisement space.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-title">Main Title *</Label>
                  <Input
                    id="banner-title"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="e.g. Flexible Low-Interest Loans"
                    required
                  />
                </div>
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-subtitle">Subtitle / Badge</Label>
                  <Input
                    id="banner-subtitle"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="e.g. Exclusive Perk"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="banner-description">Description Text *</Label>
                <Textarea
                  id="banner-description"
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  placeholder="Provide a detailed description of this financial option, banner offer, or notification."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-gradient">Background Styling Gradient</Label>
                  <Select
                    value={bannerForm.bgGradient}
                    onValueChange={(val) => setBannerForm({ ...bannerForm, bgGradient: val })}
                  >
                    <SelectTrigger id="banner-gradient">
                      <SelectValue placeholder="Select styled gradient" />
                    </SelectTrigger>
                    <SelectContent>
                      {GradientPresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-image">Custom Image URL (Optional)</Label>
                  <Input
                    id="banner-image"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-cta-text">Button Text (CTA)</Label>
                  <Input
                    id="banner-cta-text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    placeholder="e.g. Apply Now"
                  />
                </div>
                <div className="grid gap-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="banner-cta-link">Button Redirect Link</Label>
                  <Input
                    id="banner-cta-link"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    placeholder="e.g. /apply-loan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="grid gap-2">
                  <Label htmlFor="banner-order">Display Sequence Order</Label>
                  <Input
                    id="banner-order"
                    type="number"
                    value={bannerForm.order}
                    onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="banner-active"
                    checked={bannerForm.isActive}
                    onCheckedChange={(val) => setBannerForm({ ...bannerForm, isActive: val })}
                  />
                  <Label htmlFor="banner-active">Active and displayed</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBannerModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 animate-spin size-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Benefit Edit/Add Modal */}
      <Dialog open={benefitModalOpen} onOpenChange={setBenefitModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveBenefit}>
            <DialogHeader>
              <DialogTitle>{selectedBenefit ? "Edit Benefit Card" : "Add Benefit Card"}</DialogTitle>
              <DialogDescription>Create or edit user benefit items displayed on the homepage showcase grid.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="benefit-title">Benefit Title *</Label>
                <Input
                  id="benefit-title"
                  value={benefitForm.title}
                  onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                  placeholder="e.g. Low Interest Loans"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="benefit-description">Short Description *</Label>
                <Textarea
                  id="benefit-description"
                  value={benefitForm.description}
                  onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  placeholder="Explain the benefit in a simple sentence."
                  rows={2}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="benefit-icon">Icon Style *</Label>
                <Select
                  value={benefitForm.icon}
                  onValueChange={(val) => setBenefitForm({ ...benefitForm, icon: val })}
                >
                  <SelectTrigger id="benefit-icon">
                    <SelectValue placeholder="Choose an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(IconMap).map((iconName) => (
                      <SelectItem key={iconName} value={iconName}>
                        <span className="flex items-center gap-2">
                          {iconName}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="grid gap-2">
                  <Label htmlFor="benefit-order">Display Sequence Order</Label>
                  <Input
                    id="benefit-order"
                    type="number"
                    value={benefitForm.order}
                    onChange={(e) => setBenefitForm({ ...benefitForm, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="benefit-active"
                    checked={benefitForm.isActive}
                    onCheckedChange={(val) => setBenefitForm({ ...benefitForm, isActive: val })}
                  />
                  <Label htmlFor="benefit-active">Active and displayed</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBenefitModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 animate-spin size-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
