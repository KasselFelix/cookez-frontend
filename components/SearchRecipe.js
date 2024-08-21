import React from "react";
import { StyleSheet, TextInput, View, Text, Keyboard, Button, TouchableOpacity, Image} from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import css from "../styles/Global";

export default function SearchRecipe ({clicked, searchRecipe, setSearchRecipe, setClicked, setDataListRecipe}) {

  //const recipe = useSelector((state) => state.recipe.recipes)

  return (
    <View style={styles.container}>
      <View
        style={clicked ? styles.searchBar__clicked : styles.searchBar__unclicked}
      >
        {/* search Icon */}
        <Feather
          name="search"
          size={20}
          color="black"
          style={{ marginLeft: 1 }}
        />
        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder="Search"
          placeholderTextColor="grey"
          value={searchRecipe}
          onChangeText={setSearchRecipe}
          onFocus={() => {
            setClicked(true);
          }}
        />
        {/* cross Icon, depending on whether the search bar is clicked or not */}
        {clicked && (
          <Entypo name="cross" size={20} color="black" style={{ padding: 1 }} onPress={() => {
              setSearchRecipe("");
              setDataListRecipe([]);
          }}/>
        )}
      </View>
    </View>
  );
};

// styles
const styles = StyleSheet.create({
  container: {
    margin: 15,
    alignItems: "center",
    width: "90%",
  },

  searchBar__unclicked: {
    padding: 10,
    flexDirection: "row",
    width: "95%",
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
  },

  searchBar__clicked: {
    padding: 10,
    flexDirection: "row",
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  input: {
    fontSize: 20,
    marginLeft: 10,
    width: "90%",
  },

  basket: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: css.backgroundColorTwo,
    width: '70%',
    height: 30,
  },

  basketTwo: {
    backgroundColor: css.backgroundColorTwo,
  },

  removeBtn: {
    backgroundColor: css.backgroundColorTwo,
  }
});