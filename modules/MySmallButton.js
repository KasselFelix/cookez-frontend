import {
    Text,
    View,
    TouchableOpacity,
  } from "react-native";
  import React, { useRef } from "react";
  import css from "../styles/Global";
  import buttonStyles from "../styles/Button";
  import LinearGradient from "react-native-linear-gradient";

  export default function MyBackButton({ dataFlow, text, buttonType }) {

    const handleReturn = () => {
      dataFlow();
    }

    return (
        <TouchableOpacity style={buttonType} activeOpacity={0.8} onPress={() => handleReturn()}>
          <Text>{text}</Text>
        </TouchableOpacity>
      );
  };