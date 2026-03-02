const fs = require("fs");
const path = require("path");

const MOVIE_ID = "244612";
const RELEASE_DATES = ["2026-03-18", "2026-03-19"]; // timezone safe

const usMetros = [

  // NEW YORK / NJ
  { city: "New York", lat: 40.7128, lng: -74.0060 },
  { city: "Newark", lat: 40.7357, lng: -74.1724 },
  { city: "Jersey City", lat: 40.7178, lng: -74.0431 },
  { city: "Edison", lat: 40.5187, lng: -74.4121 },
  { city: "Princeton", lat: 40.3573, lng: -74.6672 },
  { city: "Parsippany", lat: 40.8573, lng: -74.4259 },
  { city: "Stamford", lat: 41.0534, lng: -73.5387 },

  // TEXAS
  { city: "Dallas", lat: 32.7767, lng: -96.7970 },
  { city: "Irving", lat: 32.8140, lng: -96.9489 },
  { city: "Plano", lat: 33.0198, lng: -96.6989 },
  { city: "Frisco", lat: 33.1507, lng: -96.8236 },
  { city: "Houston", lat: 29.7604, lng: -95.3698 },
  { city: "Sugar Land", lat: 29.6197, lng: -95.6349 },
  { city: "Austin", lat: 30.2672, lng: -97.7431 },
  { city: "San Antonio", lat: 29.4241, lng: -98.4936 },

  // CALIFORNIA - BAY AREA
  { city: "San Jose", lat: 37.3382, lng: -121.8863 },
  { city: "Fremont", lat: 37.5483, lng: -121.9886 },
  { city: "Sunnyvale", lat: 37.3688, lng: -122.0363 },
  { city: "Cupertino", lat: 37.3229, lng: -122.0322 },
  { city: "Milpitas", lat: 37.4323, lng: -121.8996 },
  { city: "Santa Clara", lat: 37.3541, lng: -121.9552 },
  { city: "Mountain View", lat: 37.3861, lng: -122.0839 },

  // CALIFORNIA - SOUTH
  { city: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { city: "Irvine", lat: 33.6846, lng: -117.8265 },
  { city: "Anaheim", lat: 33.8366, lng: -117.9143 },
  { city: "San Diego", lat: 32.7157, lng: -117.1611 },
  { city: "Sacramento", lat: 38.5816, lng: -121.4944 },
  { city: "Fresno", lat: 36.7378, lng: -119.7871 },

  // ILLINOIS / MIDWEST
  { city: "Chicago", lat: 41.8781, lng: -87.6298 },
  { city: "Naperville", lat: 41.7508, lng: -88.1535 },
  { city: "Schaumburg", lat: 42.0334, lng: -88.0834 },
  { city: "Detroit", lat: 42.3314, lng: -83.0458 },
  { city: "Novi", lat: 42.4806, lng: -83.4755 },
  { city: "Columbus", lat: 39.9612, lng: -82.9988 },
  { city: "Indianapolis", lat: 39.7684, lng: -86.1581 },
  { city: "Kansas City", lat: 39.0997, lng: -94.5786 },

  // ATLANTA REGION
  { city: "Atlanta", lat: 33.7490, lng: -84.3880 },
  { city: "Alpharetta", lat: 34.0754, lng: -84.2941 },
  { city: "Johns Creek", lat: 34.0289, lng: -84.1986 },

  // NORTH CAROLINA
  { city: "Charlotte", lat: 35.2271, lng: -80.8431 },
  { city: "Raleigh", lat: 35.7796, lng: -78.6382 },
  { city: "Cary", lat: 35.7915, lng: -78.7811 },

  // FLORIDA
  { city: "Miami", lat: 25.7617, lng: -80.1918 },
  { city: "Orlando", lat: 28.5383, lng: -81.3792 },
  { city: "Tampa", lat: 27.9506, lng: -82.4572 },

  // WEST / OTHER
  { city: "Seattle", lat: 47.6062, lng: -122.3321 },
  { city: "Phoenix", lat: 33.4484, lng: -112.0740 },
  { city: "Denver", lat: 39.7392, lng: -104.9903 },
  { city: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
  { city: "Washington DC", lat: 38.9072, lng: -77.0369 },
  { city: "Baltimore", lat: 39.2904, lng: -76.6122 },
  { city: "Boston", lat: 42.3601, lng: -71.0589 },
  { city: "Richmond", lat: 37.5407, lng: -77.4360 }

];

async function checkCity(city) {
  for (const date of RELEASE_DATES) {
    const url = `https://www.fandango.com/napi/theaterShowtimeGroupings/${MOVIE_ID}/${date}?isdesktop=true&lat=${city.lat}&long=${city.lng}&isDesktopMOP=true`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.fandango.com/"
        }
      });
      const data = await res.json();
    /*
      if (data.hasShowtimes === true) {
        return true;
      }

      */

      if (data.hasShowtimes === true) {
        const theaters = data.theaterShowtimes?.theaters || [];
      
        const validTheater = theaters.some(t => t.distance <= 1.0);
      
        if (validTheater) {
          return true;
        }
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