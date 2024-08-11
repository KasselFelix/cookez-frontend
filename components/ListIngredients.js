import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, SafeAreaView, TouchableOpacity, TextInput} from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import css from '../styles/Global';




// the filter
export default function ListIngredients ({ searchInput, setClicked, data, validatedIngredient, setValidatedIngredient }) {

    const Item = ({ name }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => validatedIngredient ? setValidatedIngredient(false) : setValidatedIngredient(true)} style={ validatedIngredient ? styles.validated : styles.nonValidated}>
          <View style={styles.item}>
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => validatedIngredient ? setValidatedIngredient(false) : setValidatedIngredient(true)} style={ validatedIngredient ? styles.validatedBtn : styles.nonValidatedBtn}>
                <FontAwesome name={'check'} size={22} color={'white'}/>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => {
        if (data === "No ingredients found") {
            return;
        }

        if (item.name.toUpperCase().includes(searchInput.toUpperCase().trim().replace(/\s/g, ""))) {
        return <Item name={item.name}/>;
        }
  };

  return (
    <SafeAreaView style={styles.listContainer}>
        <View
          onStartShouldSetResponder={() => {
            setClicked(false);
          }}
        >
          {!data && <Text>Waiting for your search...</Text>}
          {data === "No ingredients found"  && <Text>{data}</Text>}
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    margin: 10,
    height: "85%",
    width: "100%",
  },

  nonValidated: {
    backgroundColor: "white",
    borderRadius: 50,
    marginBottom: 10,
  },

  validated: {
    backgroundColor: "green",
        borderRadius: 50,
    marginBottom: 10,
  },

  nonValidatedBtn: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    backgroundColor: "grey",
    borderRadius: 100,
  },

  validatedBtn: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    backgroundColor: "green",
    borderRadius: 100,
  },

  item: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 30,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    fontStyle: "italic",
  },
});