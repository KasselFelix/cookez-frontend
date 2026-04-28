import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import css from '../styles/Global';

// the filter
export default function ListIngredients ({ searchInput, setClicked, data, onItemPress, onItemRemove, validatedIngredient,setValidatedIngredient}) {

  const Item = ({ name, itemData }) => {
    // On vérifie si l'ingrédient est déjà dans la liste des validés
    const isSelected = validatedIngredient.includes(itemData.id);

    const handlePress = () => {
      if (isSelected) {
        // 1. Désélection locale : on retire l'ID de l'état visuel
        setValidatedIngredient(validatedIngredient.filter(id => id !== itemData.id));
        
        // 2. Désélection Redux : on prévient le parent qu'il faut retirer l'ingrédient
        onItemRemove(itemData);
      } else {
        // 1. Sélection locale : on ajoute l'ID
        setValidatedIngredient([...validatedIngredient, itemData.id]);
        
        // 2. Sélection Redux : on ajoute l'ingrédient
        onItemPress(itemData);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={isSelected ? styles.validated : styles.nonValidated}
      >
        <View style={styles.item}>
          <Text style={styles.name}>{name}</Text>
          {/* On change l'icône ou la couleur si c'est sélectionné */}
          <FontAwesome 
              name={isSelected ? 'check' : ''} 
              size={22} 
              color={isSelected ? 'white' :'' }
          />
        </View>
      </TouchableOpacity>
    );
    };

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
            keyExtractor={(item, index) => `${item.name}-${index}`}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
  backgroundColor: css.palette.secondary500,
  borderRadius: 50,
  marginBottom: 10,
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

text: {
  alignSelf: 'center',
  textAlignVertical: 'center',
  height: '80%',
}
});