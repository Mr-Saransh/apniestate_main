import React, { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { companiesApi } from '@/api/companies';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { X, LogOut, AlertTriangle, Building2, Shield, User, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout, activeWorkspace } = useAuth();

  // Modal control
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Form Fields
  const [formName, setFormName] = useState(user?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSubmitting(true);

    try {
      const res = await usersApi.update(user.id, {
        name: formName,
        email: formEmail,
        phone: formPhone || undefined
      });

      if (res.success && res.data) {
        updateUser({
          ...user,
          name: formName,
          email: formEmail,
          phone: formPhone || null
        });
        setShowEditModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!activeWorkspace?.company?.id) return;
    setSubmitting(true);
    try {
      await companiesApi.deleteCompany(activeWorkspace.company.id);
      window.location.href = '/companies';
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete workspace');
      setSubmitting(false);
    }
  };

  const role = user?.role === 'BUILDER' || user?.role === 'ADMIN' ? 'Builder (Owner)' : (user?.role || 'User').replace(/_/g, ' ');
  const companyName = activeWorkspace?.company?.name || 'Apni Estate (Pvt.) Ltd.';

  const companySections = [
    { title: "Company Information", icon: <Building2 className="w-4 h-4 text-primary" />, fields: [
      ["Company Name", companyName],
      ["Registered NTN", "4521987-6"],
      ["Registered Address", "Plot 24, I-9/3, Islamabad"],
    ]},
    { title: "Finance & Tax", icon: <Shield className="w-4 h-4 text-primary" />, fields: [
      ["Default Currency", "PKR — Pakistani Rupee"],
      ["GST Rate", "17%"],
      ["WHT Rate (Labor)", "4.5%"],
    ]},
    { title: "Approval Thresholds", icon: <Bell className="w-4 h-4 text-primary" />, fields: [
      ["PO Auto-Approve Below", "₨5,00,000"],
      ["Expense Auto-Approve Below", "₨50,000"],
      ["Invoice Requires CEO Above", "₨1,00,00,000"],
    ]},
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <PH title="Settings" sub="Personal profile and global ERP configuration" />
        <button 
          onClick={logout}
          className="px-3 py-2 bg-secondary text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/10 transition-colors shadow-sm"
        >
          <LogOut className="w-3 h-3" /> Logout
        </button>
      </div>

      <Card title="Personal Profile" noPad>
        <div className="px-4 py-4 flex items-center gap-4 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm">
            {user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{role} · {user?.email}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.phone || 'No phone provided'}</p>
          </div>
          <button 
            onClick={() => setShowEditModal(true)}
            className="text-[10px] bg-secondary text-primary px-3 py-1.5 rounded font-semibold hover:bg-primary/10 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </Card>

      {companySections.map((s, si) => (
        <Card key={si} title={
          <div className="flex items-center gap-2">
            {s.icon}
            <span>{s.title}</span>
          </div>
        } noPad>
          {s.fields.map(([l, v], fi) => (
            <div key={fi} className={`flex items-center justify-between px-4 py-3 ${fi < s.fields.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-xs text-muted-foreground">{l}</span>
              <span className="text-xs font-semibold text-foreground">{v}</span>
            </div>
          ))}
        </Card>
      ))}

      <button className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
        Save Company Settings
      </button>

      {(user?.role === 'BUILDER' || user?.role === 'COMPANY_ADMIN') && (
        <div className="pt-8">
          <Card title={<span className="text-red-500">Danger Zone</span>} noPad>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Delete Workspace</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Permanently delete this company and all its data. This cannot be undone.</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded font-semibold hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
                  <input type="email" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <input type="tel" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-red-50/50 rounded-t-2xl">
              <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Delete Workspace
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-foreground">
                This will permanently delete the workspace <strong>{activeWorkspace?.company?.name}</strong> and all its associated data (projects, sites, users, finances). This action <strong>cannot be undone</strong>.
              </p>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Type "{activeWorkspace?.company?.name}" to confirm
                </label>
                <input 
                  type="text" 
                  className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-red-500" 
                  value={deleteConfirmationText} 
                  onChange={e => setDeleteConfirmationText(e.target.value)} 
                />
              </div>
              
              {formError && <div className="text-red-500 text-xs font-medium">{formError}</div>}
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteCompany}
                  disabled={submitting || deleteConfirmationText !== activeWorkspace?.company?.name} 
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium flex justify-center items-center hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
