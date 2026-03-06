import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Clean concatenated Indian addresses for better geocoding
function cleanAddress(raw: string): string {
  let addr = raw;

  // Add spaces before/after 6-digit pin codes concatenated to text
  addr = addr.replace(/([a-zA-Z])(\d{6})/g, '$1 $2');
  addr = addr.replace(/(\d{6})([a-zA-Z])/g, '$1 $2');

  // Add spaces before uppercase words that follow lowercase letters
  addr = addr.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Add spaces before state names that are concatenated
  const states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal', 'Bihar', 'Kerala', 'Andhra Pradesh', 'Odisha', 'Punjab', 'Haryana', 'Jharkhand', 'Chhattisgarh', 'Goa', 'Assam'];
  for (const state of states) {
    const re = new RegExp(`([a-zA-Z0-9])${state}`, 'gi');
    addr = addr.replace(re, `$1 ${state}`);
  }

  // Add spaces before common city/area names that are concatenated
  const cities = ['Pune', 'Mumbai', 'Chinchwad', 'Pimpri', 'Hadapsar', 'Bandra', 'Thane', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Kolhapur', 'Bhiwandi', 'Vasai', 'Shirur', 'Alandi', 'Kalbhor', 'Manjari', 'Lonavala', 'Khandala', 'Balewadi', 'Hinjewadi', 'Wakad', 'Baner', 'Kothrud', 'Bibwewadi', 'Erandwane', 'Dhankawadi', 'Kondhwa', 'Undri', 'Katraj', 'Warje'];
  for (const city of cities) {
    const re = new RegExp(`([a-z0-9])${city}`, 'gi');
    addr = addr.replace(re, `$1 ${city}`);
  }

  addr = addr.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  return addr;
}

// Extract Indian pin code from address
function extractPinCode(addr: string): string | null {
  const match1 = addr.match(/\b[1-9]\d{5}\b/);
  if (match1) return match1[0];
  const match2 = addr.match(/[a-zA-Z]([1-9]\d{5})/);
  if (match2) return match2[1];
  return null;
}

// Extract meaningful area/locality parts from address
function extractAreaNames(addr: string): string[] {
  const cleaned = cleanAddress(addr);
  const parts = cleaned.split(/[,]/).map(p => p.trim()).filter(p => p.length > 3);
  return parts.filter(p => !/^(flat|shop|sr|survey|gat|plot|room|falt|bank|s\.?\s*no|no\.|floor|wing|bldg|building)\s*/i.test(p) && !/^\d+/.test(p));
}

// Use Photon (Komoot's OSM geocoder) - better rate limits than Nominatim
async function geocodeQuery(query: string): Promise<{ lat: number; lng: number; type: string } | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
    );
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const f = data.features[0];
      const [lng, lat] = f.geometry.coordinates;
      const type = f.properties.type || f.properties.osm_value || 'unknown';
      return { lat, lng, type };
    }
  } catch {
    // Photon failed, try Nominatim as fallback
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'KOSPL-FieldVerify/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          type: data[0].type || data[0].class || 'unknown',
        };
      }
    } catch { /* both failed */ }
  }
  return null;
}

// Check if result is just a city/state level match (too vague)
function isCityLevelResult(result: { type: string } | null): boolean {
  if (!result) return false;
  const vagueTypes = ['city', 'state', 'administrative', 'county', 'state_district', 'country', 'region'];
  return vagueTypes.includes(result.type);
}

// POST /api/geocode — batch geocode cases that don't have coordinates yet
// Called automatically when executive opens their cases list
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Find cases without coordinates
    const ungeocodedCases = db.prepare(`
      SELECT id, address, location FROM cases
      WHERE latitude IS NULL AND (address != '' OR location != '')
      ORDER BY imported_at DESC
      LIMIT 5
    `).all() as { id: string; address: string; location: string }[];

    if (ungeocodedCases.length === 0) {
      return NextResponse.json({ geocoded: 0, remaining: 0 });
    }

    const updateStmt = db.prepare('UPDATE cases SET latitude = ?, longitude = ? WHERE id = ?');
    const markFailed = db.prepare('UPDATE cases SET latitude = 0, longitude = 0 WHERE id = ?');

    let geocoded = 0;

    for (const c of ungeocodedCases) {
      const rawAddr = (c.address || '').trim();
      const location = (c.location || '').trim();

      if (!rawAddr && !location) {
        markFailed.run(c.id);
        continue;
      }

      try {
        let bestResult: { lat: number; lng: number; type: string } | null = null;
        const pinCode = extractPinCode(rawAddr) || extractPinCode(location);
        const areas = extractAreaNames(rawAddr);

        // Strategy 1: Try area + pin code
        if (pinCode && areas.length > 0) {
          for (const area of areas.slice(0, 2)) {
            bestResult = await geocodeQuery(`${area}, ${pinCode}, India`);
            await new Promise(r => setTimeout(r, 500));
            if (bestResult && !isCityLevelResult(bestResult)) break;
          }
        }

        // Strategy 2: Try pin code alone
        if ((!bestResult || isCityLevelResult(bestResult)) && pinCode) {
          const pinResult = await geocodeQuery(`${pinCode}, India`);
          await new Promise(r => setTimeout(r, 500));
          if (pinResult && (!bestResult || isCityLevelResult(bestResult))) {
            bestResult = pinResult;
          }
        }

        // Strategy 3: Try cleaned full address (shortened)
        if (!bestResult || isCityLevelResult(bestResult)) {
          const cleaned = cleanAddress(rawAddr + (location ? ', ' + location : ''));
          const shortened = cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
          const fullResult = await geocodeQuery(shortened + ', India');
          await new Promise(r => setTimeout(r, 500));
          if (fullResult && !isCityLevelResult(fullResult)) {
            bestResult = fullResult;
          }
        }

        // Strategy 4: Try area name + location (city)
        if ((!bestResult || isCityLevelResult(bestResult)) && location && !/^\d+$/.test(location)) {
          for (const area of areas.slice(0, 2)) {
            const areaResult = await geocodeQuery(`${area}, ${location}, India`);
            await new Promise(r => setTimeout(r, 500));
            if (areaResult && !isCityLevelResult(areaResult)) {
              bestResult = areaResult;
              break;
            }
          }
        }

        // Strategy 5: Just try location
        if ((!bestResult || isCityLevelResult(bestResult)) && location && !/^\d+$/.test(location)) {
          const locResult = await geocodeQuery(`${location}, Maharashtra, India`);
          await new Promise(r => setTimeout(r, 500));
          if (locResult) bestResult = locResult;
        }

        // Save result
        if (bestResult && !isCityLevelResult(bestResult)) {
          updateStmt.run(bestResult.lat, bestResult.lng, c.id);
          geocoded++;
        } else if (bestResult) {
          // City-level with offset to avoid stacking
          const offset = () => (Math.random() - 0.5) * 0.03;
          updateStmt.run(bestResult.lat + offset(), bestResult.lng + offset(), c.id);
          geocoded++;
        } else {
          markFailed.run(c.id);
        }
      } catch {
        markFailed.run(c.id);
      }
    }

    // Count remaining
    const remaining = (db.prepare('SELECT COUNT(*) as c FROM cases WHERE latitude IS NULL AND (address != \'\' OR location != \'\')').get() as { c: number }).c;

    return NextResponse.json({ geocoded, remaining });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
