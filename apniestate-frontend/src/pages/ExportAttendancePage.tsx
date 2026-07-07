import React from 'react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { Download } from 'lucide-react';

export default function ExportAttendancePage() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Export Attendance" sub="Download labor spreadsheets for corporate audit" />
      
      <Card title="Export Configuration">
        <div className="space-y-4">
          {[
            ["Date From", "date", "2026-07-01"], 
            ["Date To", "date", "2026-07-06"]
          ].map(([l, t, v]) => (
            <div key={l}>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{l}</label>
              <input type={t} defaultValue={v} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          ))}
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Site Filter</label>
            <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>All Sites</option>
              <option>Downtown Commercial Plaza</option>
              <option>Gulshan Residential Complex</option>
              <option>DHA Phase 8 Villas</option>
              <option>Clifton Heights Tower</option>
              <option>Bahria Commercial Block</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Export Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Excel (.xlsx)", "CSV (.csv)"].map((f, fi) => (
                <label key={f} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="att-fmt" defaultChecked={fi === 0} className="accent-primary w-4 h-4" />
                  <span className="text-xs font-medium">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      <button className="w-full py-3.5 bg-amber-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-95 transition-all">
        <Download className="w-4 h-4" /> Download Attendance Report
      </button>
    </div>
  );
}
