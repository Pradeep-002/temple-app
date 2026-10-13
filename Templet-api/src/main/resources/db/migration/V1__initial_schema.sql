-- PostgreSQL DDL Migration for Oor Nithi (ஊர் நிதி) Multi-Tenant Sangam Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SANGAMS (Tenants)
CREATE TABLE sangams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    start_date DATE,
    location VARCHAR(255),
    address TEXT,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID REFERENCES sangams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, SANGAM_ADMIN, COLLECTOR, MEMBER
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    member_code VARCHAR(50),
    gender VARCHAR(20),
    dob DATE,
    address TEXT,
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_sangam_mobile UNIQUE (sangam_id, mobile_number)
);

-- Index for tenant query isolation
CREATE INDEX idx_users_sangam_id ON users(sangam_id);
CREATE INDEX idx_users_mobile ON users(mobile_number);

-- 3. COLLECTION CONFIGURATIONS
CREATE TABLE collection_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    collection_name VARCHAR(255) NOT NULL,
    collection_type VARCHAR(100) DEFAULT 'MONTHLY',
    monthly_amount NUMERIC(12, 2) NOT NULL CHECK (monthly_amount >= 0),
    start_month INT NOT NULL CHECK (start_month BETWEEN 1 AND 12),
    start_year INT NOT NULL,
    end_month INT NOT NULL CHECK (end_month BETWEEN 1 AND 12),
    end_year INT NOT NULL,
    due_date INT DEFAULT 10,
    grace_period INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coll_config_sangam ON collection_configurations(sangam_id);

-- 4. MEMBER COLLECTIONS (Expected Monthly Slots)
CREATE TABLE member_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES collection_configurations(id) ON DELETE SET NULL,
    month_name VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    period_order INT NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL CHECK (expected_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(12, 2) NOT NULL CHECK (balance_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_member_period UNIQUE (member_id, year, month_name)
);

CREATE INDEX idx_mem_coll_sangam ON member_collections(sangam_id);
CREATE INDEX idx_mem_coll_member ON member_collections(member_id);

-- 5. COLLECTION PAYMENTS
CREATE TABLE collection_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    member_collection_id UUID NOT NULL REFERENCES member_collections(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH', -- CASH, UPI, BANK_TRANSFER, OTHER
    reference_number VARCHAR(100),
    remarks TEXT,
    collected_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coll_pay_sangam ON collection_payments(sangam_id);

-- 6. EVENTS
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    tamil_event_name VARCHAR(255),
    temple_name VARCHAR(255),
    event_type VARCHAR(100) DEFAULT 'TEMPLE_FESTIVAL',
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(255),
    description TEXT,
    expected_budget NUMERIC(12, 2) DEFAULT 0 CHECK (expected_budget >= 0),
    status VARCHAR(50) DEFAULT 'UPCOMING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_sangam ON events(sangam_id);

-- 7. EVENT EXPENSES
CREATE TABLE event_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    expense_category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE DEFAULT CURRENT_DATE,
    vendor_name VARCHAR(255),
    payment_mode VARCHAR(50) DEFAULT 'CASH',
    reference_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_exp_sangam ON event_expenses(sangam_id);

-- 8. DONATIONS
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    donor_name VARCHAR(255) NOT NULL,
    donor_mobile VARCHAR(20),
    donation_purpose VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    donation_date DATE DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(50) DEFAULT 'CASH',
    reference_number VARCHAR(100),
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_donations_sangam ON donations(sangam_id);

-- 9. GENERAL EXPENSES
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    expense_category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE DEFAULT CURRENT_DATE,
    paid_to VARCHAR(255),
    payment_mode VARCHAR(50) DEFAULT 'CASH',
    reference_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_sangam ON expenses(sangam_id);

-- 10. FINANCIAL LEDGER TRANSACTIONS
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- MEMBER_COLLECTION, DONATION, EXPENSE, EVENT_EXPENSE
    reference_id UUID,
    credit_amount NUMERIC(12, 2) DEFAULT 0 CHECK (credit_amount >= 0),
    debit_amount NUMERIC(12, 2) DEFAULT 0 CHECK (debit_amount >= 0),
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT,
    created_by VARCHAR(255),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_sangam ON ledger_transactions(sangam_id);

-- 11. SUBSCRIPTION PLANS
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    billing_cycle_months INT NOT NULL DEFAULT 12,
    member_limit INT DEFAULT 1000,
    agent_limit INT DEFAULT 50,
    event_limit INT DEFAULT 100,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TRIAL', -- TRIAL, ACTIVE, EXPIRED, CANCELLED
    is_trial BOOLEAN DEFAULT TRUE,
    payment_status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_sangam ON subscriptions(sangam_id);

-- 13. SUPPORT REQUESTS
CREATE TABLE support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID REFERENCES sangams(id) ON DELETE SET NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_mobile VARCHAR(20) NOT NULL,
    requester_email VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sangam_id UUID REFERENCES sangams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_sangam ON audit_logs(sangam_id);
