
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') }); // Adjust path if needed

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// NOTE: Ideally use SERVICE_ROLE_KEY to bypass RLS if running locally as admin, but user might only have anon.
// If RLS blocks us, we might need to sign in as the business owner first.
// Let's try ANON first, but we might need to actually simulate the login flow or just use SERVICE_ROLE if available.

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESS_ID = 'a9baf9af-e526-4688-ae71-afbc98efd32d';

async function seed() {
    console.log(`Configuring Business: ${BUSINESS_ID}`);

    // 1. Update Business Name
    const { error: busError } = await supabase
        .from('businesses')
        .update({
            name: 'Ibiza Estudio',
            gamification_enabled: true
        })
        .eq('id', BUSINESS_ID);

    if (busError) console.error('Error updating business:', busError);
    else console.log('Business updated to Ibiza Estudio (Gamification ON)');

    // 2. Create Services (Explosive Config)
    const servicesData = [
        { name: 'Corte Degradado Premium', duration_minutes: 45, price: 15000, points_reward: 100, category: 'Hair', description: 'Fade perfecto con navaja y lavado.' },
        { name: 'Barba & Toalla Caliente', duration_minutes: 30, price: 8000, points_reward: 50, category: 'Beard', description: 'Perfilado de barba con ritual de toalla caliente y aceites.' },
        { name: 'Color & Mechas', duration_minutes: 90, price: 35000, points_reward: 250, category: 'Color', description: 'Cambio de look total.' },
        { name: 'Corte Infantil', duration_minutes: 30, price: 10000, points_reward: 80, category: 'Hair', description: 'Corte para niños con paciencia y estilo.' },
    ];

    const createdServices = [];
    for (const s of servicesData) {
        const { data, error } = await supabase
            .from('services')
            .insert({ ...s, business_id: BUSINESS_ID })
            .select('id')
            .single();
        if (error) console.error(`Error creating service ${s.name}:`, error.message);
        else {
            console.log(`Created service: ${s.name}`);
            createdServices.push(data.id);
        }
    }

    // 3. Create Employees (4 Barbers)
    const employeesData = [
        { name: 'Nico "The Blade"', bio: 'Especialista en navaja y fades.', role: 'Master Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/cd823793-2747-4934-8b65-9856a93910c2.png' }, // Placeholder AI Gen
        { name: 'Leo "Colorist"', bio: 'Experto en colorimetría y cortes modernos.', role: 'Stylist', photo: 'https://cdn.usegalileo.ai/sdxl10/84102b70-128a-40a2-995c-91e845116790.png' },
        { name: 'Santi "Old School"', bio: 'Barbería clásica y afeitado tradicional.', role: 'Senior Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/e303775d-3893-4158-b769-637dc418295b.png' },
        { name: 'Mateo "Rookie"', bio: 'Cortes rápidos y buena onda.', role: 'Junior Barber', photo: 'https://cdn.usegalileo.ai/sdxl10/68dfd65f-6a67-4638-89c0-6d8479357410.png' }
    ];

    // Note: Creating employees usually requires creating a USER first in `business_users`.
    // Since we don't have their emails/passwords, we'll generate headers.

    for (const [i, emp] of employeesData.entries()) {
        const email = `barber${i + 1}@ibiza.com`;

        // Check if user exists first to allow re-running
        const { data: existingUser } = await supabase.from('business_users').select('id').eq('email', email).maybeSingle();
        let userId = existingUser?.id;

        if (!userId) {
            // Create User (We can't hash password easily here without bcrypt, but we can try just inserting dummy hash or verify if trigger handles it? No trigger. We need to hash.)
            // Actually, for this script to work without `bcrypt` dep issues if not installed in root, we assume `backend` `node_modules` has it.
            // But wait, we are running this with `node`. 
            // Let's just create the entry in `employees` directly if `user_id` is foreign key?
            // `user_id` IS required in `employees`.
            // So we MUST create `business_users`.

            const { data: user, error: uErr } = await supabase.from('business_users').insert({
                business_id: BUSINESS_ID,
                full_name: emp.name,
                email: email,
                password_hash: '$2b$10$EpOd.4g6S0d.4g6S0d.4g6S0d.4g6S0d.4g6S0d.4g6S0d.4g6S0', // Dummy hash
                role: 'employee'
            }).select('id').single();

            if (uErr) {
                console.error(`Failed to create user ${emp.name}`, uErr);
                continue;
            }
            userId = user.id;
        }

        // Create Employee Profile
        const { error: eErr } = await supabase.from('employees').insert({
            business_id: BUSINESS_ID,
            user_id: userId,
            title: emp.role,
            bio: emp.bio,
            photo: emp.photo,
            is_active: true
        });

        if (eErr) console.error(`Failed to create employee profile ${emp.name}`, eErr);
        else console.log(`Created employee: ${emp.name}`);
    }

    console.log('Seed Complete! Ibiza Estudio is ready.');
}

seed();
