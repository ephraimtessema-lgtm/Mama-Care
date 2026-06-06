import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getUsername, getFlowerName } from '@/lib/displayName';
import UserAvatar from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getUserProfile,
  updateUserProfile,
  updateFlowerName,
  pickRandomFlowerName,
  FLOWER_NAMES,
} from '@/api/userProfile';
import {
  LANGUAGES,
  mergePreferences,
  loadLocalPreferences,
  saveLocalPreferences,
  formatDisplayDate,
} from '@/lib/userSettings';
import { applyAppLanguage, setDocumentLanguage } from '@/lib/runtimeLanguage';
import { isAdmin, isDoctor } from '@/lib/roles';
import {
  Phone,
  Mail,
  Calendar,
  Bell,
  Globe,
  Shield,
  MessageCircle,
  Info,
  AlertTriangle,
  MapPin,
  BookOpen,
  Loader2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import packageJson from '../../package.json';
import EthiopiaFlag from '@/components/EthiopiaFlag';
import { openNearestHospitalMaps } from '@/lib/nearestHospital';

function SettingsSection({ title, icon: Icon, children, className = '' }) {
  return (
    <section
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-rose-100 dark:border-gray-800 shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-rose-50 dark:border-gray-800 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-rose-500 shrink-0" />}
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flowerSaving, setFlowerSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [locatingHospital, setLocatingHospital] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [flowerName, setFlowerName] = useState('');
  const [customFlower, setCustomFlower] = useState('');
  const [prefs, setPrefs] = useState(() => mergePreferences(null));

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const profile = await getUserProfile(user.id);
        if (cancelled) return;
        setFullName(profile?.full_name || user.full_name || '');
        setPhone(profile?.phone || user.phone || '');
        setDueDate(profile?.due_date || user.due_date || '');
        setBabyBirthDate(profile?.baby_birth_date || user.baby_birth_date || '');
        setFlowerName(profile?.flower_name || getFlowerName(user) || '');
        const merged = mergePreferences(profile?.preferences || loadLocalPreferences(user.id));
        setPrefs(merged);
        setDocumentLanguage(merged.language);
      } catch (e) {
        console.error(e);
        setFullName(user.full_name || '');
        setFlowerName(getFlowerName(user) || '');
        setPrefs(loadLocalPreferences(user.id));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3500);
  };

  const findNearestHospital = async () => {
    setLocatingHospital(true);
    try {
      await openNearestHospitalMaps();
      flash('Opening hospitals near your current location…');
    } catch (e) {
      flash(e?.message || 'Could not open maps with your location.');
    } finally {
      setLocatingHospital(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        due_date: dueDate || null,
        baby_birth_date: babyBirthDate || null,
      });
      await refreshUser?.();
      flash('Profile saved.');
    } catch (e) {
      flash(e?.message || 'Could not save profile. Run migration 005 in Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async (nextPrefs, { languageChanged = false } = {}) => {
    if (!user?.id) return;
    setPrefs(nextPrefs);
    setDocumentLanguage(nextPrefs.language);
    try {
      await updateUserProfile(user.id, { preferences: nextPrefs });
    } catch {
      saveLocalPreferences(user.id, nextPrefs);
    }
    if (languageChanged) {
      await applyAppLanguage(nextPrefs.language, { userInitiated: true });
    }
  };

  const changeFlower = async (name) => {
    if (!user?.id || !name) return;
    setFlowerSaving(true);
    try {
      await updateFlowerName(user.id, name);
      setFlowerName(name);
      setCustomFlower('');
      await refreshUser?.();
      flash(`Flower name updated to ${name}.`);
    } catch (e) {
      flash(e?.message || 'Could not update flower name.');
    } finally {
      setFlowerSaving(false);
    }
  };

  const updateNotif = (key, value) => {
    const next = {
      ...prefs,
      notifications: { ...prefs.notifications, [key]: value },
    };
    savePreferences(next);
  };

  const updatePrivacy = (key, value) => {
    const next = {
      ...prefs,
      privacy: { ...prefs.privacy, [key]: value },
    };
    savePreferences(next);
  };

  const updateCommunity = (key, value) => {
    const next = {
      ...prefs,
      community: { ...prefs.community, [key]: value },
    };
    savePreferences(next);
  };

  if (!user) return null;

  const username = getUsername(user);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gray-50 dark:bg-gray-950 py-8 px-4 pb-16">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
          <Link to="/" className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
            ← Home
          </Link>
        </div>

        {message && (
          <p className="text-sm text-center bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl py-2 px-4">
            {message}
          </p>
        )}

        {/* Header card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-rose-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Profile */}
        <SettingsSection title="Profile" icon={Sparkles}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400">Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="Your name (private)"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <Input value={user.email || ''} disabled className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800" />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Email is managed through your login account.</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Phone number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="+251 9xx xxx xxx"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Due date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 rounded-xl"
              />
              {dueDate && (
                <p className="text-xs text-rose-600 mt-1">Due: {formatDisplayDate(dueDate)}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-500">Baby birth date (if already delivered)</Label>
              <Input
                type="date"
                value={babyBirthDate}
                onChange={(e) => setBabyBirthDate(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-rose-500 hover:bg-rose-600"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </SettingsSection>

        {/* Flower name */}
        <SettingsSection title="Change flower name" icon={Sparkles}>
          <p className="text-xs text-gray-500 -mt-2">
            Your anonymous name in Forum and Mom Chat. Others do not see your real name.
          </p>
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-rose-600 dark:text-rose-300 mb-1">Current flower name</p>
            <p className="text-lg font-semibold text-rose-800 dark:text-rose-200">🌸 {flowerName || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FLOWER_NAMES.map((name) => (
              <Button
                key={name}
                type="button"
                variant={flowerName === name ? 'default' : 'outline'}
                size="sm"
                className={`rounded-xl text-xs h-9 ${
                  flowerName === name ? 'bg-rose-500 hover:bg-rose-600' : ''
                }`}
                disabled={flowerSaving}
                onClick={() => changeFlower(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customFlower}
              onChange={(e) => setCustomFlower(e.target.value)}
              placeholder="Or type a flower name"
              className="rounded-xl flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl shrink-0"
              disabled={flowerSaving || !customFlower.trim()}
              onClick={() => changeFlower(customFlower.trim())}
            >
              Set
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-rose-600 rounded-xl text-sm"
            disabled={flowerSaving}
            onClick={() => changeFlower(pickRandomFlowerName())}
          >
            🎲 Surprise me with a random name
          </Button>
        </SettingsSection>

        {/* Emergency — high visibility */}
        <SettingsSection
          title="Emergency support"
          icon={AlertTriangle}
          className="border-red-200 dark:border-red-900 ring-1 ring-red-100 dark:ring-red-950"
        >
          <p className="text-xs text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 -mt-2">
            If you or your baby may be in danger, call immediately or go to the nearest hospital.
          </p>
          <a href="tel:8044" className="block">
            <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white h-12 text-base font-bold gap-2">
              <Phone className="w-5 h-5" />
              Call pregnancy hotline: 8044
            </Button>
          </a>
          <Link to="/articles?category=emergency_signs" className="block">
            <Button variant="outline" className="w-full rounded-xl border-red-200 text-red-700 gap-2">
              <BookOpen className="w-4 h-4" />
              Emergency warning signs (library)
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl gap-2"
            disabled={locatingHospital}
            onClick={findNearestHospital}
          >
            {locatingHospital ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {locatingHospital ? 'Getting your location…' : 'Find nearest hospital (maps)'}
          </Button>
          <p className="text-[10px] text-gray-400 text-center">
            Uses your device GPS — allow location when your browser asks.
          </p>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <ToggleRow
            label="Daily pregnancy tips"
            checked={prefs.notifications.dailyTips}
            onCheckedChange={(v) => updateNotif('dailyTips', v)}
          />
          <Separator />
          <ToggleRow
            label="Appointment reminders"
            checked={prefs.notifications.appointmentReminders}
            onCheckedChange={(v) => updateNotif('appointmentReminders', v)}
          />
          <Separator />
          <ToggleRow
            label="Community replies"
            checked={prefs.notifications.communityReplies}
            onCheckedChange={(v) => updateNotif('communityReplies', v)}
          />
          <Separator />
          <ToggleRow
            label="Weekly baby growth updates"
            checked={prefs.notifications.weeklyBabyGrowth}
            onCheckedChange={(v) => updateNotif('weeklyBabyGrowth', v)}
          />
          <p className="text-[10px] text-gray-400">
            Controls in-app notifications (bell icon). Appointment, chat, and forum alerts appear there.
          </p>
        </SettingsSection>

        {/* Language */}
        <SettingsSection title="Language" icon={Globe}>
          <Label className="text-xs text-gray-500">App language</Label>
          <Select
            value={prefs.language}
            onValueChange={(code) =>
              savePreferences({ ...prefs, language: code }, { languageChanged: true })
            }
          >
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Changes apply across the app. Switching back to English may refresh the page once.
          </p>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy & safety" icon={Shield}>
          <div>
            <Label className="text-xs text-gray-500">Who can message me</Label>
            <Select
              value={prefs.privacy.whoCanMessage}
              onValueChange={(v) => updatePrivacy('whoCanMessage', v)}
            >
              <SelectTrigger className="rounded-xl mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone in community</SelectItem>
                <SelectItem value="flower_only">Only people who know my flower name</SelectItem>
                <SelectItem value="none">No one (block messages)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ToggleRow
            label="Show profile in community"
            description="Allow others to see your flower name in lists"
            checked={prefs.privacy.showProfileInCommunity}
            onCheckedChange={(v) => updatePrivacy('showProfileInCommunity', v)}
          />
          <Separator />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Blocked users</p>
            <p className="text-xs text-gray-500">
              {(prefs.privacy.blockedUsers?.length || 0) === 0
                ? 'No blocked users yet.'
                : `${prefs.privacy.blockedUsers.length} blocked`}
            </p>
          </div>
          <a href="mailto:mamacareeth@gmail.com?subject=Mama-Care%20—%20Report%20abuse">
            <Button variant="outline" className="w-full rounded-xl text-sm">
              Report abuse / get help
            </Button>
          </a>
        </SettingsSection>

        {/* Community */}
        <SettingsSection title="Community" icon={MessageCircle}>
          <ToggleRow
            label="Allow direct messages"
            checked={prefs.community.allowDirectMessages}
            onCheckedChange={(v) => updateCommunity('allowDirectMessages', v)}
          />
          <Separator />
          <ToggleRow
            label="Show flower name publicly"
            checked={prefs.community.showFlowerNamePublicly}
            onCheckedChange={(v) => updateCommunity('showFlowerNamePublicly', v)}
          />
          <Separator />
          <ToggleRow
            label="Community participation"
            checked={prefs.community.participationEnabled}
            onCheckedChange={(v) => updateCommunity('participationEnabled', v)}
          />
        </SettingsSection>

        {/* About the app */}
        <SettingsSection title="About Mama-Care" icon={Info}>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Mama-Care is a private pregnancy support platform for Ethiopian mothers — AI guidance,
            doctor booking, community chat, and trusted health articles in one safe place.
          </p>

          <div className="rounded-xl border border-rose-100 dark:border-gray-700 bg-rose-50/50 dark:bg-gray-800/50 p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Developer</p>
            <p className="text-gray-700 dark:text-gray-300">Ephraim Tessema</p>
            <a
              href="mailto:ephraimtessema@gmail.com"
              className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Mail className="w-4 h-4 shrink-0" />
              ephraimtessema@gmail.com
            </a>
            <a
              href="tel:+251938126346"
              className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Phone className="w-4 h-4 shrink-0" />
              +251 938 126 346
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              Support email:{' '}
              <a href="mailto:mamacareeth@gmail.com" className="text-rose-600 dark:text-rose-400 hover:underline">
                mamacareeth@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-1 text-sm">
            <a
              href="https://github.com/ephraimtessema-lgtm/Mama-Care"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-rose-600 dark:text-rose-400 hover:underline"
            >
              Terms of Service
            </a>
            <a
              href="https://github.com/ephraimtessema-lgtm/Mama-Care"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-rose-600 dark:text-rose-400 hover:underline"
            >
              Privacy Policy
            </a>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2">
            App version {packageJson.version || '0.0.0'} · Made with ❤️ in
            <EthiopiaFlag className="w-4 h-3" /> Ethiopia
          </p>
        </SettingsSection>

        {/* Dashboard links + sign out */}
        <div className="space-y-2 pt-2">
          {isAdmin(user) && (
            <Link to="/admin">
              <Button variant="outline" className="w-full rounded-xl">
                Admin dashboard
              </Button>
            </Link>
          )}
          {isDoctor(user) && (
            <Link to="/doctor">
              <Button variant="outline" className="w-full rounded-xl">
                Doctor dashboard
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 gap-2"
            onClick={() => logout(false)}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
