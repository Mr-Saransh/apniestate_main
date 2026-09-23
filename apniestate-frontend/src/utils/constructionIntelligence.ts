/**
 * Construction Intelligence & Estimation Auto-Detection Engine
 * 
 * Provides bulletproof unit normalization, numeric sanitization, 
 * discipline classification (Plumbing, Electrical, Painting, Waterproofing, etc.),
 * and industry-standard construction presets.
 */

export interface StandardDisciplineTemplate {
  id: string;
  name: string;
  category: string;
  iconName: string;
  badgeColor: string;
  description: string;
  suggestedItems: {
    name: string;
    unit: string;
    rate: number;
    remarks?: string;
  }[];
}

/**
 * Normalizes all human typo variations of construction units into ISO/Indian standard units.
 */
export function normalizeUnit(rawUnit: string | undefined | null): string {
  if (!rawUnit) return 'nos';
  const clean = rawUnit.toString().trim().toLowerCase().replace(/[.\s_-]/g, '');

  // Volume
  if (['cum', 'cumtr', 'cumt', 'm3', 'cubicmeter', 'cubicmetre', 'cubicm', 'cu'].includes(clean)) return 'cum';
  if (['cft', 'cuft', 'cubicfeet', 'cubicfoot', 'ft3'].includes(clean)) return 'Cft';
  if (['lit', 'litre', 'liter', 'ltr', 'ltrs', 'l'].includes(clean)) return 'Ltr';

  // Weight / Mass
  if (['kg', 'kgs', 'kilogram', 'kilograms', 'kilo'].includes(clean)) return 'kg';
  if (['ton', 'tons', 'tonne', 'tonnes', 'mt', 'metricton'].includes(clean)) return 'Tonnes';
  if (['quintal', 'quintals', 'qtl'].includes(clean)) return 'Quintal';

  // Area
  if (['sqm', 'sqmtr', 'm2', 'squaremeter', 'squaremetre', 'sqmt'].includes(clean)) return 'sqm';
  if (['sqft', 'sft', 'ft2', 'squarefeet', 'squarefoot'].includes(clean)) return 'sqft';

  // Length
  if (['rm', 'rmt', 'rft', 'runningmeter', 'runningmetre', 'runningmtr', 'm', 'meter', 'metre'].includes(clean)) return 'Running meter';
  if (['ft', 'feet', 'foot'].includes(clean)) return 'ft';
  if (['inch', 'inches', 'in'].includes(clean)) return 'inch';

  // Packaging / Counts
  if (['bag', 'bags', 'bori', 'sack', 'sacks'].includes(clean)) return 'bags';
  if (['nos', 'no', 'number', 'numbers', 'piece', 'pieces', 'pcs', 'pc', 'item', 'items', 'each'].includes(clean)) return 'nos';
  if (['set', 'sets', 'kit', 'kits'].includes(clean)) return 'set';
  if (['box', 'boxes', 'carton', 'cartons', 'bundle', 'bundles'].includes(clean)) return 'box';
  if (['roll', 'rolls'].includes(clean)) return 'roll';

  // Contractual / Lumpsum
  if (['ls', 'lumpsum', 'lump', 'job', 'lot', 'overall'].includes(clean)) return 'lumpsum';

  return rawUnit.trim();
}

/**
 * Sanitizes messy user inputs (e.g. "₹ 1,25,000.50", "approx 500", "45.00kg") into clean floats.
 */
export function cleanNumeric(raw: any, fallback = 0): number {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw === 'number') {
    return isNaN(raw) ? fallback : raw;
  }
  const str = raw.toString().replace(/[₹$,\s]/g, '').trim();
  const match = str.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? fallback : val;
  }
  return fallback;
}

/**
 * Detects the civil engineering or MEP discipline based on keywords in the description.
 */
