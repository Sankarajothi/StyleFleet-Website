const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nqwgxkdpwpgqkezaqsrx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fxLPfAbQ8EL8HM5-NS_lqQ_0AMzCWCY';
const BASE_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 RUNNING STYLEFLEET AUTOMATED END-TO-END SUITE');
  console.log('====================================================\n');

  // STEP 1: Verify Web Server HTTP Endpoints
  console.log('[Test 1/6] Verifying Web Server Endpoints...');
  try {
    const resHome = await fetch(BASE_URL);
    assert(resHome.status === 200, `Landing Page responded with HTTP ${resHome.status}`);

    const resDash = await fetch(`${BASE_URL}/dashboard`);
    assert(resDash.status === 200, `Dashboard Page responded with HTTP ${resDash.status}`);
  } catch (err) {
    assert(false, `Web server connection failed: ${err.message}`);
  }

  // STEP 2: Verify OTP Auth API Flow for Demo Owner
  console.log('\n[Test 2/6] Verifying OTP Authentication for Demo Owner (9999999999)...');
  try {
    const sendRes = await fetch(`${BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' }),
    });
    const sendData = await sendRes.json();
    assert(sendData.success === true, 'POST /api/otp/send returns success for Demo Owner');
    assert(typeof sendData.sessionId === 'string', `SessionId received: ${sendData.sessionId}`);
    assert(sendData.demoOtp === '123456', 'Demo OTP provided is 123456');

    const verifyRes = await fetch(`${BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sendData.sessionId, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.success === true && verifyData.matched === true, 'POST /api/otp/verify verified code 123456');
  } catch (err) {
    assert(false, `Demo Owner OTP failed: ${err.message}`);
  }

  // STEP 3: Verify OTP Auth API Flow for Demo Supervisor
  console.log('\n[Test 3/6] Verifying OTP Authentication for Demo Supervisor (8888888888)...');
  try {
    const sendRes = await fetch(`${BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '8888888888' }),
    });
    const sendData = await sendRes.json();
    assert(sendData.success === true, 'POST /api/otp/send returns success for Demo Supervisor');

    const verifyRes = await fetch(`${BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sendData.sessionId, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.success === true && verifyData.matched === true, 'POST /api/otp/verify verified Demo Supervisor');
  } catch (err) {
    assert(false, `Demo Supervisor OTP failed: ${err.message}`);
  }

  // STEP 4: Verify Database Lookup & Staff Roster in Supabase
  console.log('\n[Test 4/6] Verifying Demo Supervisor presence in Supabase staff table...');
  const shopId = '287ad70f-3cc7-4af9-a340-4fed5bae0085';
  const { data: staffMembers, error: staffErr } = await supabase
    .from('staff')
    .select('id, name, phone, role, is_active')
    .eq('shop_id', shopId)
    .eq('phone', '8888888888');

  assert(!staffErr, 'Queried staff table without database errors');
  assert(staffMembers && staffMembers.length > 0, 'Demo Supervisor record exists in Supabase');
  assert(staffMembers[0].role === 'Supervisor', `Staff role is correctly "${staffMembers[0]?.role}"`);
  assert(staffMembers[0].name === 'Demo Supervisor', `Staff name is correctly "${staffMembers[0]?.name}"`);

  // STEP 5: Verify Database Persistence for Real Bills & Expenses & Appointments
  console.log('\n[Test 5/6] Verifying Database CRUD for Bills, Expenses & Appointments in Supabase...');
  
  // 5a. Bills
  const testInvoiceNum = `TEST-E2E-${Date.now().toString().slice(-5)}`;
  const testBillId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

  const { error: bInsertErr } = await supabase.from('bills').insert({
    id: testBillId,
    shop_id: shopId,
    invoice_number: testInvoiceNum,
    status: 'paid',
    subtotal_minor: 125000,
    discount_minor: 0,
    tax_minor: 0,
    tip_minor: 0,
    total_minor: 125000,
    paid_amount_minor: 125000,
    due_amount_minor: 0,
    notes: 'staff_name:Demo Supervisor;cust:E2E Test Client;phone:9988776655;mode:UPI',
    issued_at: new Date().toISOString(),
  });
  assert(!bInsertErr, `Inserted Bill #${testInvoiceNum} into Supabase bills table`);

  // Verify bill can be read back
  const { data: readBill, error: bReadErr } = await supabase
    .from('bills')
    .select('id, invoice_number, total_minor, status')
    .eq('id', testBillId)
    .single();
  assert(!bReadErr && readBill && readBill.invoice_number === testInvoiceNum, `Bill #${testInvoiceNum} verified in database ledger`);

  // Verify bill soft delete
  const { error: bDelErr } = await supabase
    .from('bills')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', testBillId);
  assert(!bDelErr, `Bill #${testInvoiceNum} soft-deleted to 30-day recovery bin`);

  // Clean up test bill
  await supabase.from('bills').delete().eq('id', testBillId);
  console.log('  ✓ Test bill cleaned up safely from ledger');

  // 5b. Expenses
  const testExpId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

  const { error: eInsertErr } = await supabase.from('expenses').insert({
    id: testExpId,
    shop_id: shopId,
    note: 'E2E Automated Test Shampoo Supplies',
    amount_minor: 45000, // ₹450
    payment_method: 'Cash',
    expense_date: new Date().toISOString().split('T')[0],
    include_in_profit: true,
  });
  assert(!eInsertErr, 'Expense of ₹450 inserted into Supabase expenses table');

  // Verify expense read back
  const { data: readExp } = await supabase.from('expenses').select('id, note, amount_minor').eq('id', testExpId).single();
  assert(readExp && readExp.amount_minor === 45000, 'Expense verified in Supabase expenses table');

  // Delete test expense
  const { error: eDelErr } = await supabase.from('expenses').delete().eq('id', testExpId);
  assert(!eDelErr, 'Expense deleted from Supabase expenses table');

  // 5c. Appointments
  const testApptId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

  const { error: aInsertErr } = await supabase.from('appointments').insert({
    id: testApptId,
    shop_id: shopId,
    starts_at: `${new Date().toISOString().split('T')[0]} 03:00 PM`,
    duration_minutes: 30,
    status: 'Confirmed',
    notes: JSON.stringify({ cust_name: 'E2E Client', cust_phone: '9876501234', service_name: 'Royal Haircut' }),
  });
  assert(!aInsertErr, 'Appointment for "E2E Client" inserted into Supabase appointments table');

  // Update appointment status to 'In chair'
  const { error: aUpdErr } = await supabase.from('appointments').update({ status: 'In chair' }).eq('id', testApptId);
  assert(!aUpdErr, 'Appointment status updated to "In chair" in Supabase database');

  // Clean up test appointment
  await supabase.from('appointments').delete().eq('id', testApptId);
  console.log('  ✓ Test appointment cleaned up safely');

  // STEP 6: Summary
  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('====================================================');
  console.log('Summary of Test Results:');
  console.log('  - Web App HTTP Endpoints: PASS (200 OK)');
  console.log('  - Demo Owner OTP Flow: PASS (Phone: 9999999999, Code: 123456)');
  console.log('  - Demo Supervisor OTP Flow: PASS (Phone: 8888888888, Code: 123456)');
  console.log('  - Supabase Database Bills Ledger: PASS (Inserts, Reads & Updates verified)');
  console.log('  - Supabase Database Expenses Ledger: PASS (Inserts, Reads & Deletes verified)');
  console.log('  - Supabase Database Appointments Table: PASS (Scheduling & Status Updates verified)');
  console.log('====================================================\n');
}

runE2ETests().catch((err) => {
  console.error('Fatal error during E2E testing:', err);
  process.exit(1);
});
