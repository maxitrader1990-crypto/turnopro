-- TurnoPro SaaS - Complete Database Schema
-- Database: PostgreSQL
-- Author: Antigravity Agent
-- Date: 2026-01-31

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE TENANT TABLES
-- ============================================================================

-- Businesses (Tenants)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE, -- For tenant detection (e.g., barberia.turnopro.com)
    custom_domain VARCHAR(255) UNIQUE,
    logo_url VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address TEXT,
    plan_type VARCHAR(20) DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(20) DEFAULT 'active', -- active, past_due, canceled
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    gamification_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

COMMENT ON TABLE businesses IS 'Core tenant table. Each row is a separate SaaS customer/business.';
CREATE INDEX idx_businesses_subdomain ON businesses(subdomain);

-- Business Users (Admin, Employees)
CREATE TABLE business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'employee', -- owner, admin, employee
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(business_id, email) -- Email unique per tenant (or globally? platform usually allows same email in diff businesses, but explicit simple approach here)
);

COMMENT ON TABLE business_users IS 'Staff members of a business. Includes owners and employees.';
CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_email ON business_users(email);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    points_reward INTEGER DEFAULT 0, -- Points awarded if gamification enabled
    category VARCHAR(50),
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_services_business_id ON services(business_id);

-- Employees (Profile details linked to user)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    bio TEXT,
    profile_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_employees_business_id ON employees(business_id);

-- Employee Services (Many-to-Many: Which employee performs which service)
CREATE TABLE employee_services (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, -- Denormalized for RLS ease
    PRIMARY KEY (employee_id, service_id)
);

CREATE INDEX idx_employee_services_business_id ON employee_services(business_id);

-- Employee Schedules
CREATE TABLE employee_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_schedules_business_id ON employee_schedules(business_id);
CREATE INDEX idx_employee_schedules_employee_day ON employee_schedules(employee_id, day_of_week);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255), -- Optional, for customer portal access
    birth_date DATE,
    notes TEXT,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES services(id) ON DELETE RESTRICT, -- Could be null if custom service
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed', -- pending, confirmed, in_progress, completed, cancelled, no_show
    notes TEXT,
    total_price DECIMAL(10, 2),
    confirmation_code VARCHAR(20),
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50) DEFAULT 'customer', -- customer, admin, employee
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_date_employee ON appointments(appointment_date, employee_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);

-- ============================================================================
-- 2. GAMIFICATION TABLES (Tenant Isolated)
-- ============================================================================

-- Gamification Config
CREATE TABLE gamification_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    points_per_visit INTEGER DEFAULT 100,
    punctuality_bonus INTEGER DEFAULT 20,
    referral_points INTEGER DEFAULT 200,
    review_points INTEGER DEFAULT 50,
    social_share_points INTEGER DEFAULT 75,
    birthday_bonus INTEGER DEFAULT 150,
    levels_config JSONB DEFAULT '[
        {"name": "Novato", "min_points": 0, "max_points": 499, "discount_percent": 0},
        {"name": "Regular", "min_points": 500, "max_points": 1499, "discount_percent": 5},
        {"name": "VIP Bronce", "min_points": 1500, "max_points": 2999, "discount_percent": 10},
        {"name": "VIP Plata", "min_points": 3000, "max_points": 5999, "discount_percent": 15},
        {"name": "VIP Oro", "min_points": 6000, "max_points": 999999, "discount_percent": 20}
    ]',
    points_expiry_days INTEGER DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id)
);

-- Customer Points Ledger (Current state)
CREATE TABLE customer_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    current_points INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0, -- Lifetime points
    current_level VARCHAR(50) DEFAULT 'Novato',
    current_streak_months INTEGER DEFAULT 0,
    last_streak_update DATE,
    last_points_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, customer_id)
);

CREATE INDEX idx_customer_points_business_id ON customer_points(business_id);

-- Points Transactions (History log)
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id), -- Optional link to appointment
    amount INTEGER NOT NULL, -- Can be negative for redemptions
    transaction_type VARCHAR(50) NOT NULL, -- earn_visit, earn_bonus, earn_referral, redeem_reward, expire
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_transactions_business ON points_transactions(business_id);
CREATE INDEX idx_points_transactions_customer ON points_transactions(customer_id);

-- Rewards Catalog
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    type VARCHAR(20) DEFAULT 'service', -- service, product, experience
    stock INTEGER, -- NULL = unlimited
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_business_id ON rewards(business_id);

-- Reward Redemptions
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    points_cost INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, redeemed, cancelled
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Challenges
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- punctuality_streak, referral_count, service_trial, ...
    target_value INTEGER NOT NULL, -- e.g. 3 visits
    reward_points INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Challenge Progress
CREATE TABLE customer_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, challenge_id)
);

-- Referrals
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES customers(id), -- Who invited
    referred_email VARCHAR(255), -- Email of the invited person (before they sign up)
    referred_customer_id UUID REFERENCES customers(id), -- Linked once they sign up
    referral_code_used VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- pending, signed_up, converted (first visit)
    points_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrals_business_id ON referrals(business_id);

-- Achievements / Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE, -- Nullable if system-wide badges
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_key VARCHAR(50), 
    criteria_type VARCHAR(50), -- total_visits, streak_months, etc.
    criteria_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, achievement_id)
);

-- End of Schema
