import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, Badge, Spinner } from "@/components/ui";
import useProfile from "@/hooks/useProfile";
import { useToast } from "@/context/ToastContext";
import { signOut } from "@/lib/auth";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { detectIsNigerian, COUNTRIES } from "@/lib/location";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
});

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Section = ({ title, description, children }) => (
  <Card padding="md">
    <div className="mb-4 pb-4 border-b border-gray-50">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    {children}
  </Card>
);

const planConfig = {
  free: { label: "Free", variant: "default" },
  starter: { label: "Starter", variant: "info" },
  pro: { label: "Pro", variant: "success" },
  pro_plus: { label: "Pro+", variant: "brand" },
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);
  const avatarInputRef = useRef(null);

  const {
    profile,
    user,
    isLoading,
    isSaving,
    error,
    updateProfile,
    updatePassword,
  } = useProfile();

  const [nyscStatus, setNyscStatus] = useState(
    () => profile?.nysc_status || "",
  );
  const [voiceSample, setVoiceSample] = useState(
    () => profile?.voice_sample || "",
  );
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatar_url || "");
  const [country, setCountry] = useState(() => profile?.country || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // Save / edit toggle states
  const [countrySaved, setCountrySaved] = useState(false);
  const [editingCountry, setEditingCountry] = useState(false);
  const [nyscSaved, setNyscSaved] = useState(false);
  const [editingNysc, setEditingNysc] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [editingVoice, setEditingVoice] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", email: "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name || "",
        email: user?.email || "",
      });
      const timer = setTimeout(() => {
        setNyscStatus(profile.nysc_status || "");
        setVoiceSample(profile.voice_sample || "");
        setAvatarUrl(profile.avatar_url || "");
        setCountry(profile.country || "");
        if (profile.country) setCountrySaved(true);
        if (profile.nysc_status) setNyscSaved(true);
        if (profile.voice_sample) setVoiceSaved(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [profile?.id, user?.email, profile, resetProfile]);

  const isNigerian = country === "NG" || (!country && detectIsNigerian());

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(err.message || "Failed to upload picture.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar_url: null });
      setAvatarUrl("");
      toast.success("Profile picture removed.");
    } catch {
      toast.error("Failed to remove picture.");
    }
  };

  const onProfileSave = async (data) => {
    try {
      await updateProfile({
        full_name: data.full_name,
        nysc_status: nyscStatus || null,
        voice_sample: voiceSample || null,
      });
      toast.success("Profile updated successfully.");
      resetProfile(data);
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    }
  };

  const onPasswordSave = async (data) => {
    try {
      await updatePassword(data.newPassword);
      toast.success("Password updated successfully.");
      resetPassword();
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      logout();
      navigate("/");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  const handleVoiceSampleSave = async () => {
    try {
      await updateProfile({ voice_sample: voiceSample });
      setVoiceSaved(true);
      setEditingVoice(false);
      toast.success("Voice sample saved.");
    } catch {
      toast.error("Failed to save voice sample.");
    }
  };

  const handleCountrySave = async () => {
    try {
      await updateProfile({ country });
      setCountrySaved(true);
      setEditingCountry(false);
      toast.success("Country saved.");
    } catch {
      toast.error("Failed to save country.");
    }
  };

  const handleNyscSave = async () => {
    try {
      await updateProfile({ nysc_status: nyscStatus });
      setNyscSaved(true);
      setEditingNysc(false);
      toast.success("NYSC status saved.");
    } catch {
      toast.error("Failed to save NYSC status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-coral-600">{error}</p>
      </div>
    );
  }

  const plan = planConfig[profile?.plan] || planConfig.free;

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const voiceWordCount = voiceSample.split(/\s+/).filter(Boolean).length;
  const countryLabel =
    COUNTRIES.find((c) => c.value === country)?.label || country;
  const nyscLabel =
    {
      completed: "Completed",
      ongoing: "Ongoing",
      exempted: "Exempted",
      not_applicable: "Not applicable",
    }[nyscStatus] || nyscStatus;

  // Truncate voice sample for saved preview
  const voicePreview =
    voiceSample.length > 120
      ? voiceSample.slice(0, 120).trim() + "..."
      : voiceSample;

  const savedVoiceWordCount = profile?.voice_sample
    ? profile.voice_sample.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="mx-auto  space-y-5 pb-10">
      {/* ── Profile header ─────────────────────────────── */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-brand-700">
                  {initials}
                </span>
              )}
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-800 transition-colors shadow-card"
            >
              {isUploadingAvatar ? (
                <Spinner
                  size="sm"
                  className="border-white border-t-transparent"
                />
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-base font-semibold text-gray-900 truncate">
              {profile?.full_name || "Your name"}
            </p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
              <Badge variant={plan.variant} size="sm">
                {plan.label} plan
              </Badge>
              {profile?.voice_sample && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                  Voice active
                </span>
              )}
              {user?.created_at && (
                <span className="text-xs text-gray-400">
                  Member since{" "}
                  {new Date(user.created_at).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium"
              >
                {avatarUrl ? "Change picture" : "Upload picture"}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-gray-200 text-xs">·</span>
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/pricing")}
          >
            Upgrade →
          </Button>
        </div>
      </Card>

      {/* ── Two-column grid: Personal details + Voice mirroring ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal details */}
        <Section
          title="Personal details"
          description="Update your name and account information"
        >
          <form
            onSubmit={handleProfileSubmit(onProfileSave)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              <Input
                label="Full name"
                placeholder="James Adeyemi"
                error={profileErrors.full_name?.message}
                {...registerProfile("full_name")}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                hint="Contact support to change"
                disabled
                {...registerProfile("email")}
              />
            </div>
            {profileDirty && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
              >
                Save changes
              </Button>
            )}
          </form>
        </Section>

        {/* ── Voice mirroring ────────────────────────────── */}
        <Section
          title="Voice mirroring"
          description="Paste 200–300 words of your own writing so Seevv rewrites your CV in your voice, not generic AI"
        >
          {/* Saved state */}
          {voiceSaved && !editingVoice ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    ✓ {savedVoiceWordCount} words saved
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic line-clamp-3">
                  {voicePreview}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setEditingVoice(true)}
              >
                Edit
              </Button>
            </div>
          ) : (
            /* Editing state */
            <div>
              <textarea
                value={voiceSample}
                onChange={(e) => setVoiceSample(e.target.value)}
                placeholder="Paste a cover letter, bio, or email you've written — anything that sounds like you..."
                rows={5}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none placeholder:text-gray-400 mb-3"
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs text-gray-400">
                  {voiceWordCount} words
                  {voiceSample.length > 0 && (
                    <span
                      className={
                        voiceWordCount >= 200
                          ? " text-teal-600"
                          : " text-amber-600"
                      }
                    >
                      {voiceWordCount >= 200
                        ? " — good length"
                        : " — aim for 200+"}
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleVoiceSampleSave}
                    isLoading={isSaving}
                    disabled={!voiceSample.trim()}
                  >
                    Save sample
                  </Button>
                  {editingVoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVoice(false);
                        setVoiceSample(profile?.voice_sample || "");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
      {/* end two-column grid */}

      {/* ── Location + Nigeria localisation ───────────── */}
      <Section
        title="Location"
        description="Helps Seevv tailor advice and insights for your job market"
      >
        <div className="space-y-4">
          {/* Country — saved state */}
          {countrySaved && !editingCountry ? (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Country</p>
                <p className="text-sm font-medium text-gray-900">
                  {countryLabel}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCountry(true)}
              >
                Edit
              </Button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country
              </label>
              <div className="flex gap-2">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent bg-white text-gray-900 cursor-pointer"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCountrySave}
                  isLoading={isSaving}
                  disabled={!country}
                >
                  Save
                </Button>
                {editingCountry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCountry(false);
                      setCountry(profile?.country || "");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              {!country && detectIsNigerian() && (
                <p className="mt-1.5 text-xs text-brand-600">
                  We detected you may be in Nigeria —{" "}
                  <button
                    onClick={() => setCountry("NG")}
                    className="font-medium underline cursor-pointer"
                  >
                    confirm Nigeria
                  </button>
                </p>
              )}
            </div>
          )}

          {/* NYSC — only for Nigerian users */}
          {isNigerian && (
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-3">
                Nigeria localisation
              </p>

              {nyscSaved && !editingNysc ? (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">NYSC status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {nyscLabel}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingNysc(true)}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NYSC status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "completed", label: "Completed" },
                      { value: "ongoing", label: "Ongoing" },
                      { value: "exempted", label: "Exempted" },
                      { value: "not_applicable", label: "Not applicable" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNyscStatus(option.value)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          nyscStatus === option.value
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {nyscStatus && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleNyscSave}
                        isLoading={isSaving}
                      >
                        Save NYSC status
                      </Button>
                    )}
                    {editingNysc && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNysc(false);
                          setNyscStatus(profile?.nysc_status || "");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ── Change password + Account — side by side on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="Change password"
          description="Min 8 characters with uppercase, lowercase, and a number"
        >
          <form
            onSubmit={handlePasswordSubmit(onPasswordSave)}
            className="space-y-4"
          >
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.newPassword?.message}
              {...registerPassword("newPassword")}
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword("confirmPassword")}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={passwordSubmitting}
            >
              Update password
            </Button>
          </form>
        </Section>

        <Section title="Account" description="Manage your session and account">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Sign out</p>
                <p className="text-xs text-gray-400">Sign out on this device</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-coral-700">
                  Delete account
                </p>
                <p className="text-xs text-gray-400">
                  Permanently delete all your data
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>

            {showDeleteConfirm && (
              <div className="bg-coral-50 border border-coral-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-coral-800">
                  Are you sure?
                </p>
                <p className="text-xs text-coral-700">
                  This deletes your account, CVs, job targets, and cover letters
                  permanently. Type{" "}
                  <span className="font-mono font-bold">DELETE</span> to
                  confirm.
                </p>
                <Input
                  placeholder="Type DELETE to confirm"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteText !== "DELETE"}
                    onClick={() =>
                      toast.info("Account deletion coming in a future update")
                    }
                  >
                    Delete permanently
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Profile;
