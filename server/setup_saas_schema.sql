-- ==========================================
-- GH-SCORE PRO: SaaS Architecture Schema
-- ==========================================

-- 1. Tenants Table (The Core)
CREATE TABLE IF NOT EXISTS tenants (
    id CHAR(36) PRIMARY KEY, -- UUID
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'acme'.gh-score.com
    tax_id VARCHAR(50), -- NIT/RUT
    status ENUM('active', 'suspended', 'archived') DEFAULT 'active',
    config_json JSON, -- Branding: { primary_color: '#3a94cc', logo_url: '...' }
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Roles Table (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id CHAR(36) NULL, -- NULL = Global/System Role (Superadmin), NOT NULL = Custom Tenant Role
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted if TRUE
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_per_tenant (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Permissions Table (Granular Access)
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'vacancies.create', 'candidates.view_hidden'
    description VARCHAR(255),
    category VARCHAR(50) -- 'Vacancies', 'Users', 'Reports'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Role_Permissions (Linking Table)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Users Table (Unified Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    avatar_url VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email) -- Same email can exist in different tenants
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- Seeds: Initial Data Bootstrap
-- ==========================================

-- A. Create Default Tenant (DISCOL) (We will use a fixed UUID for migration simplicity)
INSERT IGNORE INTO tenants (id, name, subdomain, config_json) VALUES 
('11111111-1111-1111-1111-111111111111', 'DISCOL SAS', 'discol', '{"primary_color": "#3a94cc", "logo_url": "/logo_discol.jpg", "language": "es"}');

-- B. Create Base Permissions (System Wide)
INSERT IGNORE INTO permissions (slug, description, category) VALUES
-- Global
('tenant.manage', 'Manage Tenant settings', 'System'),
-- Vacancies
('vacancies.view_all', 'View all vacancies', 'Vacancies'),
('vacancies.view_assigned', 'View only assigned vacancies', 'Vacancies'),
('vacancies.create', 'Create new vacancies', 'Vacancies'),
('vacancies.edit', 'Edit vacancies', 'Vacancies'),
-- Candidates
('candidates.view', 'View candidates', 'Candidates'),
('candidates.manage', 'Edit/Move candidates', 'Candidates'),
-- Team
('users.manage', 'Manage enterprise users', 'Users');

-- C. Create Default System Roles
-- 1. SUPERADMIN (Global)
INSERT IGNORE INTO roles (tenant_id, name, description, is_system_role) VALUES 
(NULL, 'Superadmin', 'Platform Owner', TRUE); -- System Wide

-- 2. ADMIN (Tenant Level)
INSERT IGNORE INTO roles (tenant_id, name, description, is_system_role) VALUES 
('11111111-1111-1111-1111-111111111111', 'Admin', 'Empresa Admin', TRUE),
('11111111-1111-1111-1111-111111111111', 'Lider', 'Hiring Manager', TRUE),
('11111111-1111-1111-1111-111111111111', 'Reclutador', 'Recruiter', TRUE);

-- D. Assign Initial Permissions (Example mapping)
-- (We will script this properly in Node.js migration to ensure IDs match, 
-- but this SQL gives the structure)
