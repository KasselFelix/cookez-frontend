import React from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeProvider";
import useT from "../i18n/useT";

export default function SearchIngredients ({clicked, searchInput, setSearchInput, setClicked, setDataListIngredient}) {
  const t = useT();
  const css = useTheme();
  const styles = makeStyles(css);
  return (
    <View style={styles.container}>
      <View
        style={clicked ? styles.searchBar__clicked : styles.searchBar__unclicked}
      >
        {/* search Icon */}
        <Feather
          name="search"
          size={20}
          color={css.flow.modalInk}
          style={{ marginLeft: 1 }}
        />
        {/* Input field */}
        <TextInput
          testID="kickoff-search-input"
          style={styles.input}
          placeholder={t('kickoff.modal.searchPlaceholder')}
          placeholderTextColor={css.flow.modalMuted}
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
            <Feather name="x-circle" size={20} color={css.flow.modalClear} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// styles
// Built from the active theme (useTheme) in the component.
const makeStyles = (css) => StyleSheet.create({
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
    backgroundColor: css.flow.modalField,
    borderRadius: 15,
    alignItems: "center",
  },

  searchBar__clicked: {
    padding: 10,
    flexDirection: "row",
    width: "95%",
    backgroundColor: css.flow.modalField,
    borderRadius: 15,
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 20,
    marginLeft: 10,
    color: css.flow.modalInk,
  },

});