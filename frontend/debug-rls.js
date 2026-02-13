
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicAccess() {
    console.log('Checking access to "businesses" table...');
    const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

    if (businessError) {
        console.error('Error fetching businesses:', businessError);
    } else {
        console.log('Businesses fetched:', businesses?.length);
        if (businesses?.length === 0) {
            console.log('WARNING: Access successful but returned 0 rows. RLS might be hiding rows, or table is empty.');
        } else {
            console.log('SUCCESS: Public access to businesses works.');
            console.log('Sample business:', businesses[0]?.name);
        }
    }

    console.log('\nChecking access to "services" table...');
    const { data: services, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .limit(1);

    if (serviceError) {
        console.error('Error fetching services:', serviceError);
    } else {
        console.log('Services fetched:', services?.length);
    }
}

checkPublicAccess();
