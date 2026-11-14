import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, db, SHOP_OWNER_EMAIL } from './googleAuth';
import { normalizeCategory } from '../utils/helpers';
import {
  CashClosingRecord,
  Customer,
  DueRecord,
  ExpenseRecord,
  Product,
  PurchaseRecord,
  SaleRecord,
  User
} from '../types';

export const PERMANENT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxpPzExy1dxtfFNivYU4rVuNGQLCSD8DQEnMGFYugplvK_i4NCZ4GuGYuIUZtbjhUyp4g/exec';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const CLOUD_COLLECTIONS = {
  users: 'shop_users',
  products: 'shop_products',
  customers: 'shop_customers',
  sales: 'shop_sales',
  dueRecords: 'shop_due_ledger',
  expenses: 'shop_expenses',
  purchases: 'shop_purchases',
  cashClosings: 'shop_cash_closings',
  meta: 'shop_meta',
} as const;

const knownDocIds: Record<string, Set<string>> = {
  shop_users: new Set(),
  shop_products: new Set(),
  shop_customers: new Set(),
  shop_sales: new Set(),
  shop_due_ledger: new Set(),
  shop_expenses: new Set(),
  shop_purchases: new Set(),
  shop_cash_closings: new Set(),
  shop_meta: new Set(),
};

export function sanitizeDocId(raw: string | number): string {
  const cleaned = String(raw || 'item')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || 'item';
}

