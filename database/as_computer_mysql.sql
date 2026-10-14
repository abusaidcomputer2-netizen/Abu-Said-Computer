-- ====================================================================
-- AS COMPUTER — PRODUCTION MYSQL / MARIADB DATABASE SCHEMA & SEEDS
-- Location: Paduar Bazar, Cumilla, Bangladesh
-- Compatible with: MySQL 8.0+, MariaDB 10.4+, phpMyAdmin & cPanel
-- Character set: utf8mb4 (Full Bengali Unicode Support)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `due_ledger`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `cash_closings`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS & PERMISSIONS
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  `phone` VARCHAR(25) DEFAULT '',
  `permissions` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUSTOMERS
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sl` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `address` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cust_name` (`name`),
  INDEX `idx_cust_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTS & SERVICES
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sl` INT NOT NULL,
  `category` ENUM('Photocopy', 'Online Application', 'Stationery Products') NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stock_qty` DECIMAL(12,2) DEFAULT NULL,
  `low_stock_limit` DECIMAL(12,2) DEFAULT 5.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_prod_cat_sl` (`category`, `sl`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SALES / INVOICES
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` INT NOT NULL UNIQUE,
  `timestamp` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `customer_id` INT NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT '',
  `customer_address` VARCHAR(255) DEFAULT '',
  `category_summary` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `items_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sales_date` (`date`),
  INDEX `idx_sales_invoice` (`invoice_no`),
  INDEX `idx_sales_customer` (`customer_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SALE ITEMS
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `invoice_no` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `qty` DECIMAL(12,2) NOT NULL,
  `total` DECIMAL(12,2) NOT NULL,
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DUE LEDGER (PERMANENT AUDIT HISTORY)
CREATE TABLE `due_ledger` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entry_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT '',
  `customer_address` VARCHAR(255) DEFAULT '',
  `transaction_type` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `due_dr` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_cr` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `user_name` VARCHAR(100) DEFAULT '',
  `timestamp` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_due_cust` (`customer_name`),
  INDEX `idx_due_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PURCHASES & SUPPLIER KHATA
CREATE TABLE `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Stationery Products',
  `qty` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `supplier` VARCHAR(191) DEFAULT '',
  `notes` TEXT,
  `user_name` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pur_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. EXPENSES
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_id` VARCHAR(50) NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `amount` DECIMAL(12,2) NOT NULL,
  `user_name` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exp_date` (`date`),
  INDEX `idx_exp_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. DAILY CASH CLOSING & DRAWER RECONCILIATION
CREATE TABLE `cash_closings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `closing_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL UNIQUE,
  `closed_at` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `opening_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `prev_shortage_deducted` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `sales_inflow` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `due_inflow` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_inflow` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expense_outflow` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expected_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `actual_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `difference` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Matched', 'Short', 'Excess') NOT NULL,
  `notes` TEXT,
  `denominations_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- INITIAL SEEDS (AS COMPUTER DEFAULT STORE SETUP)
-- ====================================================================

INSERT INTO `users` (`username`, `password_hash`, `role`, `phone`, `permissions`) VALUES
('Md Abu Said', '123456', 'admin', '01904142370', 'all'),
('Md Sujon', '123456', 'staff', '01800000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'),
('Md Saimon Hasan', '123456', 'staff', '01700000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print');

INSERT INTO `customers` (`sl`, `name`, `phone`, `address`) VALUES
(1, 'Al Aqsa Qiraatul Quran Madrasa', '01819234567', 'Paduar Bazar, Cumilla'),
(2, 'Hasan Trading Corporation', '01711223344', 'Kazi Para, Sadar Dakshin, Cumilla'),
(3, 'Noorani Muallim Training Center', '01912345678', 'Paduar Bazar, Cumilla'),
(4, 'Ali Ahmed', '01623456789', 'Ramgati, Lakshmipur'),
(5, 'Darul Ihsan Madrasa', '01734567890', 'Paduar Bazar, Cumilla'),
(6, 'Kabir Enterprise', '01845678901', 'Tombulpur, Cumilla');

INSERT INTO `products` (`sl`, `category`, `name`, `selling_price`, `cost_price`, `stock_qty`, `low_stock_limit`) VALUES
(1, 'Photocopy', 'A4 B/W Photocopy (Single)', 3.00, 1.00, NULL, 5.00),
(2, 'Photocopy', 'A4 B/W Photocopy (Double)', 5.00, 1.80, NULL, 5.00),
(3, 'Photocopy', 'Legal B/W Photocopy', 4.00, 1.50, NULL, 5.00),
(4, 'Photocopy', 'A4 Color Print (Glossy)', 15.00, 6.00, NULL, 5.00),
(5, 'Photocopy', 'Document Scanning & Email', 20.00, 2.00, NULL, 5.00),
(6, 'Photocopy', 'Lamination A4', 20.00, 7.00, NULL, 5.00),

(1, 'Online Application', 'Job Application Form Fillup', 150.00, 0.00, NULL, 5.00),
(2, 'Online Application', 'Birth Registration / Shonod', 100.00, 0.00, NULL, 5.00),
(3, 'Online Application', 'NID Correction / Re-issue', 200.00, 0.00, NULL, 5.00),
(4, 'Online Application', 'Passport Online Application', 300.00, 0.00, NULL, 5.00),
(5, 'Online Application', 'College / University Admission', 150.00, 0.00, NULL, 5.00),
(6, 'Online Application', 'Police Clearance Application', 250.00, 0.00, NULL, 5.00),

(1, 'Stationery Products', 'Bashundhara A4 Paper 80GSM (Ream)', 380.00, 320.00, 45.00, 5.00),
(2, 'Stationery Products', 'PaperOne A4 70GSM (Ream)', 350.00, 295.00, 30.00, 5.00),
(3, 'Stationery Products', 'Legal Paper Ream (80GSM)', 450.00, 390.00, 18.00, 5.00),
(4, 'Stationery Products', 'Matador Ball Pen (Black/Blue)', 5.00, 3.80, 120.00, 20.00),
(5, 'Stationery Products', 'Clear Plastic Document File', 15.00, 8.00, 80.00, 15.00),
(6, 'Stationery Products', 'Gel Pen (Pilot G2)', 60.00, 45.00, 25.00, 5.00),
(7, 'Stationery Products', 'Lamination Pouch A4 (Pkt 100pcs)', 350.00, 280.00, 12.00, 3.00),
(8, 'Stationery Products', 'Stamp Pad Ink Blue', 40.00, 25.00, 15.00, 3.00),
(9, 'Stationery Products', 'Spiral Binding Sheet A4', 8.00, 4.00, 150.00, 25.00),
(10, 'Stationery Products', 'Stapler Machine No. 10', 85.00, 60.00, 10.00, 2.00);
