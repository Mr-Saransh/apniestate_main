import React from 'react';
import { Truck, Star, AlertTriangle, Clock } from 'lucide-react';
import { BarChartWidget } from '@/components/charts/ChartComponents';

interface VendorPerformance {
  name: string;
  type: string;
  rating: number;
  lateDeliveries: number;
  averageDeliveryTime: number;
  isBlocked: boolean;
}

interface VendorIntelligenceWidgetProps {
  vendors: VendorPerformance[];
}

export const VendorIntelligenceWidget: React.FC<VendorIntelligenceWidgetProps> = ({ vendors }) => {
  if (!vendors || vendors.length === 0) return null;

  return (
    <div className="premium-widget animate-in">
      <div className="widget-header">
        <h3 className="widget-title">
          <Truck size={18} color="var(--color-primary)" />
          Vendor Intelligence
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '16px' }}>
        
        {/* Vendor List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Top Vendor Performance</h4>
          {vendors.map((v, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{v.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{v.type.replace(/_/g, ' ')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>
                  <Star size={14} fill="#F59E0B" /> {v.rating.toFixed(1)}
                </div>
                {v.lateDeliveries > 0 ? (
                  <span style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '2px' }}><AlertTriangle size={10} /> {v.lateDeliveries} Late</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '2px' }}><Clock size={10} /> {v.averageDeliveryTime}d Avg</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Ratings Chart */}
        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Average Ratings</h4>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <BarChartWidget data={vendors} xKey="name" dataKeys={['rating']} colors={['#F59E0B']} />
          </div>
        </div>

      </div>
    </div>
  );
};