export function detectDiscipline(description: string, currentCategory?: string): string {
  if (currentCategory && currentCategory.trim() && currentCategory !== 'General' && currentCategory !== 'Uncategorized') {
    return currentCategory.trim();
  }

  const d = (description || '').toLowerCase();

  // 1. Plumbing & Sanitary
  if (
    d.includes('pipe') || d.includes('cpvc') || d.includes('upvc') || d.includes('swr') ||
    d.includes('plumbing') || d.includes('sanitary') || d.includes('drainage') ||
    d.includes('basin') || d.includes('toilet') || d.includes('commode') || d.includes('wc') ||
    d.includes('tap') || d.includes('faucet') || d.includes('valve') || d.includes('diverter') ||
    d.includes('shower') || d.includes('trap') || d.includes('gully') || d.includes('manhole') ||
    d.includes('tank') || d.includes('pump') || d.includes('bibcock') || d.includes('cistern') ||
    d.includes('urinal') || d.includes('health faucet') || d.includes('water supply')
  ) {
    return 'Plumbing, Sanitation & Drainage';
  }

  // 2. Electrical & Power
  if (
    d.includes('wire') || d.includes('cable') || d.includes('conduit') || d.includes('switch') ||
    d.includes('socket') || d.includes('mcb') || d.includes('rccb') || d.includes('distribution board') ||
    d.includes('db ') || d.includes('db-') || d.includes('earthing') || d.includes('copper wire') ||
    d.includes('frls') || d.includes('light') || d.includes('fan') || d.includes('exhaust') ||
    d.includes('led') || d.includes('panel') || d.includes('junction box') || d.includes('transformer') ||
    d.includes('electrical') || d.includes('wiring')
  ) {
    return 'Electrical & Power Infrastructure';
  }

  // 3. Painting & Finishing
  if (
    d.includes('paint') || d.includes('putty') || d.includes('primer') || d.includes('emulsion') ||
    d.includes('distemper') || d.includes('weathercoat') || d.includes('texture') || d.includes('pop') ||
    d.includes('false ceiling') || d.includes('gypsum') || d.includes('enamel') || d.includes('polish') ||
    d.includes('whitewash') || d.includes('cornice') || d.includes('apex') || d.includes('finishing')
  ) {
    return 'Painting, Finishing & False Ceiling';
  }

  // 4. Waterproofing & Damp Proofing
  if (
    d.includes('waterproof') || d.includes('damp proof') || d.includes('dpc') || d.includes('membrane') ||
    d.includes('app membrane') || d.includes('tar') || d.includes('bitumen') || d.includes('polymer coating') ||
    d.includes('chemical coating') || d.includes('sealant') || d.includes('terrace waterproof') ||
    d.includes('basement waterproof')
  ) {
    return 'Waterproofing & Damp Proofing';
  }

  // 5. Doors, Windows & Glazing
  if (
    d.includes('door') || d.includes('window') || d.includes('flush door') || d.includes('shutter') ||
    d.includes('choukhat') || d.includes('frame') || d.includes('upvc window') || d.includes('aluminium window') ||
    d.includes('glass') || d.includes('glazing') || d.includes('railing') || d.includes('hinge') ||
    d.includes('lock') || d.includes('mortise') || d.includes('tower bolt') || d.includes('handle') ||
    d.includes('door closer') || d.includes('wood work') || d.includes('joinery')
  ) {
    return 'Doors, Windows & Hardware';
  }

  // 6. Flooring, Tiling & Cladding
  if (
    d.includes('tile') || d.includes('marble') || d.includes('granite') || d.includes('vitrified') ||
    d.includes('ceramic') || d.includes('dado') || d.includes('skirting') || d.includes('flooring') ||
    d.includes('paver') || d.includes('cladding') || d.includes('kota stone')
  ) {
    return 'Flooring, Tiling & Cladding';
  }

  // 7. Reinforcement Steel (TMT Rebars)
  if (
    d.includes('rebar') || d.includes('tmt') || d.includes('steel') || d.includes('reinforcement') ||
    d.includes('8mm') || d.includes('10mm') || d.includes('12mm') || d.includes('16mm') ||
    d.includes('20mm') || d.includes('25mm') || d.includes('32mm') || d.includes('stirrup') ||
    d.includes('binding wire') || d.includes('fe500') || d.includes('fe550') || d.includes('tor steel')
  ) {
    return 'Reinforcement Schedule (TMT Rebars)';
  }

  // 8. Shuttering & Formwork
  if (
    d.includes('shuttering') || d.includes('formwork') || d.includes('centering') ||
    d.includes('staging') || d.includes('cantering') || d.includes('scaffolding') ||
    d.includes('plywood') || d.includes('prop')
  ) {
    return 'Shuttering & Formwork';
  }

  // 9. Earthwork & Excavation
  if (
    d.includes('excavation') || d.includes('earth work') || d.includes('filling') ||
    d.includes('backfill') || d.includes('earth') || d.includes('soil') || d.includes('drilling') ||
    d.includes('trench') || d.includes('pile bore')
  ) {
    return 'Earthwork & Excavation';
  }

  // 10. Brickwork & Masonry
  if (
    d.includes('brick') || d.includes('block') || d.includes('aac') || d.includes('masonry') ||
    d.includes('mortar') || d.includes('fly ash') || d.includes('parapet') || d.includes('wall ')
  ) {
    return 'Brickwork & Masonry';
  }

  // 11. Concrete Works
  if (
    d.includes('concrete') || d.includes('rcc') || d.includes('pcc') || d.includes('m15') ||
    d.includes('m20') || d.includes('m25') || d.includes('m30') || d.includes('grade beam') ||
    d.includes('plinth beam') || d.includes('lintel') || d.includes('pile m25') || d.includes('slab m20')
  ) {
    return 'Concrete Works by Grade';
  }

  // 12. Material Requisition
  if (
    d.includes('cement bags') || d.includes('sand (tonnes)') || d.includes('aggregate') ||
    d.includes('dry volume') || d.includes('requisition') || d.includes('raw material')
  ) {
    return 'Material Requisition Breakdown';
  }

  return 'Main Work Estimation';
}

