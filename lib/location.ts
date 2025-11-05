import * as Location from "expo-location";
import Toast from "react-native-toast-message";

export const getDistanceInKm = async (
  targetLatitude: number,
  targetLongitude: number
): Promise<number | null> => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Toast.show({
      type: "error",
      text1: "Location Permission Denied",
      text2: "Please grant location access to calculate distance.",
    });
    return null;
  }

  let location = await Location.getCurrentPositionAsync({});
  const userLatitude = location.coords.latitude;
  const userLongitude = location.coords.longitude;

  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(targetLatitude - userLatitude);
  const dLon = toRadians(targetLongitude - userLongitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
};

const toRadians = (deg: number) => {
  return deg * (Math.PI / 180);
};