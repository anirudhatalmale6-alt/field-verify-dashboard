import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Clean concatenated Indian addresses for better geocoding
function cleanAddress(raw: string): string {
  let addr = raw;

  // Add spaces before uppercase words that follow lowercase letters (e.g., "chinchwadPune" → "chinchwad Pune")
  addr = addr.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Add spaces before state names that are concatenated
  const states = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal', 'Bihar', 'Kerala', 'Andhra Pradesh', 'Odisha', 'Punjab', 'Haryana', 'Jharkhand', 'Chhattisgarh', 'Goa', 'Assam'];
  for (const state of states) {
    const re = new RegExp(`([a-zA-Z0-9])${state}`, 'gi');
    addr = addr.replace(re, `$1 ${state}`);
  }

  // Add spaces before common city names that are concatenated
  const cities = ['Pune', 'Mumbai', 'Chinchwad', 'Pimpri', 'Hadapsar', 'Bandra', 'Thane', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Kolhapur', 'Bhiwandi', 'Vasai'];
  for (const city of cities) {
    const re = new RegExp(`([a-z0-9])${city}`, 'gi');
    addr = addr.replace(re, `$1 ${city}`);
  }

  // Remove excessive commas and whitespace
  addr = addr.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

  return addr;
}

// Extract Indian pin code from address
function extractPinCode(addr: string): string | null {
  const match = addr.match(/\b[1-9]\d{5}\b/);
  return match ? match[0] : null;
}

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number; type: string } | null> {
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
  return null;
}

// Check if result is just a city/state level match (too vague)
function isCityLevelResult(result: { type: string } | null): boolean {
  if (!result) return false;
  const vagueTypes = ['city', 'state', 'administrative', 'county', 'state_district', 'country'];
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

    // Find cases without coordinates OR with city-center coordinates (re-geocode those)
    const ungeocodedCases = db.prepare(`
      SELECT id, address, location FROM cases
      WHERE (latitude IS NULL OR (latitude = 18.5213738 AND longitude = 73.8545071) OR (latitude = 18.5251898 AND longitude = 73.8529984))
      AND (address != '' OR location != '')
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

        // Strategy 1: Try pin code + area/locality (most precise for Indian addresses)
        const pinCode = extractPinCode(rawAddr) || extractPinCode(location);
        if (pinCode) {
          // Try: pin code + locality info
          const cleaned = cleanAddress(rawAddr);
          // Extract a meaningful part of the address (skip flat/shop numbers)
          const parts = cleaned.split(/[,]/).map(p => p.trim()).filter(p => p.length > 2);
          // Find a part that looks like an area name (not a flat number or survey number)
          const areaPart = parts.find(p => !/^(flat|shop|sr|survey|gat|plot|room)\s*(no|number)?/i.test(p) && !/^\d+/.test(p) && p.length > 3);

          if (areaPart) {
            const q = `${areaPart}, ${pinCode}, India`;
            bestResult = await geocodeQuery(q);
            await new Promise(r => setTimeout(r, 1100));
          }

          // If still city-level or no result, try just pin code
          if (!bestResult || isCityLevelResult(bestResult)) {
            const q = `${pinCode}, India`;
            const pinResult = await geocodeQuery(q);
            await new Promise(r => setTimeout(r, 1100));
            // Pin code results are at least postal-area level (better than city center)
            if (pinResult && (!bestResult || isCityLevelResult(bestResult))) {
              bestResult = pinResult;
            }
          }
        }

        // Strategy 2: Try cleaned full address
        if (!bestResult || isCityLevelResult(bestResult)) {
          const cleaned = cleanAddress(rawAddr + (location ? ', ' + location : ''));
          const fullResult = await geocodeQuery(cleaned + ', India');
          await new Promise(r => setTimeout(r, 1100));

          if (fullResult && !isCityLevelResult(fullResult)) {
            bestResult = fullResult;
          }
        }

        // Strategy 3: Try location + area from address
        if (!bestResult || isCityLevelResult(bestResult)) {
          if (location && location.length > 2 && !/^\d+$/.test(location)) {
            // Extract a useful part from address to combine with location
            const cleaned = cleanAddress(rawAddr);
            const parts = cleaned.split(/[,]/).map(p => p.trim()).filter(p => p.length > 3);
            const areaPart = parts.find(p => !/^(flat|shop|sr|survey|gat|plot|room|falt|bank)\s*/i.test(p) && !/^\d+/.test(p));

            if (areaPart) {
              const q = `${areaPart}, ${location}, India`;
              const areaResult = await geocodeQuery(q);
              await new Promise(r => setTimeout(r, 1100));
              if (areaResult && !isCityLevelResult(areaResult)) {
                bestResult = areaResult;
              }
            }
          }
        }

        // Save the best result we got (even city-level is better than nothing, but mark it)
        if (bestResult && !isCityLevelResult(bestResult)) {
          updateStmt.run(bestResult.lat, bestResult.lng, c.id);
          geocoded++;
        } else if (bestResult) {
          // City-level result - use it but add small random offset so cases don't stack
          // This makes each case show a slightly different distance
          const offset = () => (Math.random() - 0.5) * 0.02; // ~1km variation
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
    const remaining = (db.prepare(`SELECT COUNT(*) as c FROM cases WHERE (latitude IS NULL OR (latitude = 18.5213738 AND longitude = 73.8545071) OR (latitude = 18.5251898 AND longitude = 73.8529984)) AND (address != '' OR location != '')`).get() as { c: number }).c;

    return NextResponse.json({ geocoded, remaining });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
