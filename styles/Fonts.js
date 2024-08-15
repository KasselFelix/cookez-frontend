import React from 'react';
import AppLoading from 'expo-app-loading';
import { useFonts, FiraSans_300Light, FiraSans_400Regular, FiraSans_500Medium, FiraSans_600SemiBold} from '@expo-google-fonts/fira-sans';

const Fonts = ({ children }) => {
  let [fontsLoaded] = useFonts({
    FiraSans_300Light,
    FiraSans_400Regular,
    FiraSans_500Medium,
    FiraSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  } else {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize,
            paddingVertical,
            // Note the quoting of the value for `fontFamily` here; it expects a string!
            fontFamily: 'FiraSans_300Light',
          }}>
          Fira Sans Light
        </Text>
        <Text
          style={{
            fontSize,
            paddingVertical,
            // Note the quoting of the value for `fontFamily` here; it expects a string!
            fontFamily: 'FiraSans_400Regular',
          }}>
          Fira Sans Regular
        </Text>
        <Text
          style={{
            fontSize,
            paddingVertical,
            // Note the quoting of the value for `fontFamily` here; it expects a string!
            fontFamily: 'FiraSans_500Medium',
          }}>
          Fira Sans Medium
        </Text>
        <Text
          style={{
            fontSize,
            paddingVertical,
            // Note the quoting of the value for `fontFamily` here; it expects a string!
            fontFamily: 'FiraSans_600SemiBold',
          }}>
          Fira Sans Semi Bold
        </Text>
      </View>
    );
  }
};
