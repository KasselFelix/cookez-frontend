import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, SafeAreaView, TouchableOpacity, TextInput} from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import css from '../styles/Global';

// the filter
export default function ListIngredients ({ searchInput, setClicked, data, onItemPress}) {
    
    const [selectedItemId, setSelectedItemId] = useState(null);

    const Item = ({ name, itemData }) => {
    const isSelected = selectedItemId === itemData.id  // Vérifie si l'élément est sélectionné
      
    return (
      <TouchableOpacity
      activeOpacity={0.8} 
      onPress={() => {setSelectedItemId(itemData.id); onItemPress(itemData)}} // Passez les données de l'élément à la fonction onItemPress
      style={isSelected ? styles.validated : styles.nonValidated}
      >
        <View style={styles.item}>
                <Text style={styles.name}>{name}</Text>
                <TouchableOpacity activeOpacity={0.8}  >
                    <FontAwesome name={'check'} size={22} color={'white'}/>
                </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

    const renderItem = ({ item }) => {
        if (data === "No ingredients found") {
            return;
        }

        if (item.name.toUpperCase().includes(searchInput.toUpperCase().trim())) {
        return <Item name={item.name} itemData={item}/>;
        }
  };

  return (
    <SafeAreaView style={styles.listContainer}>
        <View
          onStartShouldSetResponder={() => {
            setClicked(false);
          }}
        >
          {data.length === 0 && <Text style={styles.text}>Waiting for your search 🧐 ...</Text>}
          {data === "No ingredients found"  && <Text style={styles.text}>{data} sorry... try again ! 👍</Text>}
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
  height: "65%",
  width: "100%",
  justifyContent:'center',
  alignItems:'center',
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

text: {
  alignSelf: 'center',
  textAlignVertical: 'center',
  height: '80%',
}
});