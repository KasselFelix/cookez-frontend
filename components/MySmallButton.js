import { Text, View, TouchableOpacity } from "react-native";
  import React, { useRef, UseDispatch } from "react";
  import css from "../styles/Global";
  import buttonStyles from "../styles/Button";
  import LinearGradient from "react-native-linear-gradient";
import { useDispatch } from "react-redux";

  export default function MySmallButton({ dataFlow, text, buttonType, /*searchInput,*/ setSearchInput, setDataListIngredient/*, addIngredientToStore*/}) {
    const dispatch = useDispatch();

    const handlePress = () => {
      dataFlow();
    }

    const handleSearchInput = () => {
      setSearchInput("");
    }

    return (
        <TouchableOpacity style={buttonType} activeOpacity={0.8} onPress={() => {handlePress()}}>
          <Text style={buttonStyles.buttonText}>{text}</Text>
        </TouchableOpacity>
      );
  };