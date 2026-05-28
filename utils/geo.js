/** 计算两点距离（米），Haversine 公式 */
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (deg) => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function formatDistance(meters) {
  if (meters == null || meters < 0) return ''
  if (meters < 1000) return meters + 'm'
  return (meters / 1000).toFixed(1) + 'km'
}

/** 按与用户距离排序景点 */
function sortSpotsByDistance(spots, userLat, userLng) {
  return spots
    .map((spot) => {
      const meters = getDistanceMeters(
        userLat, userLng,
        spot.latitude, spot.longitude
      )
      return Object.assign({}, spot, {
        distanceMeters: meters,
        distanceText: formatDistance(meters)
      })
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}

module.exports = {
  getDistanceMeters,
  formatDistance,
  sortSpotsByDistance,
  ARRIVE_RADIUS_METERS: 150
}