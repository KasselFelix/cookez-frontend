import { StyleSheet } from "react-native";

import css from "./Global.js";

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
    justifyContent: "center",
    width: "80%",
    minWidth: 200,
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
    justifyContent: "center",
    alignItems: "center",
    width: '40%',
    minWidth: 200,
  },
  buttonThree: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: '40%',
    minWidth: 200,
    marginBottom: 5,
  },
  buttonSmall: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    marginBottom: '4%',
    borderRadius: 10,
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
  },
});

export default buttonStyles; 
