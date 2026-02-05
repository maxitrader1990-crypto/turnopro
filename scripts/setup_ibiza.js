
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is missing in backend/.env');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase connection from external
});

const BUSINESS_ID = 'a9baf9af-e526-4688-ae71-afbc98efd32d';

async function seed() {
    try {
        console.log('Connecting to Database...');
        await client.connect();

        console.log(`Configuring Business: ${BUSINESS_ID}`);

        // 1. Update Business Name
        await client.query(
            `UPDATE businesses SET name = $1, gamification_enabled = $2 WHERE id = $3`,
            ['Ibiza Estudio', true, BUSINESS_ID]
        );
        console.log('Business updated to Ibiza Estudio (Gamification ON)');

        // 2. Create Services
        const servicesData = [
            { name: 'Corte Degradado Premium', duration_minutes: 45, price: 15000, points_reward: 100, category: 'Hair', description: 'Fade perfecto con navaja y lavado.' },
            { name: 'Barba & Toalla Caliente', duration_minutes: 30, price: 8000, points_reward: 50, category: 'Beard', description: 'Perfilado de barba con ritual de toalla caliente y aceites.' },
            { name: 'Color & Mechas', duration_minutes: 90, price: 35000, points_reward: 250, category: 'Color', description: 'Cambio de look total.' },
            { name: 'Corte Infantil', duration_minutes: 30, price: 10000, points_reward: 80, category: 'Hair', description: 'Corte para niños con paciencia y estilo.' },
        ];

        for (const s of servicesData) {
            // Check if exists handling? optional. Just insert.
            const res = await client.query(
                `INSERT INTO services (business_id, name, description, duration_minutes, price, points_reward, category)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [BUSINESS_ID, s.name, s.description, s.duration_minutes, s.price, s.points_reward, s.category]
            );
            console.log(`Created service: ${s.name} (ID: ${res.rows[0].id})`);
        }

        // 3. Create Employees
        const employeesData = [
            { name: 'Nico "The Blade"', bio: 'Especialista en navaja y fades.', role: 'Master Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/cd823793-2747-4934-8b65-9856a93910c2.png' },
            { name: 'Leo "Colorist"', bio: 'Experto en colorimetría y cortes modernos.', role: 'Stylist', photo: 'https://cdn.usegalileo.ai/sdxl10/84102b70-128a-40a2-995c-91e845116790.png' },
            { name: 'Santi "Old School"', bio: 'Barbería clásica y afeitado tradicional.', role: 'Senior Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/e303775d-3893-4158-b769-637dc418295b.png' },
            { name: 'Mateo "Rookie"', bio: 'Cortes rápidos y buena onda.', role: 'Junior Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/68dfd65f-6a67-4638-89c0-6d8479357410.png' }
        ];

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('ibiza123', salt); // Default password for everyone

        for (const [i, emp] of employeesData.entries()) {
            const email = `barber${i + 1}@ibiza.com`;

            // Check user
            let userId;
            const userCheck = await client.query(`SELECT id FROM business_users WHERE email = $1`, [email]);

            if (userCheck.rows.length > 0) {
                userId = userCheck.rows[0].id;
            } else {
                const newUser = await client.query(
                    `INSERT INTO business_users (business_id, full_name, email, password_hash, role, created_at)
                     VALUES ($1, $2, $3, $4, $5, NOW())
                     RETURNING id`,
                    [BUSINESS_ID, emp.name, email, hash, 'employee']
                );
                userId = newUser.rows[0].id;
            }

            // Upsert Employee Profile
            // Postgres NO CONFLICT update requires unique constraint. 
            // We assume user_id is unique or we just insert if not exists.

            // Try Insert
            // We need to handle photo field if column exists.
            // WARNING: I should verify if 'photo' column exists in 'employees'. I assumed so in previous step task.
            // If it doesn't, this will fail. user said "que se se pueda cargar foto". I modified API logic, but did I ADD THE COLUMN? 
            // NO. I did NOT run a migration.
            // I need to add the column first if it's missing.

            // Proactive Migration check
            try {
                await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo TEXT`);
            } catch (e) {
                console.log('Photo column might already exist or error adding it:', e.message);
            }

            await client.query(
                `INSERT INTO employees (business_id, user_id, title, bio, photo, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id) DO UPDATE SET title = $3, bio = $4, photo = $5`,
                [BUSINESS_ID, userId, emp.role, emp.bio, emp.photo, true]
            );
            console.log(`Created/Updated employee: ${emp.name}`);
        }

        console.log('Seed Complete! Ibiza Estudio is ready.');

    } catch (err) {
        console.error('Seed Error:', err);
    } finally {
        await client.end();
    }
}

seed();
