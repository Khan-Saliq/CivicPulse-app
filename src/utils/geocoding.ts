// Reverse geocoding utility - converts coordinates to readable area names
export async function getAreaFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CivicPulseApp/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Geocoding failed')
    }
    
    const data = await response.json()
    
    // Extract area information from the response
    const address = data.address
    
    // Try to get the most specific area name available
    const areaName = 
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      address.district ||
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county ||
      address.state ||
      'Unknown Area'
    
    return areaName
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

// Get formatted area display string
export async function getFormattedArea(lat: number, lng: number): Promise<string> {
  const area = await getAreaFromCoordinates(lat, lng)
  return area
}
