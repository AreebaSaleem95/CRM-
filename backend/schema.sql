-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Sales Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Deals table (Updated with company, contact_person, value, priority, closing_date)
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    value NUMERIC DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Lead In',
    priority VARCHAR(50) DEFAULT 'Medium',
    closing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    related_deal VARCHAR(150),
    category VARCHAR(50) DEFAULT 'Follow-up',
    priority VARCHAR(50) DEFAULT 'Medium',
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. In-App Notifications table (New Real-time Alerts Table)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50) DEFAULT 'deal',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    link VARCHAR(100) DEFAULT '/deals',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);