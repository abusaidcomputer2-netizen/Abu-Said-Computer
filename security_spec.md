# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Verified Shop Owner / Admin Gate**: No read, list, create, update, or delete is permitted unless `request.auth != null && request.auth.token.email_verified == true` AND the caller is either the bootstrapped shop owner (`abusaidcomputer2@gmail.com`) or listed in `/admins/{request.auth.uid}`.
2. **PII Isolation**: `shop_customers`, `shop_sales`, `shop_due_ledger`, and `shop_users` contain customer/staff PII (`phone`, `address`) and are strictly blocked for all non-admin/unverified callers.
3. **Document ID Poisoning Prevention**: Every single-document operation (`get`, `create`, `update`, `delete`) validates `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, length `<= 128`).
4. **Strict Key & Size Allowlisting**: Every entity uses `keys().hasAll(...) && keys().hasOnly(...)` on `create`, and every `update` branch checks `isValid[Entity](incoming())`, `affectedKeys().hasOnly(...)`, immutable `createdAt`, and `updatedAt == request.time`.
5. **Financial & State Integrity**: `shop_sales` mandates `paid <= grandTotal + 0.01`, non-negative `subtotal`, `discount`, `grandTotal`, `paid`, `due`, and bounded `items` list (`items.size() >= 1 && items.size() <= 100`).
6. **Temporal Integrity**: All `createdAt` (on create) and `updatedAt` (on create & update) MUST equal `request.time`.
7. **Secure List Queries**: Every `allow list` rule evaluates `resource.data.ownerEmail == 'abusaidcomputer2@gmail.com'` alongside `isVerifiedShopAdmin()` — zero blanket `isSignedIn()` list rules.

## 2. The "Dirty Dozen" Attack Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read/List**: Anonymous caller attempts `getDocs(collection(db, 'shop_sales'))` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoofing**: Caller with `email: 'abusaidcomputer2@gmail.com'` and `email_verified: false` attempts `getDoc` on `/shop_customers/cust_1` -> `PERMISSION_DENIED`.
3. **Unauthorized Verified Email**: Verified non-admin user (`attacker@gmail.com`) attempts `list` on `/shop_sales` -> `PERMISSION_DENIED`.
4. **Self-Assigned Admin Escalation**: Non-admin user attempts `setDoc` on `/admins/<their_uid>` -> `PERMISSION_DENIED`.
5. **Document ID Poisoning**: Admin attempts `setDoc` on `/shop_customers/bad.id/or/too_long_...` or `$bad$id` -> `PERMISSION_DENIED`.
6. **Shadow / Ghost Field Injection (Create)**: Payload on `/shop_sales/sale_4001` includes unexpected field `isBackdoored: true` -> `PERMISSION_DENIED`.
7. **Shadow / Ghost Field Injection (Update)**: Update payload on `/shop_products/prod_1` adds undeclared key `discountOverride: 999` -> `PERMISSION_DENIED`.
8. **Value Poisoning (Unbounded String)**: Payload on `/shop_customers/cust_1` sets `address` to a 5,000-character string (`> 300`) -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Create payload sets `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` (`serverTimestamp()`) -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: Update payload changes `createdAt` or `ownerEmail` on `/shop_sales/sale_4001` -> `PERMISSION_DENIED`.
11. **Financial Over-Payment Injection**: `shop_sales` write sets `grandTotal: 100, paid: 500` -> `PERMISSION_DENIED`.
12. **Unbounded Array Bomb**: `shop_sales` write sets `items` array with 250 items (`> 100`) -> `PERMISSION_DENIED`.
