import axios from "axios";
import tzlookup from "tz-lookup";

const API = process.env.OPENWEATHER_API_KEY;

export async function geocodeByZip(zip, country = "US") {
  if (!API) throw new Error("Missing OPENWEATHER_API_KEY");
  if (!zip) throw new Error("zip is required");

  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zip)},${country}&appid=${API}`;
  const { data } = await axios.get(url);

  const lat = data?.coord?.lat;
  const lon = data?.coord?.lon;
  if (lat == null || lon == null) throw new Error("Coordinates not found for zip");

  const timezone = tzlookup(lat, lon);
  return { latitude: lat, longitude: lon, timezone };
}
