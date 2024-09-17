import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, SafeAreaView, TouchableOpacity, TextInput} from "react-native";
import css from '../styles/Global';



cc
// the filter
export default function ListRecipes ({ searchRecipe, setClicked, data, onItemPress}) {
    
    const [selectedItemId, setSelectedItemId] = useState(null);

    const Item = ({ name, itemData }) => {
      const isSelected = selectedItemId === itemData._id  // Vérifie si l'élément est sélectionné
      
      return (
        <TouchableOpacity
        activeOpacity={0.8} 
        onPress={() => {setSelectedItemId(itemData._id);onItemPress(itemData)}} // Passez les données de l'élément à la fonction onItemPress
        style={isSelected ? styles.validated : styles.nonValidated}
        >
          <View style={styles.item}>
                  <Text style={styles.name}>{name}</Text>
                  {/* <TouchableOpacity activeOpacity={0.8}  >
                      <FontAwesome name={'check'} size={22} color={'white'}/>
                  </TouchableOpacity> */}
          </View>
        </TouchableOpacity>
    );
  }

    const renderItem = ({ item }) => {
        if (data === "No ingredients found") {
            return;
        }

        if (item.name.toUpperCase().includes(searchRecipe.toUpperCase())) {
        return <Item name={item.name} itemData={item} />;
        }
  };

  return (
    <SafeAreaView style={styles.listContainer}>
        <View
          onStartShouldSetResponder={() => {
            setClicked(false);
          }}
        >
          {data.length === 0 && <Text>Waiting for your search...</Text>}
          {data === "No recipe found"  && <Text>{data}</Text>}
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
          />
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
listContainer: {
  margin: 10,
  height: "65%",
  width: "100%",
  justifyContent:'center',
  alignItems:'center',
},

nonValidated: {
  backgroundColor: "white",
  borderRadius: 50,
  marginBottom: 10,
  width: 340,
},

validated: {
  backgroundColor: css.backgroundColorTwo,
  borderRadius: 50,
  marginBottom: 10,
  width: 340,
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
  width: '80%'
},

name: {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 5,
  fontStyle: "italic",
},

});