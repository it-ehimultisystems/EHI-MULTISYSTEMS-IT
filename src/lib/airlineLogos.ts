import { supabase } from './supabase';

// Converts any airline name to the storage slug.
// "Green Africa Airways" → "green-africa-airways"
// "United Nigeria Airlines" → "united-nigeria-airlines"
// Strips parentheses, slashes, extra spaces.
export function airlineSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')   // remove non-alphanumeric except spaces
    .trim()
    .replace(/\s+/g, '-');          // spaces to hyphens
}

// Returns the public Supabase Storage URL for the airline logo PNG.
// No network request — URL is constructed directly from the slug.
// react-pdf and imageToEscPosRaster both handle 404 URLs gracefully (skip image).
export function airlineLogoUrl(airlineName: string): string | null {
  if (!airlineName) return null;
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    || localStorage.getItem('ehi_supabase_url')
    || '';
  if (!supabaseUrl) return null;
  const slug = airlineSlug(airlineName);
  return `${supabaseUrl}/storage/v1/object/public/airline-logos/${slug}.png`;
}

// Uploads a logo PNG for a given airline name to Supabase Storage.
// Returns the public URL on success, throws on failure.
export async function uploadAirlineLogo(airlineName: string, file: File): Promise<string> {
  const slug = airlineSlug(airlineName);
  const fileName = `${slug}.png`;

  // Convert to PNG if needed — we always store as PNG
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from('airline-logos')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/png',
      upsert: true,       // overwrite if exists (allows logo updates)
    });

  if (error) throw new Error('Upload failed: ' + error.message);

  return airlineLogoUrl(airlineName)!;
}

// Lists all airline logos currently in storage.
// Returns array of { name: string; slug: string; url: string } sorted alphabetically.
export async function listAirlineLogos(): Promise<Array<{ name: string; slug: string; url: string }>> {
  const { data, error } = await supabase.storage.from('airline-logos').list('', {
    limit: 200,
    sortBy: { column: 'name', order: 'asc' }
  });
  if (error || !data) return [];

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    || localStorage.getItem('ehi_supabase_url')
    || '';

  return data
    .filter(f => f.name.endsWith('.png'))
    .map(f => {
      const slug = f.name.replace('.png', '');
      // Convert slug back to a readable name: "arik-air" → "Arik Air"
      const name = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        name,
        slug,
        url: `${supabaseUrl}/storage/v1/object/public/airline-logos/${f.name}`
      };
    });
}

// Removes a logo from storage by airline name.
export async function deleteAirlineLogo(airlineName: string): Promise<void> {
  const slug = airlineSlug(airlineName);
  const { error } = await supabase.storage.from('airline-logos').remove([`${slug}.png`]);
  if (error) throw new Error('Delete failed: ' + error.message);
}
