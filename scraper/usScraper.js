const fs = require("fs");
const path = require("path");

const MOVIE_ID = "244612";
const RELEASE_DATES = ["2026-03-18", "2026-03-19"]; // timezone safe

const usMetros = [
    { city: "New York", lat: 40.7128, lng: -74.0060 },
    { city: "Newark", lat: 40.7357, lng: -74.1724 },
    { city: "Boston", lat: 42.3601, lng: -71.0589 },
    { city: "Philadelphia", lat: 39.9526, lng: -75.1652 },
    { city: "Washington DC", lat: 38.9072, lng: -77.0369 },
    { city: "Baltimore", lat: 39.2904, lng: -76.6122 },
  
    { city: "Atlanta", lat: 33.7490, lng: -84.3880 },
    { city: "Miami", lat: 25.7617, lng: -80.1918 },
    { city: "Orlando", lat: 28.5383, lng: -81.3792 },
    { city: "Charlotte", lat: 35.2271, lng: -80.8431 },
    { city: "Nashville", lat: 36.1627, lng: -86.7816 },
    { city: "Tampa", lat: 27.9506, lng: -82.4572 },
  
    { city: "Chicago", lat: 41.8781, lng: -87.6298 },
    { city: "Detroit", lat: 42.3314, lng: -83.0458 },
    { city: "Minneapolis", lat: 44.9778, lng: -93.2650 },
    { city: "Cleveland", lat: 41.4993, lng: -81.6944 },
    { city: "Columbus", lat: 39.9612, lng: -82.9988 },
    { city: "Indianapolis", lat: 39.7684, lng: -86.1581 },
    { city: "St. Louis", lat: 38.6270, lng: -90.1994 },
    { city: "Kansas City", lat: 39.0997, lng: -94.5786 },
  
    { city: "Dallas", lat: 32.7767, lng: -96.7970 },
    { city: "Houston", lat: 29.7604, lng: -95.3698 },
    { city: "Austin", lat: 30.2672, lng: -97.7431 },
    { city: "San Antonio", lat: 29.4241, lng: -98.4936 },
    { city: "Denver", lat: 39.7392, lng: -104.9903 },
    { city: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
  
    { city: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { city: "San Francisco", lat: 37.7749, lng: -122.4194 },
    { city: "San Diego", lat: 32.7157, lng: -117.1611 },
    { city: "Sacramento", lat: 38.5816, lng: -121.4944 },
    { city: "Seattle", lat: 47.6062, lng: -122.3321 },
    { city: "Portland", lat: 45.5152, lng: -122.6784 },
    { city: "Las Vegas", lat: 36.1699, lng: -115.1398 },
    { city: "Phoenix", lat: 33.4484, lng: -112.0740 },
  
    { city: "Salt Lake City", lat: 40.7608, lng: -111.8910 },
    { city: "Albuquerque", lat: 35.0844, lng: -106.6504 },
    { city: "Omaha", lat: 41.2565, lng: -95.9345 },
    { city: "Milwaukee", lat: 43.0389, lng: -87.9065 },
    { city: "Pittsburgh", lat: 40.4406, lng: -79.9959 },
    { city: "Richmond", lat: 37.5407, lng: -77.4360 },
    { city: "Fresno", lat: 36.7378, lng: -119.7871 },
    { city: "San Jose", lat: 37.3382, lng: -121.8863 },
    { city: "Fremont", lat: 37.5483, lng: -121.9886 },
    { city: "Sunnyvale", lat: 37.3688, lng: -122.0363 },
    { city: "Irving", lat: 32.8140, lng: -96.9489 },
    { city: "Edison", lat: 40.5187, lng: -74.4121 },
    { city: "Cary", lat: 35.7915, lng: -78.7811 },
    { city: "Jersey City", lat: 40.7178, lng: -74.0431 },
    { city: "Cupertino", lat: 37.3229, lng: -122.0322 }
  ];

async function checkCity(city) {
  for (const date of RELEASE_DATES) {
    const url = `https://www.fandango.com/napi/theaterShowtimeGroupings/${MOVIE_ID}/${date}?isdesktop=true&lat=${city.lat}&long=${city.lng}&isDesktopMOP=true`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.hasShowtimes === true) {
        return true;
      }
    } catch (err) {
      console.log(`Error checking ${city.city}:`, err.message);
    }
  }

  return false;
}

async function run() {
  console.log("Checking US cities...");

  const liveCities = [];

  for (const metro of usMetros) {
    const isLive = await checkCity(metro);

    if (isLive) {
      console.log(`✅ LIVE in ${metro.city}`);
      liveCities.push({
        city: metro.city,
        country: "USA",
        lat: metro.lat,
        lng: metro.lng
      });
    } else {
      console.log(`❌ Not live in ${metro.city}`);
    }
  }

  mergeAndSave(liveCities);
}

function mergeAndSave(newCities) {
  const filePath = path.join(__dirname, "..", "public", "bookingData.json");

  let existing = [];

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath);
    existing = JSON.parse(raw);
  }

  const merged = [...existing];

  for (const city of newCities) {
    const alreadyExists = merged.some(
      c => c.city === city.city && c.country === city.country
    );

    if (!alreadyExists) {
      merged.push(city);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));

  console.log("US merge complete.");
}

run();