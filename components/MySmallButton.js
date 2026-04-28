import { Text, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import buttonStyles from "../styles/Button";

  export default function MySmallButton({ dataFlow, text, buttonType}) {
    const dispatch = useDispatch();

    const handlePress = () => {
      dataFlow();
    }

    return (
        <TouchableOpacity style={buttonType} activeOpacity={0.8} onPress={() =>handlePress()}>
          <Text style={buttonStyles.buttonText}>{text}</Text>
        </TouchableOpacity>
      );
  };