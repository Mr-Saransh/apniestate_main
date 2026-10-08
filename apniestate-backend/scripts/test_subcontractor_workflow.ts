import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  createSubContractor,
  getSubContractors,
  getSubContractorAssignmentById,
  getMySubContractorAssignments,
  submitExpense,
  reviewExpense,
  createSubContractorTask,
  updateSubContractorTask,
  reviewSubContractorTask,
} from '../src/modules/subcontractors/subcontractors.service';
import { getProjects } from '../src/modules/projects/projects.service';
import { getVendors } from '../src/modules/vendors/vendors.service';

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('STARTING COMPLETE SUB CONTRACTOR ACCEPTANCE SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, stepNum: number | string, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Step ${stepNum}: ${message}`);
    } else {
      console.error(`[FAIL] Step ${stepNum}: ${message}`);
      throw new Error(`Assertion failed at Step ${stepNum}: ${message}`);
    }
  }

  // Find or create test builder & company
  let builder = await prisma.user.findFirst({
    where: { role: 'BUILDER' },
    include: { company: true },
  });

  if (!builder) {
    console.log('Creating demo builder for testing...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('TestPass123!', salt);
    builder = await prisma.user.create({
      data: {
        name: 'Demo Builder',
        email: `builder.test.${Date.now()}@apniestate.com`,
        password_hash: hash,
        role: 'BUILDER',
      },
      include: { company: true },
    });
  }

  // Ensure company exists
  let companyId = builder.company_id;
  if (!companyId) {
    const company = await prisma.company.create({
      data: {
        name: 'Apni Estate Builders Ltd',
      },
    });
    companyId = company.id;
    await prisma.user.update({
      where: { id: builder.id },
      data: { company_id: companyId },
    });
  }

  // Create Project: Roy Villa
  const testRunId = Date.now();
  const royVilla = await prisma.project.create({
    data: {
      name: `Roy Villa ${testRunId}`,
      company_id: companyId,
      builder_id: builder.id,
      budget: 5000000,
      status: 'PLANNING',
      start_date: new Date(),
    },
  });
  console.log(`Setup: Created test project "${royVilla.name}" (ID: ${royVilla.id})`);

  // Clean up any existing test sub contractor with this email
  const testSubContractorEmail = `raj.kumar.${testRunId}@example.com`;

  // ==========================================
  // BUILDER STEPS 1 - 8
  // ==========================================
  console.log('\n--- TESTING BUILDER STEPS (1 - 8) ---');

  // Step 1: Open Sub Contractors list (currently empty for this project)
  const initialSubList = await getSubContractors(companyId, royVilla.id);
  assert(Array.isArray(initialSubList), '1', 'Builder opens Sub Contractors list successfully');

  // Step 2-7: Create "Raj Kumar", raj@example.com, Roy Villa, Painting, ₹2,50,000
  const createResult = await createSubContractor(
    {
      name: 'Raj Kumar',
      email: testSubContractorEmail,
      password: 'TemporaryPass123!',
      project_id: royVilla.id,
      work_type: 'Painting',
      allocated_budget: 250000,
    },
    builder.id,
    companyId
  );

  assert(!!createResult.user && createResult.user.name === 'Raj Kumar', '2', 'Created Raj Kumar user account');
  assert(createResult.user.email === testSubContractorEmail, '3', `Email set to ${testSubContractorEmail}`);
  assert(createResult.assignment.project_id === royVilla.id, '4', 'Assigned to project Roy Villa');
  assert(createResult.assignment.work_type === 'Painting', '5', 'Assigned free-text work type "Painting"');
  assert(createResult.assignment.allocated_budget === 250000, '6', 'Allocated budget set to ₹2,50,000');
  assert(createResult.user.role === 'SUB_CONTRACTOR', '7', 'User has proper SUB_CONTRACTOR RBAC role');

  // Step 8: Share credentials - verify password stored hashed, can authenticate
  const createdUser = await prisma.user.findUnique({
    where: { id: createResult.user.id },
  });
  const passwordMatch = await bcrypt.compare('TemporaryPass123!', createdUser!.password_hash);
  assert(passwordMatch, '8', 'Credentials generated securely with hashed password, ready to share');

  const rajUserId = createResult.user.id;
  const assignmentId = createResult.assignment.id;

  // ==========================================
  // SUB CONTRACTOR STEPS 9 - 14
  // ==========================================
  console.log('\n--- TESTING SUB CONTRACTOR STEPS (9 - 14) ---');

  // Step 9 & 10: Sub Contractor fetches portal assignments/dashboard
  const rajAssignments = await getMySubContractorAssignments(rajUserId);
  assert(rajAssignments.length === 1, '9', 'Sub Contractor logs in and retrieves project assignments');
  assert(
    rajAssignments[0].project.name === royVilla.name &&
    rajAssignments[0].work_type === 'Painting' &&
    rajAssignments[0].allocated_budget === 250000,
    '10',
    'Dashboard shows Roy Villa / Painting / ₹2,50,000'
  );

  // Step 11: Submit expense: ₹20,000, "Paint purchased for Block A", upload bill
  const expense1 = await submitExpense(
    {
      assignment_id: assignmentId,
      amount: 20000,
      description: 'Paint purchased for Block A',
      bill_url: 'https://res.cloudinary.com/demo/image/upload/sample_paint_bill.pdf',
    },
    rajUserId
  );
  assert(expense1.amount === 20000 && expense1.status === 'PENDING', '11', 'Submitted expense ₹20,000 with bill attached in PENDING status');

  // Step 12: Expense appears in own expense list
  const rajAssignmentWithExpenses = await getSubContractorAssignmentById(assignmentId, rajUserId, 'SUB_CONTRACTOR');
  assert(
    rajAssignmentWithExpenses?.expenses?.some((e: any) => e.id === expense1.id) === true,
    '12',
    'Expense appears in Sub Contractor own expense list'
  );

  // Step 13: Create task: "Complete Block A exterior painting", deadline = 20 Oct 2026
  const task1 = await createSubContractorTask(
    {
      assignment_id: assignmentId,
      description: 'Complete Block A exterior painting',
      deadline: '2026-10-20T18:00:00.000Z',
    },
    rajUserId
  );
  assert(task1.status === 'OPEN', '13', 'Created task "Complete Block A exterior painting" in OPEN status');

  // Step 14: Sub Contractor marks task completed
  const markedTask = await updateSubContractorTask(
    task1.id,
    { status: 'COMPLETED_PENDING_APPROVAL' },
    rajUserId
  );
  assert(
    markedTask.status === 'COMPLETED_PENDING_APPROVAL',
    '14',
    'Sub Contractor marks task completed -> transitions to COMPLETED_PENDING_APPROVAL (never auto-approved)'
  );

  // ==========================================
  // BUILDER REVIEW STEPS 15 - 22
  // ==========================================
  console.log('\n--- TESTING BUILDER REVIEW STEPS (15 - 22) ---');

  // Step 15: Builder receives task-completion notification
  const notifications = await prisma.notification.findMany({
    where: { user_id: builder.id, entity_type: 'SUB_CONTRACTOR_TASK', entity_id: task1.id },
  });
  assert(notifications.length > 0, '15', 'Builder received task-completion notification');

  // Step 16: Builder opens Raj Kumar assignment detail
  const builderAssignmentView = await getSubContractorAssignmentById(assignmentId, builder.id, 'BUILDER');
  assert(builderAssignmentView !== null, '16', 'Builder opens Raj Kumar assignment detail');

  // Step 17: Builder sees ₹20,000 expense and uploaded bill
  const foundExpense = builderAssignmentView?.expenses?.find((e: any) => e.id === expense1.id);
  assert(
    foundExpense?.amount === 20000 && !!foundExpense?.bill_url,
    '17',
    'Builder sees ₹20,000 expense and bill receipt'
  );

  // Step 18: Builder sees completed task
  const foundTask = builderAssignmentView?.tasks?.find((t: any) => t.id === task1.id);
  assert(
    foundTask?.status === 'COMPLETED_PENDING_APPROVAL',
    '18',
    'Builder sees completed task awaiting approval'
  );

  // Step 19 & 20: Builder approves task
  const approvedTask = await reviewSubContractorTask(task1.id, 'APPROVE', builder.id);
  assert(approvedTask.status === 'APPROVED' && !!approvedTask.approved_at, '19-20', 'Builder approves task -> Status becomes APPROVED with audit timestamp');

  // Approve expense & check budget calculations
  const approvedExp1 = await reviewExpense(expense1.id, { status: 'APPROVED' }, builder.id, companyId);
  assert(approvedExp1.status === 'APPROVED', 'Expense Approval', 'Builder approved expense');

  // Step 21 & 22: Budget usage shows ₹20,000, remaining budget shows ₹2,30,000
  const updatedAssignment = await getSubContractorAssignmentById(assignmentId, builder.id, 'BUILDER');
  assert(updatedAssignment?.used_budget === 20000, '21', 'Budget usage accurately shows ₹20,000');
  assert(updatedAssignment?.remaining_budget === 230000, '22', 'Remaining budget accurately shows ₹2,30,000 (2,50,000 - 20,000)');

  // ==========================================
  // EDGE CASE & DEFENSIVE TESTS 23 - 39
  // ==========================================
  console.log('\n--- TESTING EDGE CASES & SECURITY RULES (23 - 39) ---');

  // Step 23 & 24: Sub Contractor tries ₹2,40,000 additional expense (remaining is only ₹2,30,000)
  let overBudgetRejected = false;
  let overBudgetErrorMsg = '';
  try {
    await submitExpense(
      {
        assignment_id: assignmentId,
        amount: 240000,
        description: 'Exceeding budget paint supply',
      },
      rajUserId
    );
  } catch (err: any) {
    overBudgetRejected = true;
    overBudgetErrorMsg = err.message;
  }
  assert(
    overBudgetRejected && overBudgetErrorMsg.includes('Expense exceeds your remaining allocated budget'),
    '23-24',
    `Backend rejects ₹2,40,000 expense: "${overBudgetErrorMsg}"`
  );

  // Step 25 & 26: Builder rejects an expense -> does NOT count toward used budget
  const expense2 = await submitExpense(
    {
      assignment_id: assignmentId,
      amount: 15000,
      description: 'Extra brushes and ladders',
    },
    rajUserId
  );

  await reviewExpense(expense2.id, { status: 'REJECTED', rejection_reason: 'Receipt unreadable, re-upload' }, builder.id, companyId);

  const assignmentAfterRejection = await getSubContractorAssignmentById(assignmentId, builder.id, 'BUILDER');
  assert(
    assignmentAfterRejection?.used_budget === 20000 && assignmentAfterRejection?.remaining_budget === 230000,
    '25-26',
    'Rejected expense of ₹15,000 does NOT increase used budget; remaining budget stays ₹2,30,000'
  );

  // Step 27 & 28: Builder rejects/returns a completed task -> Sub Contractor sees it returned
  const task2 = await createSubContractorTask(
    {
      assignment_id: assignmentId,
      description: 'Primer coating Block B',
      deadline: '2026-10-25T18:00:00.000Z',
    },
    rajUserId
  );
  await updateSubContractorTask(task2.id, { status: 'COMPLETED_PENDING_APPROVAL' }, rajUserId);
  await reviewSubContractorTask(task2.id, 'REJECT', builder.id);

  const returnedTaskRaj = await prisma.subContractorTask.findUnique({ where: { id: task2.id } });
  assert(
    returnedTaskRaj?.status === 'REJECTED',
    '27-28',
    'Builder returns task -> Task status is REJECTED (returned for revision), subcontractor can work on it again'
  );

  // Step 29 & 30: Create another project -> verify project data remains isolated
  const greenHeights = await prisma.project.create({
    data: {
      name: `Green Heights ${testRunId}`,
      company_id: companyId,
      builder_id: builder.id,
      budget: 8000000,
      status: 'PLANNING',
      start_date: new Date(),
    },
  });

  // Assign Raj to Green Heights with a separate budget
  const greenAssignment = await prisma.subContractorProjectAssignment.create({
    data: {
      user_id: rajUserId,
      project_id: greenHeights.id,
      company_id: companyId,
      work_type: 'Interior Work',
      allocated_budget: 400000,
      created_by: builder.id,
    },
  });

  // Submit expense in Green Heights
  await submitExpense(
    {
      assignment_id: greenAssignment.id,
      amount: 50000,
      description: 'False ceiling material for Green Heights',
    },
    rajUserId
  );

  // Verify Roy Villa assignment still shows ₹20,000 used, isolated from Green Heights
  const royVillaCheck = await getSubContractorAssignmentById(assignmentId, builder.id, 'BUILDER');
  assert(
    royVillaCheck?.used_budget === 20000 && royVillaCheck?.allocated_budget === 250000,
    '29-30',
    'Project isolation verified: Green Heights spend (₹50k) does not bleed into Roy Villa (₹20k)'
  );

  // Step 31 - 36: Verify Sub Contractor cannot access forbidden modules or other contractor data
  console.log('\n--- TESTING RBAC AND ISOLATION (31 - 36) ---');

  // Verify Sub Contractor cannot view other contractor assignment
  let otherContractorBlocked = false;
  try {
    // Create another sub contractor
    const otherSub = await createSubContractor(
      {
        name: 'Sunil Sharma',
        email: `sunil.${testRunId}@example.com`,
        password: 'Pass123!Sunil',
        project_id: royVilla.id,
        work_type: 'Electrical',
        allocated_budget: 100000,
      },
      builder.id,
      companyId
    );

    // Raj tries to access Sunil's assignment
    await getSubContractorAssignmentById(otherSub.assignment.id, rajUserId, 'SUB_CONTRACTOR');
  } catch (err: any) {
    otherContractorBlocked = true;
  }
  assert(otherContractorBlocked, '31-36', 'RBAC Isolation: Sub Contractor cannot access another contractor assignment');

  // Step 37 - 39: Vendor separation
  console.log('\n--- TESTING VENDOR SEPARATION (37 - 39) ---');
  const allVendors = await getVendors(builder.id, companyId);
  const subInVendors = allVendors.some((v: any) => v.name === 'Raj Kumar' || v.email === testSubContractorEmail);
  assert(!subInVendors, '37-38', 'Sub Contractors do NOT appear inside Vendors directory');

  // Verify existing vendor creation and retrieval works smoothly
  const testVendor = await prisma.vendor.create({
    data: {
      name: `Apex Cement Supplier ${testRunId}`,
      category: 'MATERIALS',
      company_id: companyId,
      phone: '9812345678',
    },
  });
  const vendorsAfter = await getVendors(builder.id, companyId);
  assert(
    vendorsAfter.some((v: any) => v.id === testVendor.id),
    '39',
    'Existing Vendor workflow continues working completely unimpaired'
  );

  // Cleanup test artifacts
  console.log('\nCleaning up test run records...');
  await prisma.vendor.delete({ where: { id: testVendor.id } }).catch(() => {});
  await prisma.expense.deleteMany({ where: { reference_id: { startsWith: 'subcontractor-expense-' } } }).catch(() => {});
  await prisma.subContractorExpense.deleteMany({ where: { assignment_id: { in: [assignmentId, greenAssignment.id] } } }).catch(() => {});
  await prisma.subContractorTask.deleteMany({ where: { assignment_id: { in: [assignmentId, greenAssignment.id] } } }).catch(() => {});
  await prisma.subContractorProjectAssignment.deleteMany({ where: { project_id: { in: [royVilla.id, greenHeights.id] } } }).catch(() => {});
  await prisma.project.deleteMany({ where: { id: { in: [royVilla.id, greenHeights.id] } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { in: [testSubContractorEmail, `sunil.${testRunId}@example.com`] } } }).catch(() => {});

  console.log('\n====================================================');
  console.log(`ALL ACCEPTANCE TESTS COMPLETED SUCCESSFULLY!`);
  console.log(`Passed: ${passedTests} / ${totalTests} tests`);
  console.log('====================================================');
}

runAcceptanceTests()
  .catch((err) => {
    console.error('Test suite failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