/**
 * Standard Industry Construction Discipline Templates for One-Click Work Package Creation
 */
export const INDUSTRY_DISCIPLINE_PRESETS: StandardDisciplineTemplate[] = [
  {
    id: 'plumbing',
    name: 'Plumbing, Sanitation & Drainage',
    category: 'MEP',
    iconName: 'Droplet',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    description: 'Internal & external water lines, CPVC/UPVC pipes, drainage traps, valves and sanitary fixtures.',
    suggestedItems: [
      { name: 'CPVC Pipes 3/4" (SDR 11) for internal hot/cold water', unit: 'Running meter', rate: 145.00, remarks: 'Concealed bathroom lines' },
      { name: 'CPVC Pipes 1" (SDR 11) for riser & distribution', unit: 'Running meter', rate: 210.00, remarks: 'Shaft risers' },
      { name: 'UPVC SWR Drainage Pipe 110mm (Type B)', unit: 'Running meter', rate: 320.00, remarks: 'Soil & rain water' },
      { name: 'UPVC SWR Waste Pipe 75mm (Type B)', unit: 'Running meter', rate: 220.00, remarks: 'Kitchen & basin waste' },
      { name: 'Wall Hung EWC Commode with concealed cistern', unit: 'set', rate: 8500.00, remarks: 'Vitreous china complete' },
      { name: 'Countertop Wash Basin with CP waste coupling', unit: 'nos', rate: 3200.00, remarks: 'Toilet vanity counter' },
      { name: 'Single Lever Bath Mixer / Diverter with spout', unit: 'nos', rate: 4500.00, remarks: 'CP brass finish' },
      { name: 'Multi-Floor Gully / Nahani Trap with SS grating', unit: 'nos', rate: 380.00, remarks: '100mm inlet/outlet' },
      { name: '3-Layer Antibacterial Overhead Water Tank 1000L', unit: 'nos', rate: 7200.00, remarks: 'Terrace storage tank' }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical & Power Infrastructure',
    category: 'MEP',
    iconName: 'Zap',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Concealed PVC conduits, FRLS copper wiring, distribution boards, modular switches and lighting.',
    suggestedItems: [
      { name: 'Heavy Duty FRLS PVC Conduit Pipe 25mm', unit: 'Running meter', rate: 42.00, remarks: 'Slab & wall chasing' },
      { name: '1.5 sq.mm FRLS Copper Wire (Single Core)', unit: 'Running meter', rate: 28.00, remarks: 'Lighting circuits' },
      { name: '2.5 sq.mm FRLS Copper Wire (Single Core)', unit: 'Running meter', rate: 45.00, remarks: 'Power plug & geyser circuits' },
      { name: '4.0 sq.mm FRLS Copper Wire (Single Core)', unit: 'Running meter', rate: 68.00, remarks: 'AC circuits' },
      { name: 'Modular 6A Switch with plate & box', unit: 'nos', rate: 180.00, remarks: 'Polycarbonate modular' },
      { name: 'Modular 16A Power Socket with switch', unit: 'nos', rate: 340.00, remarks: 'Heavy load appliance points' },
      { name: '8-Way TPN Distribution Board (Double Door)', unit: 'nos', rate: 3800.00, remarks: 'Main apartment panel' },
      { name: '4-Pole 63A 30mA RCCB / ELCB', unit: 'nos', rate: 2400.00, remarks: 'Life safety leakage trip' },
      { name: 'Chemical Earthing Pit with compound & copper strip', unit: 'set', rate: 6500.00, remarks: 'Earth resistance < 1 ohm' }
    ]
  },
  {
    id: 'painting',
    name: 'Painting, Finishing & False Ceiling',
    category: 'Finishes',
    iconName: 'Paintbrush',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Acrylic wall putty, interior emulsions, exterior weatherproof coats, enamel and gypsum ceilings.',
    suggestedItems: [
      { name: '2-Coat Polymer Acrylic Wall Putty (Internal)', unit: 'sqm', rate: 65.00, remarks: 'Surface leveling' },
      { name: 'Interior Water-Based Primer Coat', unit: 'sqm', rate: 32.00, remarks: 'Sealer coat' },
      { name: 'Premium Interior Acrylic Emulsion (2 Coats)', unit: 'sqm', rate: 120.00, remarks: 'Smooth satin finish' },
      { name: 'Exterior Weatherproof Silicon Coating (2 Coats)', unit: 'sqm', rate: 175.00, remarks: 'Anti-fungal UV protected' },
      { name: 'Synthetic Enamel Paint on MS railings & grills', unit: 'sqm', rate: 140.00, remarks: 'Rust primer + 2 coats' },
      { name: '12.5mm Gypsum Board False Ceiling with GI framework', unit: 'sqm', rate: 1100.00, remarks: 'Living & master bedrooms' }
    ]
  },
  {
    id: 'waterproofing',
    name: 'Waterproofing & Damp Proofing',
    category: 'Specialized',
    iconName: 'ShieldAlert',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Basement tanking, wet area polymer coatings, terrace APP membranes, and structural expansion joints.',
    suggestedItems: [
      { name: '2-Component Polymer Modified Cementitious Coating (Toilets)', unit: 'sqm', rate: 240.00, remarks: 'Toilet sunken slabs & walls' },
      { name: '3mm APP Modified Bitumen Membrane with primer (Terrace)', unit: 'sqm', rate: 420.00, remarks: 'Torch applied on terrace' },
      { name: 'Integral Waterproofing Liquid Compound for Concrete', unit: 'Ltr', rate: 160.00, remarks: '200ml per bag of cement' },
      { name: 'Polysulphide Joint Sealant for expansion joints', unit: 'Running meter', rate: 380.00, remarks: 'Elastomeric movement joint' }
    ]
  },
  {
    id: 'doors_windows',
    name: 'Doors, Windows & Hardware',
    category: 'Finishes',
    iconName: 'DoorClosed',
    badgeColor: 'bg-stone-50 text-stone-800 border-stone-200',
    description: 'Flush doors, UPVC/Aluminium window frames, toughened glass railings, and architectural hardware.',
    suggestedItems: [
      { name: '32mm BWP Grade Flush Door with Teak veneer', unit: 'sqm', rate: 2800.00, remarks: 'Main entrance & rooms' },
      { name: 'UPVC 3-Track Sliding Window with Mosquito Mesh', unit: 'sqm', rate: 4800.00, remarks: '5mm clear float glass' },
      { name: '12mm Toughened Glass Balcony Railing with SS304 brackets', unit: 'Running meter', rate: 3600.00, remarks: 'Modern frameless look' },
      { name: 'SS 304 Mortise Handle Lock Set with brass cylinder', unit: 'set', rate: 1650.00, remarks: 'Heavy duty cylinder' },
      { name: 'Heavy Duty SS 304 Ball Bearing Hinges (125mm)', unit: 'nos', rate: 145.00, remarks: '3 hinges per door' }
    ]
  },
  {
    id: 'flooring_tiling',
    name: 'Flooring, Tiling & Cladding',
    category: 'Finishes',
    iconName: 'Grid',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Vitrified tiles, polished granite slabs, Italian/Indian marble, wall dado, and exterior pavers.',
    suggestedItems: [
      { name: '800x800mm Glazed Vitrified Tiles (GVT) Flooring', unit: 'sqm', rate: 950.00, remarks: 'Living & bedrooms' },
      { name: '300x600mm Digital Ceramic Wall Tiles (Dado)', unit: 'sqm', rate: 720.00, remarks: 'Toilets upto 7ft height' },
      { name: 'Jet Black Granite Slab for Kitchen Counter & Treads', unit: 'sqm', rate: 2200.00, remarks: '18mm polished with chamfer' },
      { name: '60mm Heavy Duty Interlocking Paver Blocks', unit: 'sqm', rate: 680.00, remarks: 'Driveway & parking area' }
    ]
  },
  {
    id: 'hvac_safety',
    name: 'HVAC, Fire Fighting & Safety',
    category: 'MEP',
    iconName: 'Flame',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    description: 'Fire hydrant wet risers, automatic sprinklers, smoke detection, copper AC piping and fresh air ducts.',
    suggestedItems: [
      { name: '100mm Heavy Duty MS Fire Hydrant Pipe (Class C)', unit: 'Running meter', rate: 1450.00, remarks: 'Fire staircase riser' },
      { name: 'Quick Response Pendent Fire Sprinkler (68°C)', unit: 'nos', rate: 420.00, remarks: 'Basement & common corridors' },
      { name: 'Optical Smoke Detector with flashing LED', unit: 'nos', rate: 1100.00, remarks: 'Addressable system' },
      { name: 'Pair of Insulated Copper Refrigerant Pipes (1/4" + 1/2")', unit: 'Running meter', rate: 650.00, remarks: 'Concealed split AC line' }
    ]
  }
];
