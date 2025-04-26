import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Path to your .env.local file
    const envPath = path.join(process.cwd(), '.env.local');

    // Read current .env.local
    const envFile = fs.readFileSync(envPath, 'utf-8');

    // Modify the content with new values
    let updatedEnvFile = envFile;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*`, 'm');
      updatedEnvFile = updatedEnvFile.replace(regex, `${key}=${value}`);
    });

    // Save the updated .env.local file
    fs.writeFileSync(envPath, updatedEnvFile);

    return new Response('Settings updated', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error updating settings', { status: 500 });
  }
}
