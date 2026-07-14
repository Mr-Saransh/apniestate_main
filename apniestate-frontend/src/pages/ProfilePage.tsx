import React, { useState } from 'react';
import { User, Mail, Building, Phone, Save, X, Edit2, Globe } from 'lucide-react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  
  const [companyName, setCompanyName] = useState('Loading...');
  const [editCompanyName, setEditCompanyName] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user?.company_id) {
      import('@/api/client').then(({ apiClient }) => {
        apiClient.get<any>('/companies/me').then(res => {
          if (res.success && res.data) {
            setCompanyName(res.data.name);
            setEditCompanyName(res.data.name);
          } else {
            setCompanyName('Not found');
          }
        }).catch(() => setCompanyName('Error loading'));
      });
    } else {
      setCompanyName('No active workspace');
    }
  }, [user?.company_id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const { apiClient } = await import('@/api/client');
      
      const [userRes, compRes] = await Promise.all([
        usersApi.update(user.id, { name: editName, phone: editPhone }),
        user.role === 'BUILDER' ? apiClient.patch<any>('/companies/me', { name: editCompanyName }) : Promise.resolve({ success: true, data: { name: companyName } })
      ]);

      if (userRes.success) {
        updateUser({ ...user, name: editName, phone: editPhone });
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
    <div className="space-y-4 ml-4 mr-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <PH title={t('profile.title', 'My Profile')} sub={t('profile.personalInfo', 'Manage your account settings')} />
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 mr-3 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
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

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <Card noPad>
        <div className="p-6 flex flex-col items-center border-b border-border text-center relative">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <User size={40} />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="text-lg font-bold text-center border-b-2 border-primary focus:outline-none bg-transparent mt-2 py-1 px-2"
              placeholder="Your Name"
            />
          ) : (
            <h2 className="text-lg font-bold text-foreground">{user?.name || 'Admin'}</h2>
          )}
          <p className="text-sm font-medium text-primary mt-1">{user?.role ? user.role.replace(/_/g, ' ') : 'BUILDER'}</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Mail size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address (Read-only)</p>
              <p className="text-sm font-semibold truncate text-muted-foreground">{user?.email || 'admin@gmail.com'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Phone size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full text-sm font-semibold border-b-2 border-primary focus:outline-none bg-transparent mt-1 py-1 px-2"
                  placeholder="+91..."
                />
              ) : (
                <p className="text-sm font-semibold truncate">{user?.phone || 'Not set'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Building size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Company / Workspace Name</p>
              {isEditing && user?.role === 'BUILDER' ? (
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={e => setEditCompanyName(e.target.value)}
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

      <Card noPad>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Globe size={16} className="text-muted-foreground" /></div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('profile.language', 'Language')}</p>
                <p className="text-sm font-semibold text-foreground">{i18n.language === 'hi' ? t('profile.hindi', 'Hindi') : t('profile.english', 'English')}</p>
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

      <button onClick={logout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 mt-4 hover:bg-red-100 transition-colors">
        {t('profile.logout', 'Sign Out')}
      </button>
    </div>
  );
}
