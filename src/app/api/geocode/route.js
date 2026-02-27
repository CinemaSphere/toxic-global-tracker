export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
  
    if (!city) {
      return Response.json({ error: "City required" }, { status: 400 })
    }
  
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "GlobeApp/1.0"
          }
        }
      )
  
      const data = await res.json()
  
      if (!data.length) {
        return Response.json({ error: "City not found" }, { status: 404 })
      }
  
      return Response.json(data[0])
    } catch (err) {
      return Response.json({ error: "Geocoding failed" }, { status: 500 })
    }
  }