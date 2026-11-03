import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import buttonStyles from "../styles/Button";

// `icon` is an optional `{ name, size?, color?, position? }` object that
// renders a FontAwesome glyph alongside the text. `position: 'left' | 'right'`
// (default left). `accessibilityLabel` falls back to `text` for screen readers
// when the visible label is an icon only.
export default function MyButton({
  dataFlow,
  text,
  buttonType,
  icon,
  accessibilityLabel,
  textColor,
}) {
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

  const renderIcon = () =>
    icon ? (
      <FontAwesome5
        name={icon.name}
        solid
        size={icon.size ?? 22}
        color={icon.color ?? buttonStyles.buttonText?.color ?? "white"}
      />
    ) : null;

  const iconPosition = icon?.position ?? "left";
  const hasText = text !== undefined && text !== null && text !== "";

  return (
    <View style={buttonStyles.buttonContainer}>
      <TouchableOpacity
        style={buttonType}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (typeof text === "string" ? text : undefined)}
      >
        <Animated.View
          style={[buttonStyles.hoverOverlay, { opacity: scaleAnim }]}
        >
          <LinearGradient
            colors={["#f9bc60", "#6246ea"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        <View style={styles.content}>
          {iconPosition === "left" && renderIcon()}
          {hasText && (
            <Text style={[buttonStyles.buttonText, styles.text, textColor ? { color: textColor } : null]}>{text}</Text>
          )}
          {iconPosition === "right" && renderIcon()}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  text: {
    // override zIndex via flow above; keep text alignment in line with icon
  },
});
