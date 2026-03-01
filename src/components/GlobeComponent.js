'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react'
import Globe from 'globe.gl'

import countries from "i18n-iso-countries"
import en from "i18n-iso-countries/langs/en.json"

countries.registerLocale(en)

export default function GlobeComponent() {
  const globeRef = useRef(null)
  const globeInstance = useRef(null)
  const countryDataRef = useRef([])
  const previousCitiesRef = useRef(null)
  const labelsRef = useRef([]);
  const cityElementsRef = useRef([]);
 

  const [stats, setStats] = useState({ cities: 0, countries: 0 })
  const [activityFeed, setActivityFeed] = useState([])
  const [manualCities, setManualCities] = useState([])
  const [isMobile, setIsMobile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false)
  const manualCitiesRef = useRef([])
  const [fileCities, setFileCities] = useState([]);
  const [showTagline, setShowTagline] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stableCities, setStableCities] = useState([]);

  const searchParams = useSearchParams();
  /* const isAdminMode = searchParams.get("admin") === "true"; */
  const isAdminMode = searchParams.get("access") === "toxic8473";

  useEffect(() => {
    manualCitiesRef.current = manualCities
  }, [manualCities])

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(countries => {

        countryDataRef.current = countries.features

        const globe = Globe()(globeRef.current)
          .backgroundColor('#000');

        globeInstance.current = globe

        globe.controls().addEventListener('change', () => {
          const altitude = globe.pointOfView().altitude;
        
          cityElementsRef.current.forEach(wrapper => {
            const dot = wrapper.children[0];
            const label = wrapper.children[1];
        
            if (label) {
              label.style.opacity = altitude < 1 ? '1' : '0';
            }
        
            if (dot) {
              const scale = Math.max(0.5, 1.6 - altitude);
              dot.style.transform = `scale(${scale})`;
            }
          });
        });
          

        // Set initial size
          globe.width(window.innerWidth);
          globe.height(window.innerHeight);

        // Handle resize
          window.addEventListener("resize", () => {
            globe.width(window.innerWidth);
            globe.height(window.innerHeight);
          });  

        // Stylized ocean
        globe.globeMaterial().color.set('#0f172a')

        globe.controls().autoRotate = true
        globe.controls().autoRotateSpeed = 0.4

        loadCityData()

        const interval = setInterval(loadCityData, 10000)
        return () => {
          clearInterval(interval);
          
        }
      })
      setTimeout(() => {
        setShowTagline(true);
      }, 300);

      // ✅ ADD HERE
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

  }, [])

  function focusOnCity(city) {
    if (!globeInstance.current) return

    const controls = globeInstance.current.controls()

    controls.autoRotate = false
    controls.enableZoom = false

    globeInstance.current.pointOfView(
      { lat: city.lat, lng: city.lng, altitude: 1.8 },
      2500
    )

    setTimeout(() => {
      controls.autoRotate = true
      controls.enableZoom = true
    }, 5000)
  }

  function loadCityData() {
    fetch('https://raw.githubusercontent.com/CinemaSphere/toxic-global-tracker/main/public/bookingData.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(cities => {
  
        setFileCities(cities);
        setStableCities(cities);
  
        if (!globeInstance.current) return
  
        const liveCountryCodes = [...new Set(cities.map(c => c.country))]
  
        let newCities = []
  
        if (previousCitiesRef.current !== null) {
          newCities = cities.filter(
            c => !previousCitiesRef.current.some(p => p.city === c.city)
          )
        }
  
        previousCitiesRef.current = cities
  
        setStats({
          cities: cities.length,
          countries: liveCountryCodes.length
        })
  
        globeInstance.current
          .polygonsData(countryDataRef.current)
          .polygonCapColor(d =>
            liveCountryCodes.includes(d.id)
              ? 'rgba(255,183,3,0.15)'
              : '#1e293b'
          )
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonStrokeColor(() => 'rgba(255,255,255,0.05)')
  
        // Pulsing rings only for new cities
          globeInstance.current
          .ringsData(newCities)
          .ringColor(() => 'rgba(255,183,3,0.7)')
          .ringMaxRadius(3)
          .ringPropagationSpeed(0.7)
          .ringRepeatPeriod(2000)
          .ringAltitude(0.01);
        
       


        if (newCities.length > 0) {
          const newest = newCities[newCities.length - 1]
  
          const newItem = {
            id: Date.now(),
            text: `🟢 ${newest.city} went live`
          }
  
          setActivityFeed(prev => [newItem, ...prev.slice(0, 4)])
  
          setTimeout(() => {
            setActivityFeed(prev =>
              prev.filter(item => item.id !== newItem.id)
            )
          }, 6000)
  
          focusOnCity(newest)
        }
      })
      .catch(err => console.error('JSON load error:', err))
  }

  useEffect(() => {
    if (!globeInstance.current) return;
  
    cityElementsRef.current = [];
  
    globeInstance.current
      .htmlElementsData(stableCities)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlElement(d => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.pointerEvents = 'none';
  
       /* const dot = document.createElement('div');
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.background = '#ffb703';
        dot.style.borderRadius = '50%';
        dot.style.boxShadow = '0 0 6px rgba(255,183,3,0.8)'; */

        const dot = document.createElement('div');
        dot.className = 'city-dot';
        dot.style.border = '1px solid rgba(255,255,255,0.3)';

        dot.style.width = '6px';
        dot.style.height = '6px';
        dot.style.background = '#ffb703';
        dot.style.borderRadius = '50%';
        dot.style.boxShadow = 'none';
        
        

        const label = document.createElement('div');
        label.innerText = d.city;
        label.style.fontSize = '10px';
        label.style.color = 'white';
        label.style.marginTop = '4px';
        label.style.whiteSpace = 'nowrap';
        label.style.opacity = '0';
        label.style.transition = 'opacity 0.2s ease';
  
        wrapper.appendChild(dot);
        wrapper.appendChild(label);
  
        cityElementsRef.current.push(wrapper);
  
        return wrapper;
      });
  
  }, [stableCities]);

  return (
    <> 
      {/* Tagline */}
<div
  style={{
    position: "fixed",
    top: "12px",
    width: "100%",
    textAlign: "center",
    color: "white",
    fontSize: "18px",
    fontWeight: "300",
    letterSpacing: "3px",
    opacity: showTagline ? 0.85 : 0,
    transition: "opacity 1s ease",
    zIndex: 1000
  }}
>
  Intoxicating the World
</div>
      {/* Admin Toggle */}
      {isAdminMode && ( 
      <div
        onClick={() => {
          if (!isAuthenticated) {
            setShowAdmin(true);
          } else {
            setShowAdmin(prev => !prev);
          }
        }}
        style={{
          position: 'fixed',
          top: '10px',
          right: '15px',
          color: 'white',
          cursor: 'pointer',
          zIndex: 1000,
          fontSize: '18px'
        }}
      >
        ⚙
      </div>
)}
      {isAdminMode && showAdmin && (
  <div
    style={{
      position: 'fixed',
      top: '50px',
      right: '15px',
      background: 'rgba(0,0,0,0.85)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      width: '260px'
    }}
  >
    {!isAuthenticated ? (
      <>
          <input
          type="password"
          placeholder="Enter admin password"
          value={adminPassword || ""}
          onChange={(e) => setAdminPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "6px",
            marginBottom: "8px",
            borderRadius: "4px",
            border: "none"
          }}
        />
        <button
          style={{
            width: "100%",
            padding: "6px",
            background: "#f59e0b",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
          onClick={async () => {
            const res = await fetch("/api/admin-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: adminPassword })
            });

            if (res.ok) {
              setIsAuthenticated(true);
              setAdminPassword("");
            } else {
              alert("Wrong password");
            }
          }}
        >
          Login
        </button>
      </>
    ) : (
      <>
        <input
          type="text"
          placeholder="Enter city name"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          style={{
            padding: '6px',
            width: '100%',
            marginBottom: '8px',
            borderRadius: '4px',
            border: 'none'
          }}
        />

        <button
          style={{
            width: '100%',
            padding: '6px',
            background: '#f59e0b',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={async () => {
            const cityName = cityInput.trim();
            if (!cityName) return

            const res = await fetch(`/api/geocode?city=${cityName}`)
            const result = await res.json()

            if (result.error) {
              alert(result.error)
              return
            }

            if (!result.address || !result.address.country_code) {
              alert("Country information not available")
              return
            }

            const iso2 = result.address.country_code.toUpperCase()
            const iso3 = countries.alpha2ToAlpha3(iso2)

            if (!iso3) {
              alert("Country conversion failed")
              return
            }

            const jsonRes = await fetch('/bookingData.json')
            const jsonCities = await jsonRes.json()

            const cityExistsInJson = jsonCities.some(
              c => c.city.toLowerCase() === cityName.toLowerCase()
            )

            if (cityExistsInJson) {
              alert("City already exists")
              return
            }

            await fetch("/api/add-city", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                city: cityName,
                country: iso3,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
              })
            })

            setCityInput("");
            previousCitiesRef.current = null;


            await loadCityData();
            
            setTimeout(() => {
              loadCityData();
            }, 1500);
          }}
        >
          Add City
        </button>

        <hr style={{ margin: '10px 0', borderColor: '#333' }} />

        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {fileCities.map((c, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px'
              }}
            >
              <span>{c.city}</span>
              <button
                style={{
                  background: 'red',
                  border: 'none',
                  color: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
                onClick={async () => {
                  await fetch("/api/remove-city", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      city: c.city,
                      country: c.country
                    })
                  });

                  await loadCityData();
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
)}
      {/* Top Counter */}
      <div
        style={{
          position: 'fixed',
          top: '50px',
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontSize: '18px',
          letterSpacing: '1px',
          fontWeight: '300',
          zIndex: 1000
        }}
      >
        🌍 {stats.cities} Cities • {stats.countries} Countries Live
      </div>

      {/* Globe */}
      <div ref={globeRef} style={{ height: '100vh' }} />

      {/* Live Feed */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '420px',
          padding: '0 16px',
          boxSizing: 'border-box',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        {activityFeed.map(item => (
          <div
            key={item.id}
            style={{
              background: 'rgba(0,0,0,0.65)',
              padding: '8px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              backdropFilter: 'blur(6px)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '300',
              textAlign: 'center',
              transition: 'opacity 0.6s ease'
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </>
  )
}