function trunc(val: unknown, maxLen: number): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function nonNeg(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function anyNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function isAuthorizedCloudUser(user: FirebaseUser | null): boolean {
  if (!user) return false;
  if (user.isAnonymous) return true;
  return Boolean(
    user.emailVerified &&
      (user.email || '').trim().toLowerCase() === SHOP_OWNER_EMAIL
  );
}

interface PendingCloudOp {
  type: 'upsert' | 'delete';
  colName: string;
  docId: string;
  data?: Record<string, unknown>;
}

const PENDING_CLOUD_OPS_KEY = 'as_computer_pending_cloud_ops';

function readPendingCloudOps(): PendingCloudOp[] {
  try {
    const raw = localStorage.getItem(PENDING_CLOUD_OPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingCloudOps(ops: PendingCloudOp[]) {
  try {
    if (ops.length === 0) {
      localStorage.removeItem(PENDING_CLOUD_OPS_KEY);
    } else {
      localStorage.setItem(PENDING_CLOUD_OPS_KEY, JSON.stringify(ops.slice(-200)));
    }
  } catch {
    // ignore storage quota errors
  }
}

function enqueuePendingCloudOp(op: PendingCloudOp) {
  const existing = readPendingCloudOps().filter(
    item => !(item.colName === op.colName && item.docId === op.docId)
  );
  existing.push(op);
  writePendingCloudOps(existing);
}

// --- Payload Sanitizers Matching firebase-blueprint.json & firestore.rules ---
function serializeUser(u: User) {
  return {
    id: anyNum(u.id, Date.now()),
    username: trunc(u.username || 'Staff', 120),
    role: u.role === 'admin' ? 'admin' : 'staff',
    phone: trunc(u.phone || '', 40),
    permissions: trunc(u.permissions || '', 300),
  };
}

function serializeProduct(p: Product) {
  return {
    id: anyNum(p.id, Date.now()),
    rowId: anyNum(p.rowId ?? p.id, Date.now()),
    sl: nonNeg(p.sl, 0),
    category: normalizeCategory(p.category),
    name: trunc(p.name || 'Item', 200),
    price: nonNeg(p.price, 0),
    costPrice: nonNeg(p.costPrice, 0),
    stockQty: p.stockQty === null || p.stockQty === undefined ? null : nonNeg(p.stockQty, 0),
    lowStockLimit: nonNeg(p.lowStockLimit, 5),
  };
}

function serializeCustomer(c: Customer) {
  return {
    id: anyNum(c.id, Date.now()),
    rowId: anyNum(c.rowId ?? c.id, Date.now()),
    sl: nonNeg(c.sl, 0),
    name: trunc(c.name || 'Customer', 200),
    phone: trunc(c.phone || '', 40),
    address: trunc(c.address || '', 300),
  };
}

function serializeSale(s: SaleRecord) {
  const grand = nonNeg(s.grandTotal, 0);
  const paid = Math.min(grand, nonNeg(s.paid, 0));
  const due = Math.min(grand, nonNeg(s.due, Math.max(0, grand - paid)));
  const rawDate = trunc(s.rawDate || s.date || new Date().toISOString().slice(0, 10), 30);
  const items =
    Array.isArray(s.items) && s.items.length > 0
      ? s.items.slice(0, 100).map(it => ({
          category: normalizeCategory(it.category),
          name: trunc(it.name || 'Service', 200),
          price: nonNeg(it.price, 0),
          costPrice: nonNeg(it.costPrice, 0),
          qty: Math.max(0.01, nonNeg(it.qty, 1)),
          total: nonNeg(it.total, 0),
        }))
      : [
          {
            category: normalizeCategory(s.category),
            name: trunc(s.desc || s.category || 'Service', 200),
            price: grand,
            costPrice: 0,
            qty: 1,
            total: grand,
          },
        ];

  return {
    id: anyNum(s.id, Date.now()),
    rowId: anyNum(s.rowId ?? s.id, Date.now()),
    invoiceNo: Math.max(1, anyNum(s.invoiceNo, 4001)),
    timestamp: trunc(s.timestamp || '', 80),
    rawDate,
    date: trunc(s.date || rawDate, 30),
    user: trunc(s.user || 'Staff', 120),
    customer: trunc(s.customer || 'Cash Customer', 200),
    phone: trunc(s.phone || '', 40),
    address: trunc(s.address || '', 300),
    category: trunc(s.category || 'Photocopy', 180),
    desc: trunc(s.desc || '', 1000),
    subtotal: nonNeg(s.subtotal, grand),
    discount: nonNeg(s.discount, 0),
    grandTotal: grand,
    paid,
    due,
    items,
  };
}

function serializeDueRecord(d: DueRecord) {
  const docId = sanitizeDocId(d.id || `DUE-${d.rowId || Date.now()}`);
  return {
    id: docId,
    rowId: anyNum(d.rowId, Date.now()),
    date: trunc(d.date || new Date().toISOString().slice(0, 10), 30),
    customer: trunc(d.customer || 'Customer', 200),
    phone: trunc(d.phone || '', 40),
    address: trunc(d.address || '', 300),
    type: trunc(d.type || 'Memo / Bill', 80),
    desc: trunc(d.desc || '', 1000),
    due: nonNeg(d.due, 0),
    paid: nonNeg(d.paid, 0),
    user: trunc(d.user || 'Staff', 120),
    timestamp: trunc(d.timestamp || '', 80),
  };
}

function serializeExpense(e: ExpenseRecord) {
  return {
    id: anyNum(e.id, Date.now()),
    rowId: anyNum(e.rowId ?? e.id, Date.now()),
    expId: trunc(e.expId || `EXP-${e.id}`, 80),
    timestamp: trunc(e.timestamp || '', 80),
    date: trunc(e.date || new Date().toISOString().slice(0, 10), 30),
    category: trunc(e.category || 'Other Expenses', 120),
    desc: trunc(e.desc || '', 1000),
    amount: nonNeg(e.amount, 0),
    user: trunc(e.user || 'Staff', 120),
  };
}

function serializePurchase(p: PurchaseRecord) {
  const docId = sanitizeDocId(p.id || `PUR-${p.rowId || Date.now()}`);
  return {
    id: docId,
    rowId: anyNum(p.rowId, Date.now()),
    date: trunc(p.date || new Date().toISOString().slice(0, 10), 30),
    timestamp: trunc(p.timestamp || '', 80),
    product: trunc(p.product || 'Product', 200),
    category: trunc(p.category || 'Stationery Products', 120),
    qty: Math.max(0.01, nonNeg(p.qty, 1)),
    unitCost: nonNeg(p.unitCost, 0),
    totalCost: nonNeg(p.totalCost, 0),
    supplier: trunc(p.supplier || '', 200),
    notes: trunc(p.notes || '', 500),
    user: trunc(p.user || 'Staff', 120),
  };
}

function serializeCashClosing(c: CashClosingRecord) {
  const docId = sanitizeDocId(c.id || `CC-${c.date}`);
  const denomObj: Record<string, number> = {};
  if (c.denominations && typeof c.denominations === 'object') {
    Object.entries(c.denominations).slice(0, 20).forEach(([k, v]) => {
      denomObj[trunc(k, 20)] = anyNum(v, 0);
    });
  }
  const status =
    c.status === 'Short' || c.status === 'Excess' ? c.status : 'Matched';
  return {
    id: docId,
    rowId: anyNum(c.rowId, Date.now()),
    date: trunc(c.date || new Date().toISOString().slice(0, 10), 30),
    closedAt: trunc(c.closedAt || '', 80),
    user: trunc(c.user || 'Staff', 120),
    openingCash: anyNum(c.openingCash, 0),
    prevShortageDeducted: anyNum(c.prevShortageDeducted, 0),
    salesInflow: anyNum(c.salesInflow, 0),
    dueInflow: anyNum(c.dueInflow, 0),
    totalInflow: anyNum(c.totalInflow, 0),
    expenseOutflow: anyNum(c.expenseOutflow, 0),
    expectedCash: anyNum(c.expectedCash, 0),
    actualCash: anyNum(c.actualCash, 0),
    difference: anyNum(c.difference, 0),
    status,
    notes: trunc(c.notes || '', 500),
    denominations: denomObj,
  };
}

async function upsertDoc(
  colName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const safeId = sanitizeDocId(docId);
  if (!isAuthorizedCloudUser(auth.currentUser)) {
    enqueuePendingCloudOp({ type: 'upsert', colName, docId: safeId, data });
    return;
  }
  const ref = doc(db, colName, safeId);
  const path = `${colName}/${safeId}`;

  try {
    if (knownDocIds[colName]?.has(safeId)) {
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...data,
        ownerEmail: SHOP_OWNER_EMAIL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownDocIds[colName]?.add(safeId);
    }
  } catch (err) {
    // Fallback if document actually existed remotely before local knownDocIds tracked it
    const msg = err instanceof Error ? err.message : String(err);
    if (!knownDocIds[colName]?.has(safeId) && msg.includes('PERMISSION_DENIED')) {
      try {
        await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        knownDocIds[colName]?.add(safeId);
        return;
      } catch (innerErr) {
        enqueuePendingCloudOp({ type: 'upsert', colName, docId: safeId, data });
        handleFirestoreError(innerErr, OperationType.WRITE, path);
      }
    }
    enqueuePendingCloudOp({ type: 'upsert', colName, docId: safeId, data });
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

async function removeDoc(colName: string, docId: string): Promise<void> {
  const safeId = sanitizeDocId(docId);
  if (!isAuthorizedCloudUser(auth.currentUser)) {
    enqueuePendingCloudOp({ type: 'delete', colName, docId: safeId });
    return;
  }
  const path = `${colName}/${safeId}`;
  try {
    await deleteDoc(doc(db, colName, safeId));
    knownDocIds[colName]?.delete(safeId);
  } catch (err) {
    enqueuePendingCloudOp({ type: 'delete', colName, docId: safeId });
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Single Entity Cloud Sync Helpers ---
export const syncSaleToCloud = (sale: SaleRecord) =>
  upsertDoc(CLOUD_COLLECTIONS.sales, `sale_${sale.invoiceNo}`, serializeSale(sale));

export const deleteSaleFromCloud = (invoiceNo: number) =>
  removeDoc(CLOUD_COLLECTIONS.sales, `sale_${invoiceNo}`);

export const syncProductToCloud = (prod: Product) =>
  upsertDoc(CLOUD_COLLECTIONS.products, `prod_${prod.id}`, serializeProduct(prod));

export const deleteProductFromCloud = (id: number | string) =>
  removeDoc(CLOUD_COLLECTIONS.products, `prod_${id}`);

export const syncCustomerToCloud = (cust: Customer) =>
  upsertDoc(CLOUD_COLLECTIONS.customers, `cust_${cust.id}`, serializeCustomer(cust));

export const deleteCustomerFromCloud = (id: number | string) =>
  removeDoc(CLOUD_COLLECTIONS.customers, `cust_${id}`);

export const syncDueRecordToCloud = (dueRec: DueRecord) =>
  upsertDoc(CLOUD_COLLECTIONS.dueRecords, sanitizeDocId(dueRec.id), serializeDueRecord(dueRec));

export const syncExpenseToCloud = (exp: ExpenseRecord) =>
  upsertDoc(CLOUD_COLLECTIONS.expenses, `exp_${exp.id}`, serializeExpense(exp));

export const deleteExpenseFromCloud = (id: number | string) =>
  removeDoc(CLOUD_COLLECTIONS.expenses, `exp_${id}`);

export const syncPurchaseToCloud = (pur: PurchaseRecord) =>
  upsertDoc(CLOUD_COLLECTIONS.purchases, sanitizeDocId(pur.id), serializePurchase(pur));

export const deletePurchaseFromCloud = (id: string) =>
  removeDoc(CLOUD_COLLECTIONS.purchases, sanitizeDocId(id));

export const syncCashClosingToCloud = (cc: CashClosingRecord) =>
  upsertDoc(CLOUD_COLLECTIONS.cashClosings, `cc_${cc.date}`, serializeCashClosing(cc));

export const syncUserToCloud = (u: User) =>
  upsertDoc(CLOUD_COLLECTIONS.users, `user_${u.id}`, serializeUser(u));

export const deleteUserFromCloud = (id: number) =>
  removeDoc(CLOUD_COLLECTIONS.users, `user_${id}`);

export const syncMetaToCloud = (meta: {
  linkedSheetId: string;
  linkedSheetUrl: string;
  lastBackupTime: string;
}) =>
  upsertDoc(CLOUD_COLLECTIONS.meta, 'shop_backup_meta', {
    id: 'shop_backup_meta',
    linkedSheetId: trunc(meta.linkedSheetId, 200),
    linkedSheetUrl: trunc(meta.linkedSheetUrl, 500),
    lastBackupTime: trunc(meta.lastBackupTime, 120),
  });

export async function clearAllCustomersInCloud(customerIds: Array<number | string>): Promise<void> {
  if (!isAuthorizedCloudUser(auth.currentUser) || customerIds.length === 0) return;
  const CHUNK = 400;
  for (let i = 0; i < customerIds.length; i += CHUNK) {
    const batch = writeBatch(db);
    customerIds.slice(i, i + CHUNK).forEach(cid => {
      const safeId = sanitizeDocId(`cust_${cid}`);
      batch.delete(doc(db, CLOUD_COLLECTIONS.customers, safeId));
      knownDocIds.shop_customers.delete(safeId);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, CLOUD_COLLECTIONS.customers);
    }
  }
}

// --- Batch Upload Missing Local/SQLite Records to Firestore (Never Overwrites Existing Cloud Records) ---
export interface ShopSnapshotPayload {
  users: User[];
  products: Product[];
  customers: Customer[];
  sales: SaleRecord[];
  dueRecords: DueRecord[];
  expenses: ExpenseRecord[];
  purchases: PurchaseRecord[];
  cashClosings: CashClosingRecord[];
}

export async function uploadMissingRecordsToCloud(snapshot: ShopSnapshotPayload): Promise<number> {
  if (!isAuthorizedCloudUser(auth.currentUser)) return 0;

  let syncedCount = 0;

  // 1. Flush any genuine local mutations queued while offline
  const pendingOps = readPendingCloudOps();
  if (pendingOps.length > 0) {
    const remaining: PendingCloudOp[] = [];
    for (const op of pendingOps) {
      try {
        if (op.type === 'delete') {
          await removeDoc(op.colName, op.docId);
        } else if (op.data) {
          await upsertDoc(op.colName, op.docId, op.data);
        }
        syncedCount += 1;
      } catch {
        remaining.push(op);
      }
    }
    writePendingCloudOps(remaining);
  }

  // 2. Check if cloud database already holds shop records.
  // If already populated, cloud is authoritative so deletions made on other PCs/mobiles are never resurrected by stale local caches.
  let cloudAlreadySeeded = false;
  try {
    const [salesProbe, prodProbe] = await Promise.all([
      getDocs(query(collection(db, CLOUD_COLLECTIONS.sales), where('ownerEmail', '==', SHOP_OWNER_EMAIL), limit(1))),
      getDocs(query(collection(db, CLOUD_COLLECTIONS.products), where('ownerEmail', '==', SHOP_OWNER_EMAIL), limit(1)))
    ]);
    cloudAlreadySeeded = salesProbe.docs.length > 0 || prodProbe.docs.length > 0;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CLOUD_COLLECTIONS.sales);
  }

  if (cloudAlreadySeeded) {
    return syncedCount;
  }

  type PendingWrite = { col: string; id: string; data: Record<string, unknown> };
  const pending: PendingWrite[] = [];

  const checkAndQueue = async (
    col: string,
    entries: Array<{ id: string; data: Record<string, unknown> }>
  ) => {
    if (entries.length === 0) return;
    let existingSet = knownDocIds[col];
    if (!existingSet || existingSet.size === 0) {
      try {
        const snap = await getDocs(
          query(collection(db, col), where('ownerEmail', '==', SHOP_OWNER_EMAIL))
        );
        existingSet = new Set(snap.docs.map(d => d.id));
        knownDocIds[col] = existingSet;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, col);
      }
    }
    for (const item of entries) {
      if (!existingSet.has(item.id)) {
        pending.push({ col, id: item.id, data: item.data });
      }
    }
  };

  await Promise.all([
    checkAndQueue(
      CLOUD_COLLECTIONS.users,
      snapshot.users.map(u => ({ id: sanitizeDocId(`user_${u.id}`), data: serializeUser(u) }))
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.products,
      snapshot.products.map(p => ({ id: sanitizeDocId(`prod_${p.id}`), data: serializeProduct(p) }))
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.customers,
      snapshot.customers.map(c => ({ id: sanitizeDocId(`cust_${c.id}`), data: serializeCustomer(c) }))
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.sales,
      snapshot.sales.map(s => ({ id: sanitizeDocId(`sale_${s.invoiceNo}`), data: serializeSale(s) }))
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.dueRecords,
      snapshot.dueRecords.map(d => {
        const ser = serializeDueRecord(d);
        return { id: ser.id, data: ser };
      })
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.expenses,
      snapshot.expenses.map(e => ({ id: sanitizeDocId(`exp_${e.id}`), data: serializeExpense(e) }))
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.purchases,
      snapshot.purchases.map(p => {
        const ser = serializePurchase(p);
        return { id: ser.id, data: ser };
      })
    ),
    checkAndQueue(
      CLOUD_COLLECTIONS.cashClosings,
      snapshot.cashClosings.map(c => ({ id: sanitizeDocId(`cc_${c.date}`), data: serializeCashClosing(c) }))
    ),
  ]);

  if (pending.length === 0) return syncedCount;

  const CHUNK = 400;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const slice = pending.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    slice.forEach(item => {
      batch.set(doc(db, item.col, item.id), {
        ...item.data,
        ownerEmail: SHOP_OWNER_EMAIL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownDocIds[item.col]?.add(item.id);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch_sync');
    }
  }

  return syncedCount + pending.length;
}

// --- Real-Time Listeners Across All Devices ---
export interface CloudRealtimeHandlers {
  onUsers: (items: User[]) => void;
  onProducts: (items: Product[]) => void;
  onCustomers: (items: Customer[]) => void;
  onSales: (items: SaleRecord[]) => void;
  onDueRecords: (items: DueRecord[]) => void;
  onExpenses: (items: ExpenseRecord[]) => void;
  onPurchases: (items: PurchaseRecord[]) => void;
  onCashClosings: (items: CashClosingRecord[]) => void;
  onMeta?: (meta: { linkedSheetId: string; linkedSheetUrl: string; lastBackupTime: string }) => void;
  onError?: (err: Error) => void;
}

export function subscribeToShopCloud(handlers: CloudRealtimeHandlers): () => void {
  const unsubs: Unsubscribe[] = [];

  const listen = <T>(
    colName: string,
    mapDoc: (data: Record<string, any>) => T,
    onData: (items: T[]) => void
  ) => {
    const q = query(
      collection(db, colName),
      where('ownerEmail', '==', SHOP_OWNER_EMAIL)
    );
    const unsub = onSnapshot(
      q,
      snapshot => {
        knownDocIds[colName] = new Set(snapshot.docs.map(d => d.id));
        const items = snapshot.docs.map(d => mapDoc(d.data()));
        onData(items);
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, colName);
        } catch (wrapped) {
          if (handlers.onError && wrapped instanceof Error) {
            handlers.onError(wrapped);
          }
        }
      }
    );
    unsubs.push(unsub);
  };

  listen<User>(
    CLOUD_COLLECTIONS.users,
    d => ({
      id: Number(d.id) || 1,
      username: String(d.username || ''),
      role: d.role === 'admin' ? 'admin' : 'staff',
      phone: String(d.phone || ''),
      permissions: String(d.permissions || ''),
    }),
    items => {
      if (items.length > 0) {
        handlers.onUsers([...items].sort((a, b) => a.username.localeCompare(b.username)));
      }
    }
  );

  listen<Product>(
    CLOUD_COLLECTIONS.products,
    d => ({
      id: Number(d.id) || 0,
      rowId: Number(d.rowId ?? d.id) || 0,
      sl: Number(d.sl) || 0,
      category: normalizeCategory(d.category),
      name: String(d.name || ''),
      price: Number(d.price) || 0,
      costPrice: Number(d.costPrice) || 0,
      stockQty: d.stockQty === null || d.stockQty === undefined ? null : Number(d.stockQty),
      lowStockLimit: Number(d.lowStockLimit) || 5,
    }),
    items => {
      if (items.length > 0) {
        handlers.onProducts(
          [...items].sort((a, b) => a.category.localeCompare(b.category) || a.sl - b.sl)
        );
      }
    }
  );

  listen<Customer>(
    CLOUD_COLLECTIONS.customers,
    d => ({
      id: Number(d.id) || 0,
      rowId: Number(d.rowId ?? d.id) || 0,
      sl: Number(d.sl) || 0,
      name: String(d.name || ''),
      phone: String(d.phone || ''),
      address: String(d.address || ''),
    }),
    items => {
      handlers.onCustomers([...items].sort((a, b) => (a.sl || 0) - (b.sl || 0)));
    }
  );

  listen<SaleRecord>(
    CLOUD_COLLECTIONS.sales,
    d => ({
      id: Number(d.id) || 0,
      rowId: Number(d.rowId ?? d.id) || 0,
      invoiceNo: Number(d.invoiceNo) || 0,
      timestamp: String(d.timestamp || ''),
      rawDate: String(d.rawDate || d.date || ''),
      date: String(d.date || d.rawDate || ''),
      user: String(d.user || ''),
      customer: String(d.customer || 'Cash Customer'),
      phone: String(d.phone || ''),
      address: String(d.address || ''),
      category: String(d.category || ''),
      desc: String(d.desc || ''),
      subtotal: Number(d.subtotal) || 0,
      discount: Number(d.discount) || 0,
      grandTotal: Number(d.grandTotal) || 0,
      paid: Number(d.paid) || 0,
      due: Number(d.due) || 0,
      items: Array.isArray(d.items) ? d.items : [],
    }),
    items => {
      if (items.length > 0) {
        handlers.onSales([...items].sort((a, b) => (b.invoiceNo || 0) - (a.invoiceNo || 0)));
      }
    }
  );

  listen<DueRecord>(
    CLOUD_COLLECTIONS.dueRecords,
    d => ({
      id: String(d.id || ''),
      rowId: Number(d.rowId) || 0,
      date: String(d.date || ''),
      customer: String(d.customer || ''),
      phone: String(d.phone || ''),
      address: String(d.address || ''),
      type: String(d.type || 'Memo / Bill'),
      desc: String(d.desc || ''),
      due: Number(d.due) || 0,
      paid: Number(d.paid) || 0,
      user: String(d.user || ''),
      timestamp: String(d.timestamp || ''),
    }),
    items => {
      handlers.onDueRecords([...items].sort((a, b) => (b.rowId || 0) - (a.rowId || 0)));
    }
  );

  listen<ExpenseRecord>(
    CLOUD_COLLECTIONS.expenses,
    d => ({
      id: Number(d.id) || 0,
      rowId: Number(d.rowId ?? d.id) || 0,
      expId: String(d.expId || ''),
      timestamp: String(d.timestamp || ''),
      date: String(d.date || ''),
      category: String(d.category || ''),
      desc: String(d.desc || ''),
      amount: Number(d.amount) || 0,
      user: String(d.user || ''),
    }),
    items => {
      handlers.onExpenses([...items].sort((a, b) => (b.id || 0) - (a.id || 0)));
    }
  );

  listen<PurchaseRecord>(
    CLOUD_COLLECTIONS.purchases,
    d => ({
      id: String(d.id || ''),
      rowId: Number(d.rowId) || 0,
      date: String(d.date || ''),
      timestamp: String(d.timestamp || ''),
      product: String(d.product || ''),
      category: String(d.category || ''),
      qty: Number(d.qty) || 0,
      unitCost: Number(d.unitCost) || 0,
      totalCost: Number(d.totalCost) || 0,
      supplier: String(d.supplier || ''),
      notes: String(d.notes || ''),
      user: String(d.user || ''),
    }),
    items => {
      handlers.onPurchases([...items].sort((a, b) => (b.rowId || 0) - (a.rowId || 0)));
    }
  );

  listen<CashClosingRecord>(
    CLOUD_COLLECTIONS.cashClosings,
    d => ({
      id: String(d.id || ''),
      rowId: Number(d.rowId) || 0,
      date: String(d.date || ''),
      closedAt: String(d.closedAt || ''),
      user: String(d.user || ''),
      openingCash: Number(d.openingCash) || 0,
      prevShortageDeducted: Number(d.prevShortageDeducted) || 0,
      salesInflow: Number(d.salesInflow) || 0,
      dueInflow: Number(d.dueInflow) || 0,
      totalInflow: Number(d.totalInflow) || 0,
      expenseOutflow: Number(d.expenseOutflow) || 0,
      expectedCash: Number(d.expectedCash) || 0,
      actualCash: Number(d.actualCash) || 0,
      difference: Number(d.difference) || 0,
      status: d.status === 'Short' || d.status === 'Excess' ? d.status : 'Matched',
      notes: String(d.notes || ''),
      denominations: d.denominations || {},
    }),
    items => {
      handlers.onCashClosings([...items].sort((a, b) => b.date.localeCompare(a.date)));
    }
  );

  if (handlers.onMeta) {
    listen(
      CLOUD_COLLECTIONS.meta,
      d => ({
        linkedSheetId: String(d.linkedSheetId || ''),
        linkedSheetUrl: String(d.linkedSheetUrl || ''),
        lastBackupTime: String(d.lastBackupTime || ''),
      }),
      items => {
        if (items.length > 0 && handlers.onMeta) {
          handlers.onMeta(items[0]);
        }
      }
    );
  }

  return () => {
    unsubs.forEach(u => u());
  };
}

// --- Client-Side Auto Backup Dispatch to Google Apps Script (Works Even When Static Hosted) ---
export async function dispatchClientAutoBackup(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(PERMANENT_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fallback — cloud Firestore already holds authoritative backup
  }
}
