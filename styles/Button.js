import { StyleSheet } from "react-native";

import css from "./Global";

const buttonStyles = StyleSheet.create({
  buttonOne: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    alignItems: "center",
    width: "80%",
  },
  buttonTwo: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    alignItems: "center",
    width: "40%",
  },
  hoverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(213, 247, 239, 0.25)",
    borderRadius: 10,
  },
  buttonText: {
    color: css.backgroundColorOne,
    fontWeight: "bold",
    fontFamily: css.fontFamilyOne,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
});

export default buttonStyles;
