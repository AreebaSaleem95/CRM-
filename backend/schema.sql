-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Sales Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    client VARCHAR(150),
    amount NUMERIC,
    stage VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
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