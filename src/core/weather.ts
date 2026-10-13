import type { Weather } from './types';

export function parseOpenMeteo(json: any): Weather {
  const t = json?.current?.temperature_2m;
  if (typeof t !== 'number') throw new Error('Weather response had no temperature');
  const p = json?.daily?.precipitation_probability_max?.[0];
  return { tempC: Math.round(t), raining: typeof p === 'number' && p > 50 };
}

/** Open-Meteo needs no key. Used only when the user taps "Use where I am". */
export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m&daily=precipitation_probability_max&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather lookup failed (${res.status})`);
  return parseOpenMeteo(await res.json());
}
