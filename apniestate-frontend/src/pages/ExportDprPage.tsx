import React from 'react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { FileDown } from 'lucide-react';

export default function ExportDprPage() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Export DPR" sub="Generate PDF progress reports for external clients" />
      
      <Card title="Report Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Select Project</label>
            <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Downtown Commercial Plaza</option>
              <option>DHA Phase 8 Villas</option>
              <option>Gulshan Residential Complex</option>
              <option>Clifton Heights Tower</option>
              <option>Bahria Commercial Block</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Report Period</label>
            <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Today — 06 Jul 2026</option>
              <option>This Week (30 Jun – 06 Jul)</option>
              <option>This Month (July 2026)</option>
              <option>Custom Date Range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Include in Report</label>
            <div className="space-y-2.5">
              {[
                "Progress photos", 
                "Key activities log", 
                "Material consumption", 
                "Labor attendance", 
                "Safety observations"
              ].map(item => (
                <label key={item} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-primary w-4 h-4 rounded" />
                  <span className="text-xs font-medium text-foreground">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      <button className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-all">
        <FileDown className="w-4 h-4" /> Generate PDF Report
      </button>
    </div>
  );
}
