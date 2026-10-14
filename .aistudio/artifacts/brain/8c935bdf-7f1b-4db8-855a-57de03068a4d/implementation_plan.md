# AS Computer — Premium Shop Management Web Application

A high-performance, secure, hosting-ready full-stack shop management web application replacing the Google Apps Script & Google Sheets system for **AS Computer** (Paduar Bazar, Cumilla, Bangladesh). Designed with real-time relational transaction integrity, automated stock reconciliation, customer due tracking, physical cash closing reconciliation, and pixel-perfect A4 printing in BDT (৳).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural and technology choices confirmed during Phase 1 have been integrated:
> - **Architecture & Runtime**: Full-stack Node.js & Express REST API backend with modern React 19 + Tailwind CSS frontend. Runs immediately in this development environment and includes exportable, production-ready MySQL/MariaDB database schemas and cPanel deployment packages.
> - **Database Strategy**: Relational SQLite (`better-sqlite3` / zero-latency file storage) for instant dev server execution with matching MySQL 8.0+ production DDL migrations.
> - **Language & Typography**: Integrated bilingual layout pairing clear Bengali shop terminology with clean English numbers, labels, and tabular figures (`tabular-nums`).

---

## A. Existing Source-Code Audit & Feature Inventory

Based on a thorough line-by-line audit of the uploaded `Code.gs` (1,032 lines) and `Index.html` (2,735 lines), here is the complete functional inventory:

### 1. Authentication, Staff & Permissions
- **Users**: Username, password, phone, role (`admin`, `staff`), granular permissions string.
- **Granular Feature Access**:
  - `memo`: Daily Sales & Memo Entry
  - `due`: Customer Due Ledger & Payment Collection
  - `customer`: Customer Directory
  - `cust_sales`: Customer Sales Records & History
  - `stock`: Stationery Stock Inventory & Valuation
  - `purchase`: Product Purchase Register & Khata
  - `paper`: Photocopy Paper Usage Logger
  - `cash_closing`: Daily Cash Closing & Drawer Reconciliation
  - `summary_print`: Sales Report Print / PDF
  - `financial`: Business Financial Statement (Admin / authorized)
  - `expense`: Daily Expense Entry & Reports
  - `product`: Product Database CRUD
- **Audit Trails**: Every invoice, payment, purchase, expense, and cash closing records the responsible username and timestamp.

### 2. Products & Inventory Management
- **3 Business Categories**:
  1. `Photocopy` (Service items, custom naming permitted)
  2. `Online Application` (Service items, custom naming permitted)
  3. `Stationery Products` (Physical goods with strict stock tracking; custom item naming strictly forbidden)
- **Product Fields**: `SL` (Serial per category), `Category`, `Name`, `Price` (Selling), `CostPrice`, `StockQty`, `LowStockLimit` (default 5).
- **Automated Stock Deductions**:
  - Automatically decrements stock on invoice creation.
  - Automatically calculates net delta on invoice edit (`adjustProductStockDifference`).
  - Automatically restores inventory on memo deletion (`restoreProductStock`).
  - Strict out-of-stock and stock-cap validation (prevents overselling stationery items).
- **Photocopy Paper Usage**:
  - Deducts ream/unit counts directly from paper inventory while recording an expense under `"Photocopy Paper & Toner Purchase"`.

### 3. Invoices & Billing
- **Sequential Invoicing**: Auto-incrementing numbering starting at `4001+` (`AS-XXXX`).
- **Customer Association**: Auto-lookup by mobile or name; fallback to `"New Customer"`.
- **Itemized Structure**: Array of line items with rate, quantity, line total, and unit cost.
- **Discount & Due Flow**:
  - $\text{Grand Total} = \max(0, \text{Subtotal} - \text{Discount})$
  - Auto-calculated `Paid` amount (defaults to 100% full payment) with editable partial payment.
  - $\text{Due} = \max(0, \text{Grand Total} - \text{Paid})$.
  - If $\text{Due} > 0$, automatically generates linked due ledger entry (`INV-XXXX`).
- **Safety Safeguards**: Admin-only two-step deletion with explicit `"DELETE"` confirmation prompt.

### 4. Due Ledger & Debt Collection
- **Audit Immutability**: Historical records are never deleted (`deleteDueTransaction` returns explicit audit error). Invoices marked paid update due balance to 0 while preserving history.
- **Dual Flow**:
  - Debit (Dr): Billed invoice due.
  - Credit (Cr): Customer payment received (`PAY-XXXX` with cash/bKash notes).
- **Reporting**: Individual customer ledger statements and consolidated all-due customer statements.

### 5. Purchases & Supplier Khata
- **Multi-Item Entry**: Allows adding multiple items per supplier invoice in a single voucher.
- **Dual Effect**: Automatically increments product stock and logs a consolidated operating expense under `"Stationery Products Purchase"`.

