import React from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import css from "../styles/Global";
import useT from "../i18n/useT";

export default function SearchIngredients ({clicked, searchInput, setSearchInput, setClicked, setDataListIngredient}) {
  const t = useT();
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
          placeholder={t('kickoff.modal.searchPlaceholder')}
          placeholderTextColor="grey"
          value={searchInput}
          onChangeText={setSearchInput}
          onFocus={() => {
            setClicked(true);
          }}
        />
        {/* Clear-text button — x-circle is the universally-recognized affordance
            for "wipe this input"; primary800 (teal brand) is visible without
            shouting like red would. */}
        {clicked && (
          <TouchableOpacity
            onPress={() => {
              setSearchInput("");
              setDataListIngredient([]);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('kickoff.modal.clear')}
            style={{ padding: 1 }}
          >
            <Feather name="x-circle" size={20} color={css.palette.primary800} />
          </TouchableOpacity>
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

  // Unified width regardless of focus state — the previous "clicked" style
  // shrunk the bar from 95% to 80% which caused a visible jump on focus.
  // Now the bar stays put; only the clear (x-circle) icon appears/disappears.
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
    width: "95%",
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 20,
    marginLeft: 10,
  },

});