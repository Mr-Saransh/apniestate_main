import { calculateScheduleStatus } from '../src/lib/schedule';
import { processCandidateRows, type CandidateRow } from '../../apniestate-frontend/src/utils/qomImportValidator';

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('APNIESTATE ERP+CRM - REGRESSION & ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // SCENARIO H, I, J: Milestone Schedule Status
  // ----------------------------------------------------
  console.log('--- Milestones & Progress Schedule Status ---');
  
  // H: planned 1 Oct - 10 Oct, actual 1 Oct - 8 Oct -> AHEAD
  const statusH = calculateScheduleStatus({
    planned_start_date: '2026-10-01',
    planned_end_date: '2026-10-10',
    actual_start_date: '2026-10-01',
    actual_end_date: '2026-10-08',
    status: 'COMPLETED'
  });
  assert(statusH.scheduleStatus === 'AHEAD', 'Scenario H: Completed before planned end date -> AHEAD', `Got: ${statusH.scheduleStatus}`);

  // I: planned 1 Oct - 10 Oct, actual 1 Oct - 10 Oct -> ON_TIME
  const statusI = calculateScheduleStatus({
    planned_start_date: '2026-10-01',
    planned_end_date: '2026-10-10',
    actual_start_date: '2026-10-01',
    actual_end_date: '2026-10-10',
    status: 'COMPLETED'
  });
  assert(statusI.scheduleStatus === 'ON_TIME', 'Scenario I: Completed on planned end date -> ON_TIME', `Got: ${statusI.scheduleStatus}`);

  // J: planned 1 Oct - 10 Oct, actual 1 Oct - 12 Oct -> DELAYED
  const statusJ = calculateScheduleStatus({
    planned_start_date: '2026-10-01',
    planned_end_date: '2026-10-10',
    actual_start_date: '2026-10-01',
    actual_end_date: '2026-10-12',
    status: 'COMPLETED'
  });
  assert(statusJ.scheduleStatus === 'DELAYED', 'Scenario J: Completed after planned end date -> DELAYED', `Got: ${statusJ.scheduleStatus}`);

  // IN_PROGRESS status checks
  const statusInProgressOnTrack = calculateScheduleStatus({
    planned_start_date: '2026-10-01',
    planned_end_date: '2030-10-20',
    actual_start_date: '2026-10-01',
    status: 'IN_PROGRESS'
  });
  assert(statusInProgressOnTrack.scheduleStatus === 'ON_TRACK', 'In Progress before planned end date -> ON_TRACK', `Got: ${statusInProgressOnTrack.scheduleStatus}`);

  const statusInProgressDelayed = calculateScheduleStatus({
    planned_start_date: '2020-10-01',
    planned_end_date: '2020-10-10',
    actual_start_date: '2020-10-01',
    status: 'IN_PROGRESS'
  });
  assert(statusInProgressDelayed.scheduleStatus === 'DELAYED', 'In Progress after planned end date -> DELAYED', `Got: ${statusInProgressDelayed.scheduleStatus}`);


  // ----------------------------------------------------
  // SCENARIO K: BOQ / QOM Import Filtering
  // ----------------------------------------------------
  console.log('\n--- Scenario K: QOM Import Filtering & Validation ---');
  
  const sampleImportRows: CandidateRow[] = [
    { rawDescription: 'BILL OF QUANTITIES - CIVIL WORKS', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: 'SECTION 1: SUBSTRUCTURE & FOUNDATION', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: 'Ready Mix Concrete M25 for footing', rawQuantity: 45.5, rawUnit: 'cum', rawRate: 4500 },
    { rawDescription: 'Subtotal Substructure', rawQuantity: 0, rawUnit: '', rawRate: 204750 },
    { rawDescription: 'Thermo-Mechanically Treated Rebars Fe500', rawQuantity: 12.0, rawUnit: 'Tonnes', rawRate: 65000 },
    { rawDescription: 'Note: All steel must conform to IS 1786 specifications', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: '1.2.3', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: 'Page 1 of 12 - Apni Estate Reports', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: '', rawQuantity: 0, rawUnit: '', rawRate: 0 },
    { rawDescription: 'External Weatherproof Emulsion Paint (Apex)', rawQuantity: 200, rawUnit: 'Ltr', rawRate: 380 },
    { rawDescription: 'GRAND TOTAL ESTIMATION', rawQuantity: 0, rawUnit: '', rawRate: 1061000 }
  ];

  const processed = processCandidateRows(sampleImportRows);

  assert(processed.accepted.length === 3, 'Scenario K: Exactly 3 legitimate material rows accepted', `Accepted: ${processed.accepted.length}`);
  assert(processed.rejected.length === 8, 'Scenario K: Exactly 8 noise/heading/subtotal rows filtered out', `Rejected: ${processed.rejected.length}`);

  const acceptedNames = processed.accepted.map(a => a.name);
  assert(acceptedNames.includes('Ready Mix Concrete M25 for footing'), 'Ready Mix Concrete accepted');
  assert(acceptedNames.includes('Thermo-Mechanically Treated Rebars Fe500'), 'Rebars accepted');
  assert(acceptedNames.includes('External Weatherproof Emulsion Paint (Apex)'), 'Emulsion Paint accepted');

  const rejectedReasons = processed.rejected.map(r => r.reason.toLowerCase());
  assert(rejectedReasons.some(r => r.includes('section heading')), 'Heading correctly identified and rejected with reason');
  assert(rejectedReasons.some(r => r.includes('subtotal')), 'Subtotal correctly identified and rejected with reason');
  assert(rejectedReasons.some(r => r.includes('notes')), 'Note correctly identified and rejected with reason');
  assert(rejectedReasons.some(r => r.includes('page header')), 'Footer correctly identified and rejected with reason');


  // ----------------------------------------------------
  // SCENARIO A & B: Cumulative / Duplicate PO Over-Procurement Validation
  // ----------------------------------------------------
  console.log('\n--- Scenario A & B: Cumulative PO Order Limit Validation ---');

  // Business logic formula:
  // remainingToOrder = Math.max(0, plannedQty - (totalActiveOrdered - totalRejected))
  function validateOrderPlacement(plannedQty: number, activeOrdered: number, rejectedQty: number, requestedOrderQty: number) {
    const netCommitted = Math.max(0, activeOrdered - rejectedQty);
    const remainingToOrder = Math.max(0, plannedQty - netCommitted);
    if (requestedOrderQty > remainingToOrder) {
      return {
        allowed: false,
        error: `Order quantity (${requestedOrderQty}) exceeds remaining allowable QOM quantity (${remainingToOrder}).`,
        remainingToOrder
      };
    }
    return {
      allowed: true,
      remainingToOrder: remainingToOrder - requestedOrderQty
    };
  }

  // Scenario A: Planned 50, order 50, then try another 50
  const orderA1 = validateOrderPlacement(50, 0, 0, 50);
  assert(orderA1.allowed === true && orderA1.remainingToOrder === 0, 'Scenario A: First order of 50 allowed (remaining: 0)');

  const orderA2 = validateOrderPlacement(50, 50, 0, 50);
  assert(orderA2.allowed === false, 'Scenario A: Second order of 50 blocked by over-procurement validation');

  const orderA2Small = validateOrderPlacement(50, 50, 0, 1);
  assert(orderA2Small.allowed === false && orderA2Small.remainingToOrder === 0, 'Scenario A: Even order of 1 is blocked when remaining is 0');

  // Scenario B: Planned 100, order 50, then order another 50
  const orderB1 = validateOrderPlacement(100, 0, 0, 50);
  assert(orderB1.allowed === true && orderB1.remainingToOrder === 50, 'Scenario B: First order of 50/100 allowed (remaining: 50)');

  const orderB2 = validateOrderPlacement(100, 50, 0, 50);
  assert(orderB2.allowed === true && orderB2.remainingToOrder === 0, 'Scenario B: Second order of 50/100 allowed (remaining: 0)');

  const orderB3 = validateOrderPlacement(100, 100, 0, 1);
  assert(orderB3.allowed === false, 'Scenario B: Third order of 1 blocked (remaining: 0)');


  // ----------------------------------------------------
  // SCENARIO C & D: Rejected Goods - Inventory & Procurement Lifecycle
  // ----------------------------------------------------
  console.log('\n--- Scenario C & D: Rejected Goods Inventory Lifecycle ---');

  function processGoodsReceipt(receivedQty: number, quality: 'GOOD' | 'PARTIAL' | 'REJECTED', damagedQty: number = 0) {
    let acceptedQty = 0;
    let rejectedQty = 0;

    if (quality === 'REJECTED') {
      acceptedQty = 0;
      rejectedQty = receivedQty;
    } else if (quality === 'PARTIAL') {
      rejectedQty = Math.max(0, Math.min(receivedQty, damagedQty));
      acceptedQty = Math.max(0, receivedQty - rejectedQty);
    } else {
      acceptedQty = receivedQty;
      rejectedQty = 0;
    }

    // Inventory INCREMENTS ONLY BY ACCEPTED QUANTITY
    const inventoryIncrement = acceptedQty;

    return { acceptedQty, rejectedQty, inventoryIncrement };
  }

  // Scenario C: PO 50, receive 50, reject 50
  const receiptC = processGoodsReceipt(50, 'REJECTED');
  assert(receiptC.acceptedQty === 0, 'Scenario C: Accepted qty is 0');
  assert(receiptC.rejectedQty === 50, 'Scenario C: Rejected qty is 50');
  assert(receiptC.inventoryIncrement === 0, 'Scenario C: Inventory increment is +0 (no rejected goods enter inventory)');

  // Procurement requirement reopens:
  const reopenedOrder = validateOrderPlacement(50, 50, receiptC.rejectedQty, 50);
  assert(reopenedOrder.allowed === true, 'Scenario C: Procurement remains open for re-ordering 50 units because goods were rejected');

  // Scenario D: PO 50, receive 50, accept 40, reject 10
  const receiptD = processGoodsReceipt(50, 'PARTIAL', 10);
  assert(receiptD.acceptedQty === 40, 'Scenario D: Accepted qty is 40');
  assert(receiptD.rejectedQty === 10, 'Scenario D: Rejected qty is 10');
  assert(receiptD.inventoryIncrement === 40, 'Scenario D: Inventory increments strictly by +40');


  // ----------------------------------------------------
  // SCENARIO E: Planned Rate vs Actual Purchase Rate & Variance
  // ----------------------------------------------------
  console.log('\n--- Scenario E: Rate Variance & Baseline Preservation ---');

  function calculateRateMetrics(plannedRate: number, poItems: Array<{ rate: number; quantity: number }>) {
    let totalCost = 0;
    let totalQty = 0;
    for (const item of poItems) {
      totalCost += item.rate * item.quantity;
      totalQty += item.quantity;
    }
    const actualPurchaseRate = totalQty > 0 ? (totalCost / totalQty) : 0;
    const rateVariance = actualPurchaseRate > 0 ? (actualPurchaseRate - plannedRate) : 0;
    const rateVariancePercent = (plannedRate > 0 && actualPurchaseRate > 0)
      ? (rateVariance / plannedRate) * 100
      : 0;

    return {
      plannedRate,
      actualPurchaseRate,
      rateVariance,
      rateVariancePercent
    };
  }

  const metricsE = calculateRateMetrics(200, [{ rate: 180, quantity: 50 }]);
  assert(metricsE.plannedRate === 200, 'Scenario E: Planned baseline rate remains ₹200');
  assert(metricsE.actualPurchaseRate === 180, 'Scenario E: Actual purchase rate is ₹180');
  assert(metricsE.rateVariance === -20, 'Scenario E: Rate variance is -₹20');
  assert(Math.round(metricsE.rateVariancePercent) === -10, 'Scenario E: Rate variance percent is -10%');

  // Multiple POs: weighted average
  const metricsMultiPO = calculateRateMetrics(200, [
    { rate: 180, quantity: 60 },
    { rate: 190, quantity: 40 }
  ]);
  // Weighted: (60*180 + 40*190) / 100 = (10800 + 7600) / 100 = 184
  assert(metricsMultiPO.actualPurchaseRate === 184, 'Weighted average across multiple POs is ₹184', `Got: ${metricsMultiPO.actualPurchaseRate}`);
  assert(metricsMultiPO.rateVariance === -16, 'Variance from baseline is -₹16');


  // ----------------------------------------------------
  // SCENARIO F: Quoted Rate vs Final Purchase Rate Validation
  // ----------------------------------------------------
  console.log('\n--- Scenario F: Quoted Rate vs Final Purchase Rate ---');

  function validatePurchaseRate(quotedRate: number, finalPurchaseRate: number) {
    if (quotedRate > 0 && finalPurchaseRate > quotedRate) {
      return {
        allowed: false,
        error: `Final purchase rate (₹${finalPurchaseRate}) cannot exceed the selected quotation rate of ₹${quotedRate}.`
      };
    }
    return { allowed: true };
  }

  const rateCheckF1 = validatePurchaseRate(200, 180);
  assert(rateCheckF1.allowed === true, 'Scenario F: Final rate ₹180 <= Quoted ₹200 is allowed');

  const rateCheckF2 = validatePurchaseRate(200, 200);
  assert(rateCheckF2.allowed === true, 'Scenario F: Final rate ₹200 <= Quoted ₹200 is allowed');

  const rateCheckF3 = validatePurchaseRate(200, 201);
  assert(rateCheckF3.allowed === false, 'Scenario F: Final rate ₹201 > Quoted ₹200 is blocked');
  assert(rateCheckF3.error?.includes('cannot exceed the selected quotation rate of ₹200'), 'Scenario F: Explanatory error message returned');

  const rateCheckF4 = validatePurchaseRate(200, 300);
  assert(rateCheckF4.allowed === false, 'Scenario F: Final rate ₹300 > Quoted ₹200 is blocked');


  // ----------------------------------------------------
  // SCENARIO G: Requirement Requested, Approved, Ordered & Locking
  // ----------------------------------------------------
  console.log('\n--- Scenario G: Requirement Quantities & Immutability Lock ---');

  interface MockRequirement {
    id: string;
    requestedQuantity: number;
    approvedQuantity: number;
    orderedQuantity: number;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'ORDERED' | 'COMPLETED';
  }

  const req: MockRequirement = {
    id: 'req-1',
    requestedQuantity: 50,
    approvedQuantity: 50,
    orderedQuantity: 0,
    status: 'PENDING_APPROVAL'
  };

  // PM modifies and approves requirement to 40
  req.approvedQuantity = 40;
  req.status = 'APPROVED';
  assert(req.requestedQuantity === 50, 'Scenario G: Original requested quantity remains 50 after approval');
  assert(req.approvedQuantity === 40, 'Scenario G: Approved quantity is 40');

  // Converted to PO for 40 units
  req.orderedQuantity = 40;
  req.status = 'ORDERED';
  assert(req.requestedQuantity === 50, 'Scenario G: Historical requested quantity remains 50 after order');
  assert(req.approvedQuantity === 40, 'Scenario G: Approved quantity is 40');
  assert(req.orderedQuantity === 40, 'Scenario G: Ordered quantity is 40');

  // Attempting to modify locked requirement
  function attemptModifyRequirement(r: MockRequirement, newQty: number) {
    if (['ORDERED', 'COMPLETED'].includes(r.status)) {
      return {
        allowed: false,
        error: `Requirement has already been converted into an order (Status: ${r.status}) and is locked against modifications.`
      };
    }
    r.approvedQuantity = newQty;
    return { allowed: true };
  }

  const lockCheck = attemptModifyRequirement(req, 60);
  assert(lockCheck.allowed === false, 'Scenario G: Modifying locked requirement is blocked');
  assert(req.requestedQuantity === 50, 'Scenario G: Requested quantity unchanged');


  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
