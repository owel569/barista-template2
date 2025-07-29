-- Database schema for PostgreSQL
DROP TABLE IF EXISTS menu_item_images CASCADE;
DROP TABLE IF EXISTS reservation_items CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employe',
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create activity logs table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create menu categories table
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Create menu items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category_id INTEGER NOT NULL,
    image_url TEXT,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tables table
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    position_x REAL,
    position_y REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    points INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    table_id INTEGER NOT NULL,
    reservation_date TIMESTAMP NOT NULL,
    party_size INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reservation items table
CREATE TABLE reservation_items (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT
);

-- Create menu item images table
CREATE TABLE menu_item_images (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    upload_method TEXT NOT NULL DEFAULT 'url',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX users_username_idx ON users(username);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity);
CREATE INDEX activity_logs_timestamp_idx ON activity_logs(timestamp);
CREATE INDEX permissions_user_id_idx ON permissions(user_id);
CREATE INDEX permissions_module_idx ON permissions(module);
CREATE INDEX menu_categories_slug_idx ON menu_categories(slug);
CREATE INDEX menu_categories_order_idx ON menu_categories(display_order);
CREATE INDEX menu_items_category_id_idx ON menu_items(category_id);
CREATE INDEX menu_items_available_idx ON menu_items(available);
CREATE INDEX tables_number_idx ON tables(number);
CREATE INDEX tables_status_idx ON tables(status);
CREATE INDEX customers_email_idx ON customers(email);
CREATE INDEX reservations_table_id_idx ON reservations(table_id);
CREATE INDEX reservations_date_idx ON reservations(reservation_date);
CREATE INDEX reservations_status_idx ON reservations(status);
CREATE INDEX reservation_items_reservation_id_idx ON reservation_items(reservation_id);
CREATE INDEX reservation_items_menu_item_id_idx ON reservation_items(menu_item_id);
CREATE INDEX menu_item_images_menu_item_id_idx ON menu_item_images(menu_item_id);
CREATE INDEX menu_item_images_is_primary_idx ON menu_item_images(is_primary);

-- Insert initial data
INSERT INTO users (username, password, role, first_name, last_name, email) VALUES
('admin', '$2b$10$rGNe5PcTVEJPNDwGfyAJTu0PmYTdLRrJKzVnzVdFnJ1CsKCzRIZFC', 'directeur', 'Admin', 'User', 'admin@barista.com');

INSERT INTO menu_categories (name, description, slug, display_order) VALUES
('Cafés', 'Nos cafés artisanaux', 'cafes', 1),
('Thés', 'Sélection de thés premium', 'thes', 2),
('Pâtisseries', 'Pâtisseries fraîches du jour', 'patisseries', 3),
('Snacks', 'Collations et en-cas', 'snacks', 4);

INSERT INTO menu_items (name, description, price, category_id, image_url, available) VALUES
('Espresso Classique', 'Café espresso italien traditionnel', 2.50, 1, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Cappuccino', 'Espresso avec mousse de lait onctueuse', 3.50, 1, 'https://images.pexels.com/photos/4109766/pexels-photo-4109766.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Latte Vanille', 'Café au lait avec sirop de vanille', 4.00, 1, 'https://images.pexels.com/photos/1030894/pexels-photo-1030894.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Thé Earl Grey', 'Thé noir bergamote premium', 3.00, 2, 'https://images.pexels.com/photos/734983/pexels-photo-734983.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Croissant Beurre', 'Croissant pur beurre artisanal', 2.20, 3, 'https://images.pexels.com/photos/1756464/pexels-photo-1756464.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Muffin Chocolat', 'Muffin aux pépites de chocolat', 3.80, 3, 'https://images.pexels.com/photos/1620593/pexels-photo-1620593.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Sandwich Club', 'Sandwich pain complet, poulet, avocat', 8.50, 4, 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=400', true),
('Salade César', 'Salade fraîche avec parmesan et croûtons', 9.00, 4, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400', true);

INSERT INTO tables (number, capacity, status, position_x, position_y) VALUES
(1, 2, 'available', 100, 100),
(2, 4, 'available', 200, 100),
(3, 6, 'available', 300, 100),
(4, 2, 'available', 100, 200);

INSERT INTO menu_item_images (menu_item_id, image_url, alt_text, is_primary, upload_method) VALUES
(1, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400', 'Espresso Classique', true, 'pexels'),
(2, 'https://images.pexels.com/photos/4109766/pexels-photo-4109766.jpeg?auto=compress&cs=tinysrgb&w=400', 'Cappuccino', true, 'pexels'),
(3, 'https://images.pexels.com/photos/1030894/pexels-photo-1030894.jpeg?auto=compress&cs=tinysrgb&w=400', 'Latte Vanille', true, 'pexels'),
(4, 'https://images.pexels.com/photos/734983/pexels-photo-734983.jpeg?auto=compress&cs=tinysrgb&w=400', 'Thé Earl Grey', true, 'pexels'),
(5, 'https://images.pexels.com/photos/1756464/pexels-photo-1756464.jpeg?auto=compress&cs=tinysrgb&w=400', 'Croissant Beurre', true, 'pexels'),
(6, 'https://images.pexels.com/photos/1620593/pexels-photo-1620593.jpeg?auto=compress&cs=tinysrgb&w=400', 'Muffin Chocolat', true, 'pexels'),
(7, 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=400', 'Sandwich Club', true, 'pexels'),
(8, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400', 'Salade César', true, 'pexels');