const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");


async function run() {
  const browser = await chromium.launch({
    headless: false, // IMPORTANT: turn off headless
    args: ["--start-maximized"]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: null
  });

  const page = await context.newPage();

  // 🔵 Load existing live cities from bookingData.json
const bookingPath = path.join(__dirname, "..", "public", "bookingData.json");

let existingLiveCities = [];

if (fs.existsSync(bookingPath)) {
  const rawBooking = fs.readFileSync(bookingPath);
  existingLiveCities = JSON.parse(rawBooking);
}

const existingLiveSet = new Set(
  existingLiveCities.map(city => city.city)
);


console.log("Already live cities loaded:", existingLiveSet.size);

  try {
    console.log("Opening BMS homepage first...");

    // First visit homepage to get cookies
    await page.goto("https://in.bookmyshow.com/", {
  waitUntil: "domcontentloaded"
});

    console.log("Now opening regions API...");

    await page.goto(
        "https://in.bookmyshow.com/api/explore/v1/discover/regions",
        { waitUntil: "domcontentloaded" }
      );

    const bodyText = await page.evaluate(() => document.body.innerText);

    const data = JSON.parse(bodyText);

    const topCities = data.BookMyShow.TopCities;
const otherCities = data.BookMyShow.OtherCities;

const cities = [...topCities, ...otherCities];

// 🔵 Group cities by state
const stateCityMap = {};

for (const city of cities) {
  const state = city.StateName;

  if (!stateCityMap[state]) {
    stateCityMap[state] = [];
  }

  stateCityMap[state].push(city);
}

console.log("Total states found:", Object.keys(stateCityMap).length);


// 🔵 Load or Initialize State Status File
const stateStatusPath = path.join(__dirname, "indiaStateStatus.json");

let stateStatus = {};

if (fs.existsSync(stateStatusPath)) {
  const rawStatus = fs.readFileSync(stateStatusPath);
  stateStatus = JSON.parse(rawStatus);
}

// 🔵 NOW paste sync block HERE
for (const state of Object.keys(stateCityMap)) {

  const liveInState = existingLiveCities.filter(liveCity =>
    stateCityMap[state].some(
      city => city.RegionName === liveCity.city
    )
  );

  stateStatus[state].liveCount = liveInState.length;

  if (liveInState.length > 0 && stateStatus[state].status === "inactive") {
    stateStatus[state].status = "active";
  }
}

// Add missing states as inactive
for (const state of Object.keys(stateCityMap)) {
  if (!stateStatus[state]) {
    stateStatus[state] = {
      status: "inactive",
      liveCount: 0
    };
  }
}

// Save updated state status file
fs.writeFileSync(stateStatusPath, JSON.stringify(stateStatus, null, 2));

console.log("State status initialized.");



console.log("Total cities found:", cities.length);

let liveCities = [];

// 🔵 Loop through each state
for (const state of Object.keys(stateCityMap)) {

  const stateInfo = stateStatus[state];

  // Only check inactive states for now
  if (stateInfo.status === "inactive") {

    const probeCities = stateCityMap[state].slice(0, 3); // check first 2 cities

    for (const city of probeCities) {

      console.log(`Checking ${city.RegionName} (${state})...`);

      const movieUrl = `https://in.bookmyshow.com/movies/${city.RegionSlug}/toxic-a-fairy-tale-for-grown-ups/ET00378770`;

      await page.goto(movieUrl, { waitUntil: "domcontentloaded" });

      const html = await page.content();

      if (html.includes("Book Tickets")) {

        console.log(`✅ FIRST LIVE DETECTED in ${city.RegionName} (${state})`);

        // Mark state active
        stateStatus[state].status = "active";

        liveCities.push(city);

        break; // stop probing this state
      }
    }
  }

  // 🔵 ACTIVE STATE EXPANSION
if (stateInfo.status === "active") {

  const ACTIVE_BATCH_SIZE = 20;

  // Filter cities not yet live
  const pendingCities = stateCityMap[state].filter(
    city => !existingLiveSet.has(city.RegionName)
  );
  const batch = pendingCities.slice(0, ACTIVE_BATCH_SIZE);

  for (const city of batch) {

    console.log(`Expanding ${city.RegionName} (${state})...`);

    const movieUrl = `https://in.bookmyshow.com/movies/${city.RegionSlug}/toxic-a-fairy-tale-for-grown-ups/ET00378770`;

    await page.goto(movieUrl, { waitUntil: "domcontentloaded" });

    const html = await page.content();

    if (html.includes("Book Tickets")) {

      console.log(`✅ LIVE in ${city.RegionName} (${state})`);
    
      liveCities.push(city);
    
      existingLiveSet.add(city.RegionName);  // ← THIS IS STEP 7
    
      stateStatus[state].liveCount += 1;
    }
  }

  // 🔵 Check maturity
  const totalCities = stateCityMap[state].length;

  if (stateStatus[state].liveCount / totalCities > 0.85) {
    stateStatus[state].status = "mature";
    console.log(`${state} moved to MATURE state.`);
  }
}

}


// Save updated state status
fs.writeFileSync(stateStatusPath, JSON.stringify(stateStatus, null, 2));

console.log("\nLive cities found:", liveCities.length);
// 🔥 Convert to globe format
const formattedCities = liveCities.map(city => ({
    city: city.RegionName,
    country: "IND",
    lat: parseFloat(city.Lat),
    lng: parseFloat(city.Long)
  }));
  
  // 🔥 Write to bookingData.json
  const filePath = path.join(__dirname, "..", "public", "bookingData.json");
  
  fs.writeFileSync(filePath, JSON.stringify(formattedCities, null, 2));
  
  console.log("bookingData.json updated successfully.");

  } catch (error) {
    console.error("Error:", error);
  }
}

run();