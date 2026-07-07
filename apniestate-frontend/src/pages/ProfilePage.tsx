import React from 'react';
import { User, Mail, Building, Phone, MapPin } from 'lucide-react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="My Profile" sub="Manage your account settings" />
      
      <Card noPad>
        <div className="p-6 flex flex-col items-center border-b border-border text-center">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <User size={40} />
          </div>
          <h2 className="text-lg font-bold text-foreground">{user?.email || 'admin@gmail.com'}</h2>
          <p className="text-sm font-medium text-primary mt-1">{user?.role || 'BUILDER'}</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Mail size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</p>
              <p className="text-sm font-semibold truncate">{user?.email || 'admin@gmail.com'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Building size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Company ID</p>
              <p className="text-sm font-semibold truncate">{user?.company_id || 'Apni Estate Demo'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Phone size={16} className="text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
              <p className="text-sm font-semibold truncate">+92 300 1234567</p>
            </div>
          </div>
        </div>
      </Card>
      
      <button className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 mt-4">
        Sign Out
      </button>
    </div>
  );
}