### 6. Daily Cash Closing & Drawer Reconciliation
- **Opening Cash Logic**:
  - Automatically carries over yesterday's closing cash drawer balance.
  - **Month-Start Rule**: Automatically resets to 0 on the 1st of every month (previous month's cash does not carry over into current month opening).
- **Previous Day Shortage Deduction**:
  - If yesterday's cash closing resulted in a shortage, it is automatically deducted from today's expected drawer cash.
- **Reconciliation Equation**:
  $$\text{Expected Cash} = \text{Opening Cash} + \text{Sales Cash Inflow} + \text{Due Inflow} - \text{Prev Shortage} - \text{Expense Outflows}$$
- **Physical Denomination Counter**:
  - Multipliers for ৳1000, ৳500, ৳200, ৳100, ৳50, ৳20, ৳10, ৳5 notes and loose coins.
- **Discrepancy Status**: Matched ($\Delta = 0$), Short ($\Delta < 0$), or Excess ($\Delta > 0$).

### 7. Printing & Reports (A4 Pixel-Perfect)
- Sales Invoices with custom SVG barcode (`AS-XXXX`), customer details, itemized table, dual signatures (dotted customer, solid authorized), and exact timestamp format (`DD-MMM-YYYY hh:mm:ss A`).
- Customer Due Ledger Statement.
- Daily & Monthly Sales Summary Reports.
- Category Summary & Detailed Expense Statements.
- Stationery Stock Inventory & Valuation Report.
- Business Financial Statement (KPI cards, Revenue Inflow vs Operating Outflows, Due Reconciliation).
- Customer Sales & Purchase History Statement.
- Daily Cash Closing & Drawer Slip.

---

## B. Database Architecture & Schema Comparison

### Google Sheets Limitations vs. Relational Architecture

| Google Sheet | Identified Vulnerability | Relational Table | Constraints & Optimization |
| :--- | :--- | :--- | :--- |
| `Users` | Passwords stored in plaintext cells; no session hashing. | `users` | `id`, `username` UNIQUE, `password_hash` (bcrypt/argon2), `role`, `phone`, `permissions`, `created_at`. |
| `Customers` | Name collisions, non-indexed scans on 1,000+ rows. | `customers` | `id`, `sl` UNIQUE, `name` INDEX, `phone` INDEX, `address`, `created_at`. |
| `Products` | Stock race conditions, stringly-typed numeric fields. | `products` | `id`, `sl`, `category` (enum), `name`, `selling_price` (DECIMAL), `cost_price` (DECIMAL), `stock_qty` (INT), `low_stock_limit` (INT). |
| `Database` (Invoices) | Items stored as JSON string blobs in cell; race on max ID. | `sales`, `sale_items` | Normalized foreign keys (`sale_id`), atomic transaction serials, indexed date ranges. |
| `DueLedger` | Duplicate rows cleaned by regex loop scanning full sheet. | `due_ledger` | Foreign keys to `customers` and `sales`, Dr/Cr decimal tracking, immutable audit ledger. |
| `Purchases` | Purchase updates stock via sheet loops with no ACID guarantee. | `purchases`, `purchase_items` | Database transaction wrapping stock increment + expense entry. |
| `Expenses` | Manual row insertions, no category index. | `expenses` | `id`, `date` INDEX, `category` INDEX, `amount` (DECIMAL), `description`, `user_id`. |
| `CashClosing` | JSON stringified denominations, no foreign key audit. | `cash_closings` | `id`, `date` UNIQUE, `opening_cash`, `prev_shortage`, `expected_cash`, `actual_cash`, `difference`, `status`, `denominations_json`. |

---

## C. System Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AS COMPUTER CLIENT (REACT 19 + TAILWIND)             │
│                                                                        │
│   ┌───────────────────┬─────────────────────┬──────────────────────┐   │
│   │   Point of Sale   │   Due Ledger & Pay  │   Cash Closing & Den │   │
│   │   & Memo Entry    │   Statement Engine  │   Drawer Calculator  │   │
│   └─────────┬─────────┴──────────┬──────────┴──────────┬───────────┘   │
│             │                    │                     │               │
│   ┌─────────▼─────────┬──────────▼──────────┬──────────▼───────────┐   │
│   │ Stock & Inventory │ Expense & Purchases │ 8 Printable A4 Print │   │
│   │ Valuation Panel   │ Registration Khata  │ Layout Templates     │   │
│   └───────────────────┴─────────────────────┴──────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON API (REST)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  FULL-STACK NODE.JS / EXPRESS BACKEND                  │
│                                                                        │
│   ┌─────────────────┬───────────────────┬──────────────────────────┐   │
│   │ Auth & Session  │ ACID Transactions │ Financial Formula Engine │   │
│   │ Role Validator  │ & Stock Mutator   │ (Gross/Net/Cash Flow)    │   │
│   └────────┬────────┴─────────┬─────────┴──────────────┬───────────┘   │
│            │                  │                        │               │
│   ┌────────▼────────┬─────────▼─────────┬──────────────▼───────────┐   │
│   │ Data Migration  │ cPanel MySQL DDL  │ Daily Cash Drawer State  │   │
│   │ Importer/Export │ Exporter Script   │ & Shortage Deductions    │   │
│   └─────────────────┴───────────────────┴──────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    RELATIONAL PERSISTENCE LAYER                        │
│                                                                        │
│   - Development Engine: Local SQLite with complete relational schema   │
│   - Production Deployment: Zero-friction MySQL / MariaDB (cPanel ready)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## D. Identified Performance Bottlenecks & Security Risks in Legacy Code

1. **Catastrophic Bottleneck — Full Table Scans**:
   - Every login or filter in Apps Script invoked `getAppBootstrapData()`, which read all rows across 6 different sheets into memory. As records exceed 5,000, response times degrade beyond 15–20 seconds.
   - *Fix*: Express server-side SQL pagination (`LIMIT`/`OFFSET`), composite indexing on `(date, customer_id)`, and fast SQL aggregates (`SUM(grand_total)`).
2. **Plaintext Passwords**:
   - `Code.gs` compared passwords in plain text directly from sheet cells.
   - *Fix*: Argon2/bcrypt salted hashes with secure HTTP-only sessions.
3. **Concurrency Race Conditions**:
   - `getNextInvoiceNumber()` reads the last row of the sheet. If two staff submit memos simultaneously, duplicate memo numbers collide.
   - *Fix*: Atomic database transactions (`BEGIN IMMEDIATE TRANSACTION`) and unique database auto-increment keys.
4. **Data Desynchronization**:
   - Reconciling dues required `reconcileDueWithDatabase()`, a manual loop that compared strings with regex.
   - *Fix*: Single-transaction relational commits: writing a memo and its due balance occurs inside an atomic transaction.

---

## E. Safe Migration Strategy for Real Google Sheets Data

A dedicated migration module will be built directly into the application with an administrative interface:

```
[Google Sheets CSV / JSON Export]
                │
                ▼
   [Validation & Normalization]
   - Parse Bengali/English dates (ISO, Excel epoch, DD-MMM-YYYY)
   - Canonical customer phone & name matching
   - Clean memo numbers (#4053 -> 4053)
                │
                ▼
   [Dry-Run Simulation Report]
   - Record count match
   - Financial reconciliation check (Total Due Sheets vs Total Due Database)
   - Stock balance verification
                │
                ▼
   [Atomic Relational Import]
   - Transactional commit with rollback on any failure
   - Export verification summary report
```

---

## F. Phased Implementation Roadmap

### Phase 1: Database Architecture, Relational Models & Express Engine
- Establish SQLite schema with typed relational tables matching MySQL 8.0+ types.
- Seed initial users (`Md Abu Said`, `Md Sujon`, `Md Saimon Hasan`), categories, products, and customers.
- Implement server-side REST API with authentication, permissions checking, and transaction wrappers.

### Phase 2: Core POS, Billing & Automated Stock Engine
- Build Daily Sales & Memo Entry with real-time subtotal, discount, paid, and due calculation.
- Implement product selector with category filtering and stationery out-of-stock guardrails.
- Enforce automated stock deduction, invoice edit delta adjustment, and stock restoration on deletion.
- Implement Admin two-step deletion modal with `"DELETE"` confirmation.

### Phase 3: Due Ledger, Customers & Purchases Khata
- Customer directory CRUD with phone and address persistence.
- Due ledger engine with debit/credit tracking and audit immutability.
- Customer payment collection form with instant balance updates.
- Purchases register supporting multi-item supplier entries and auto-stock updates.
- Photocopy paper usage logging (stock reduction + expense generation).

### Phase 4: Cash Closing, Drawer Reconciliation & Expenses
- Daily cash closing view with automated inflow/outflow tally.
- Previous day shortage deduction and 1st-of-month opening balance reset.
- Interactive physical note & coin denomination counter.
- Daily expense manager with category grouping and monthly filters.

### Phase 5: High-Precision A4 Printing Engine & Reporting
- Implement all 8 print layouts matching official AS Computer branding:
  1. Sales Invoice (`AS-XXXX` with barcode and signatures)
  2. Customer Due Ledger Statement
  3. Sales Report Preview
  4. Expense Statement
  5. Stationery Stock Inventory & Valuation Report
  6. Business Financial Statement
  7. Customer Sales Statement
  8. Daily Cash Closing Slip

### Phase 6: Production MySQL Export & Deployment Package
- Exportable `schema.sql` and `seeds.sql` for cPanel / MySQL deployment.
- Complete cPanel deployment documentation and environment configuration.
- End-to-end verification and compile check.
