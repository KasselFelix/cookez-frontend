import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Lightweight wrapper around NetInfo's subscription API.
//
// Why both `addEventListener` AND `fetch`?
//   The listener only fires on state *changes* — if the component mounts
//   with the device already offline, we wouldn't know until the network
//   flips. The initial `fetch()` seeds the state before any change event
//   arrives.
//
// Why expose `isConnected` AND `isInternetReachable`?
//   `isConnected` is true when the device is on a Wi-Fi/cellular
//   network. `isInternetReachable` is the more honest signal — Wi-Fi
//   can be associated to a router with no upstream (captive portal,
//   home modem offline). Default `isInternetReachable` to `true` on
//   platforms where it's unknown (`null`) to avoid false offline banners.
export function useConnectivity() {
  const [state, setState] = useState({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) =>
      setState({
        isConnected: !!s.isConnected,
        isInternetReachable: s.isInternetReachable !== false,
      }),
    );
    NetInfo.fetch().then((s) =>
      setState({
        isConnected: !!s.isConnected,
        isInternetReachable: s.isInternetReachable !== false,
      }),
    );
    return unsub;
  }, []);

  return state;
}
