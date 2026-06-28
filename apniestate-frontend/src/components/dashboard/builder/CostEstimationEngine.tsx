import React, { useState, useEffect } from 'react';
import { Calculator, Download, Save, ArrowRight, Building, FileText, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EstimationInputs {
  projectType: string;
  areaSqft: number;
  floors: number;
  hasBasement: boolean;
  finishingLevel: 'BASIC' | 'STANDARD' | 'PREMIUM';
  materialQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  location: string;
}

interface EstimationResults {
  id: string;
  date: string;
  inputs: EstimationInputs;
  concrete: number; // cu.m
  steel: number; // tons
  bricks: number; // units
  cement: number; // bags
  totalMaterialCost: number;
  totalLabourCost: number;
  equipmentCost: number;
  contingency: number;
  expectedProfit: number;
  grandTotal: number;
}

export const CostEstimationEngine: React.FC = () => {
  const [inputs, setInputs] = useState<EstimationInputs>({
    projectType: 'Residential',
    areaSqft: 1000,
    floors: 1,
    hasBasement: false,
    finishingLevel: 'STANDARD',
    materialQuality: 'MEDIUM',
    location: 'Urban'
  });

  const [results, setResults] = useState<EstimationResults | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<EstimationResults[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('apniestate_estimations');
    if (saved) {
      try {
        setSavedEstimates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved estimations");
      }
    }
  }, []);

  const handleCalculate = () => {
    setIsCalculating(true);
    
    // Simulate complex calculation delay for premium feel
    setTimeout(() => {
      const baseRatePerSqft = inputs.projectType === 'Commercial' ? 1800 : 1500;
      
      let qualityMultiplier = 1.0;
      if (inputs.materialQuality === 'HIGH') qualityMultiplier = 1.3;
      if (inputs.materialQuality === 'LOW') qualityMultiplier = 0.8;

      let finishMultiplier = 1.0;
      if (inputs.finishingLevel === 'PREMIUM') finishMultiplier = 1.4;
      if (inputs.finishingLevel === 'BASIC') finishMultiplier = 0.85;

      const totalBuiltUpArea = inputs.areaSqft * inputs.floors * (inputs.hasBasement ? 1.2 : 1.0);
      
      const estimatedCost = totalBuiltUpArea * baseRatePerSqft * qualityMultiplier * finishMultiplier;
      
      // Rough industry standard ratios for BoQ (Bill of Quantities)
      const concreteVol = totalBuiltUpArea * 0.038; // cubic meters
      const steelTons = totalBuiltUpArea * 0.0035; // tons
      const bricksUnits = totalBuiltUpArea * 8.5; // units
      const cementBags = totalBuiltUpArea * 0.4; // bags

      const materialCost = estimatedCost * 0.60;
      const labourCost = estimatedCost * 0.25;
      const equipmentCost = estimatedCost * 0.05;
      const contingency = estimatedCost * 0.05;
      const expectedProfit = estimatedCost * 0.15; // 15% margin on top of cost

      const newResult: EstimationResults = {
        id: `EST-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        inputs: { ...inputs },
        concrete: Math.round(concreteVol),
        steel: Math.round(steelTons * 10) / 10,
        bricks: Math.round(bricksUnits),
        cement: Math.round(cementBags),
        totalMaterialCost: materialCost,
        totalLabourCost: labourCost,
        equipmentCost,
        contingency,
        expectedProfit,
        grandTotal: estimatedCost + expectedProfit
      };

      setResults(newResult);
      setIsCalculating(false);
    }, 800);
  };

  const handleSave = () => {
    if (!results) return;
    const updated = [results, ...savedEstimates].slice(0, 10); // Keep last 10
    setSavedEstimates(updated);
    localStorage.setItem('apniestate_estimations', JSON.stringify(updated));
    alert('Estimation Saved to Local Storage!');
  };

  const handleExportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(10, 61, 145); // Brand primary
    doc.text('Apni Estate - Construction Cost Estimate', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Estimate ID: ${results.id}`, 14, 30);
    doc.text(`Date: ${new Date(results.date).toLocaleDateString()}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [['Parameter', 'Details']],
      body: [
        ['Project Type', results.inputs.projectType],
        ['Total Built-up Area', `${results.inputs.areaSqft * results.inputs.floors} sq.ft`],
        ['Floors', results.inputs.floors.toString()],
        ['Finishing Level', results.inputs.finishingLevel],
        ['Material Quality', results.inputs.materialQuality],
      ],
      theme: 'grid',
      headStyles: { fillColor: [10, 61, 145] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Material', 'Estimated Quantity']],
      body: [
        ['Concrete (Ready Mix)', `${results.concrete} cu.m`],
        ['Steel (TMT)', `${results.steel} Tons`],
        ['Bricks/Blocks', `${results.bricks} Units`],
        ['Cement', `${results.cement} Bags`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Cost Breakdown', 'Amount (INR)']],
      body: [
        ['Material Cost', `Rs. ${results.totalMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['Labour Cost', `Rs. ${results.totalLabourCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['Equipment & Machinery', `Rs. ${results.equipmentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['Contingency (5%)', `Rs. ${results.contingency.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['Expected Profit Margin', `Rs. ${results.expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['GRAND TOTAL ESTIMATE', `Rs. ${results.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Estimate_${results.id}.pdf`);
  };

  return (
    <div className="premium-widget animate-in" style={{ gridColumn: '1 / -1' }}>
      <div className="widget-header" style={{ marginBottom: '24px' }}>
        <h3 className="widget-title" style={{ fontSize: '18px' }}>
          <Calculator size={22} color="var(--color-primary)" />
          Construction Cost Estimation Engine
        </h3>
      </div>

      <div className="estimation-form">
        <div className="estimation-group">
          <label className="estimation-label">Project Type</label>
          <select className="estimation-select" value={inputs.projectType} onChange={e => setInputs({...inputs, projectType: e.target.value})}>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Villa</option>
            <option>Apartment Complex</option>
            <option>Warehouse</option>
          </select>
        </div>
        
        <div className="estimation-group">
          <label className="estimation-label">Base Area (sq.ft)</label>
          <input type="number" className="estimation-input" value={inputs.areaSqft} onChange={e => setInputs({...inputs, areaSqft: Number(e.target.value)})} />
        </div>

        <div className="estimation-group">
          <label className="estimation-label">Number of Floors</label>
          <input type="number" className="estimation-input" value={inputs.floors} onChange={e => setInputs({...inputs, floors: Number(e.target.value)})} />
        </div>

        <div className="estimation-group">
          <label className="estimation-label">Material Quality</label>
          <select className="estimation-select" value={inputs.materialQuality} onChange={e => setInputs({...inputs, materialQuality: e.target.value as any})}>
            <option value="LOW">Basic / Economical</option>
            <option value="MEDIUM">Standard</option>
            <option value="HIGH">Premium / Luxury</option>
          </select>
        </div>

        <div className="estimation-group">
          <label className="estimation-label">Finishing Level</label>
          <select className="estimation-select" value={inputs.finishingLevel} onChange={e => setInputs({...inputs, finishingLevel: e.target.value as any})}>
            <option value="BASIC">Core & Shell Only</option>
            <option value="STANDARD">Standard Finish</option>
            <option value="PREMIUM">High-end Interior Finish</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button 
          onClick={handleCalculate}
          disabled={isCalculating}
          style={{
            padding: '12px 24px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isCalculating ? 0.7 : 1
          }}
        >
          {isCalculating ? 'Computing Models...' : 'Generate Estimate'} <ArrowRight size={18} />
        </button>
      </div>

      {results && (
        <div className="estimation-results animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>Estimate Generated: {results.id}</h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleExportPDF} style={{ padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> PDF Export
              </button>
              <button onClick={handleSave} style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Save to Dashboard
              </button>
            </div>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Grand Total Estimate</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>₹{(results.grandTotal / 100000).toFixed(2)}L</span>
            </div>
            <div className="result-card">
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Material Cost</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>₹{(results.totalMaterialCost / 100000).toFixed(2)}L</span>
            </div>
            <div className="result-card">
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Labour & Equipment</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>₹{((results.totalLabourCost + results.equipmentCost) / 100000).toFixed(2)}L</span>
            </div>
            <div className="result-card">
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Expected Profit</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>₹{(results.expectedProfit / 100000).toFixed(2)}L</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', background: 'var(--color-bg)', padding: '20px', borderRadius: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} color="var(--color-text-muted)" /> Bill of Quantities (BoQ)
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Concrete (RMC)</span> <strong>{results.concrete} cu.m</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Steel (TMT Bars)</span> <strong>{results.steel} Tons</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Bricks / Blocks</span> <strong>{results.bricks.toLocaleString()} Units</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-muted)' }}>Cement</span> <strong>{results.cement.toLocaleString()} Bags</strong></div>
              </div>
            </div>
            
            {savedEstimates.length > 0 && (
              <div style={{ flex: 1, minWidth: '300px', background: 'var(--color-bg)', padding: '20px', borderRadius: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="var(--color-text-muted)" /> Saved Estimations
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedEstimates.slice(0, 3).map(est => (
                    <div key={est.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{est.inputs.projectType} - {est.inputs.areaSqft * est.inputs.floors} sqft</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(est.date).toLocaleDateString()} • {est.id}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{(est.grandTotal / 100000).toFixed(1)}L
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
