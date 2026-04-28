import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import buttonStyles from "../styles/Button";

export default function MyButton({ dataFlow, text, buttonType }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => dataFlow());
  };

  return (
    <View style={buttonStyles.buttonContainer}>
      <TouchableOpacity
        style={buttonType}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
          <Animated.View
            style={[
              buttonStyles.hoverOverlay,
              { opacity: scaleAnim },
            ]}
          > 
            
            <LinearGradient
              colors={["#f9bc60", "#6246ea"]}
              start={{ x: 0, y: 0 }} // direction gauche → droite
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject} //remplit tout le parent
            />
          </Animated.View>
           <Text style={[buttonStyles.buttonText, { zIndex: 1 }]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

