import { StyleSheet } from "react-native";

import css from "./Global.js";

const buttonStyles = StyleSheet.create({
  
  buttonOne: {
    //paddingVertical: 15,
    ///paddingHorizontal: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    height: 50,
    minWidth: 200,
  },

  buttonTwo: {
    //paddingVertical: 15,
    //paddingHorizontal: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: '40%',
    height: 50,
    minWidth: 200,
  },
  buttonThree: {
    // paddingVertical: 10,
    // paddingHorizontal: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: '40%',
    height: 40,
    minWidth: 200,
    marginBottom: 5,
  },
  buttonFour: {
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
    fontSize: 19.2,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "bold",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: 50,
  },
  buttonSmall: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
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
    color: css.palette.accent500,
    fontWeight: "bold",
    fontFamily: css.typography.fontHeading,
  },

  buttonContainer: {
    width: "100%",
    alignItems: 'center', 
  },

  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    paddingVertical: 15,  
    paddingHorizontal: 30,
  },
});

export default buttonStyles; 
