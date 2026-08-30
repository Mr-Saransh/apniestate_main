import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Building,
  Phone,
  Save,
  X,
  Edit2,
  Globe,
  MapPin,
  CreditCard,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { apiClient } from '@/api/client';
import { subscriptionApi, type CompanyEntitlements } from '@/api/subscription';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editState, setEditState] = useState(user?.state || '');

  const [companyName, setCompanyName] = useState('Loading...');
  const [editCompanyName, setEditCompanyName] = useState('');

  const [entitlements, setEntitlements] = useState<CompanyEntitlements | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmittingFeedback(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmittingFeedback(false);
    setFeedbackSuccess(true);
    setFeedback('');
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  useEffect(() => {
    if (user?.company_id) {
      apiClient
        .get<any>('/companies/me')
        .then((res) => {
          if (res.success && res.data) {
            setCompanyName(res.data.name);
            setEditCompanyName(res.data.name);
          } else {
            setCompanyName('Not found');
          }
        })
        .catch(() => setCompanyName('Error loading'));
    } else {
      setCompanyName('No active workspace');
    }

    subscriptionApi
      .getEntitlements()
      .then((res) => {
        if (res.success && res.data) {
          setEntitlements(res.data);
        }
      })
      .catch(() => {});
  }, [user?.company_id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const [userRes, compRes] = await Promise.all([
        usersApi.update(user.id, { name: editName, phone: editPhone, city: editCity, state: editState }),
        user.role === 'BUILDER'
          ? apiClient.patch<any>('/companies/me', { name: editCompanyName })
          : Promise.resolve({ success: true, data: { name: companyName } }),
      ]);

      if (userRes.success) {
        updateUser({ ...user, name: editName, phone: editPhone, city: editCity, state: editState });
      }

      if (compRes.success && compRes.data?.name) {
        setCompanyName(compRes.data.name);
      }

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 ml-4 mr-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <PH title={t('profile.title', 'My Profile')} sub={t('profile.personalInfo', 'Manage your account settings')} />
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 mr-3 px-3.5 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditName(user?.name || '');
                setEditPhone(user?.phone || '');
                setEditCompanyName(companyName);
                setError('');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-bold hover:bg-muted/80 transition-colors"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Saving...' : t('profile.saveChanges', 'Save Changes')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      {/* Subscription & Plan Entitlement Card */}
      {entitlements && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-[#1C2541] border border-white/10 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2648E7]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] flex items-center justify-center shadow-lg shadow-[#2648E7]/30 shrink-0">
                  {entitlements.plan_id === 'PLAN_100K' ? (
                    <Sparkles size={24} className="text-[#FCC300]" />
                  ) : (
                    <Zap size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{entitlements.plan_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FCC300]/20 text-[#FCC300] border border-[#FCC300]/30">
                      {entitlements.badge || 'Commercial'}
                    </span>
                    {entitlements.is_demo && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Active Projects Quota: <strong>{entitlements.active_projects_count}</strong> of{' '}
                    <strong>{entitlements.max_projects === -1 ? 'Unlimited' : entitlements.max_projects}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/subscription')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:from-[#1e3bbd] hover:to-[#2648E7] text-white shadow-lg shadow-[#2648E7]/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Change / Upgrade Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Quota Progress Bar */}
            {entitlements.max_projects !== -1 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Project Usage</span>
                  <span>
                    {entitlements.active_projects_count} / {entitlements.max_projects} Active
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      entitlements.active_projects_count >= entitlements.max_projects
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (entitlements.active_projects_count / entitlements.max_projects) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Features Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Construction ERP (BOQ, DPR, Workers, Attendance)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {entitlements.has_crm ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-slate-200">Real Estate CRM Included (Leads, Deals, Follow-ups)</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} className="text-[#FCC300] shrink-0" />
                    <span className="text-slate-400">CRM Workspace Locked (Requires ₹1,00,000 Plan)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Information Card */}
      <Card noPad>
        <div className="p-6 flex flex-col items-center border-b border-border text-center relative">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <User size={40} />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-lg font-bold text-center border-b-2 border-primary focus:outline-none bg-transparent mt-2 py-1 px-2"
              placeholder="Your Name"
            />
          ) : (
            <h2 className="text-lg font-bold text-foreground">{user?.name || 'Admin'}</h2>
          )}
          <p className="text-sm font-medium text-primary mt-1">
            {user?.role ? user.role.replace(/_/g, ' ') : 'BUILDER'}
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address (Read-only)</p>
              <p className="text-sm font-semibold truncate text-muted-foreground">{user?.email || 'admin@gmail.com'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-sm font-semibold border-b-2 border-primary focus:outline-none bg-transparent mt-1 py-1 px-2"
                  placeholder="+91..."
                />
              ) : (
                <p className="text-sm font-semibold truncate">{user?.phone || 'Not set'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-1/2 text-sm font-semibold border-b-2 border-primary focus:outline-none bg-transparent py-1 px-2"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-1/2 text-sm font-semibold border-b-2 border-primary focus:outline-none bg-transparent py-1 px-2"
                    placeholder="State"
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold truncate">
                  {user?.city && user?.state ? `${user.city}, ${user.state}` : 'Location not set'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Building size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Company / Workspace Name</p>
              {isEditing && user?.role === 'BUILDER' ? (
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full text-sm font-semibold border-b-2 border-primary focus:outline-none bg-transparent mt-1 py-1 px-2"
                  placeholder="Workspace Name"
                />
              ) : (
                <p className="text-sm font-semibold truncate text-muted-foreground">{companyName}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Language Preferences */}
      <Card noPad>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Globe size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('profile.language', 'Language')}</p>
                <p className="text-sm font-semibold text-foreground">
                  {i18n.language === 'hi' ? t('profile.hindi', 'Hindi') : t('profile.english', 'English')}
                </p>
              </div>
            </div>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-[#2648E7] text-gray-900"
            >
              <option value="en">{t('profile.english', 'English')}</option>
              <option value="hi">{t('profile.hindi', 'Hindi (हिंदी)')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Feedback Card */}
      <Card noPad>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-foreground">Send Feedback</h3>
            <p className="text-xs text-muted-foreground">We value your input. Let us know how we can improve.</p>
            <form onSubmit={handleFeedbackSubmit} className="mt-2 space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Type your feedback here..."
                className="w-full h-24 p-3 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary resize-none"
                required
              />
              {feedbackSuccess ? (
                <div className="text-sm text-green-600 font-bold bg-green-50 p-2 rounded-md text-center">
                  Thank you for your feedback!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submittingFeedback || !feedback.trim()}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              )}
            </form>
          </div>
        </div>
      </Card>

      <button
        onClick={logout}
        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 mt-4 hover:bg-red-100 transition-colors"
      >
        {t('profile.logout', 'Sign Out')}
      </button>
    </div>
  );
}
