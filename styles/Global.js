import { Platform } from "react-native";

const css = {
  paddingTop: '15%',
  backgroundColorOne: "#fbdd74",
  backgroundColorTwo: "#abd1c6",
  activeIconColor: "#E45858",
  iconColor: "#6246ea",
  activeButtonColor: "#abd1c6",
  inactiveButtonColor: "#004643",
  gradientColor: "linear-gradient(45deg, #f9bc60, #6246ea)",
  fontSizeOne: 96,
  fontSizeTwo: 60,
  fontSizeThree: 48,
  fontSizeFour: 34,
  fontSizeFive: 24,
  fontSizeSix: 20,
  fontSizeSeven: 14,
  fontSizeEight: 12,
  fontFamilyOne: Platform.OS === "ios" ? "Fira Sans" : '',
  fontFamilyTwo: "Varela",
  fontFamilyThree: "Varela Round",
};

export default css;