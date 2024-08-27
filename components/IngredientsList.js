import React from "react";
import { Modal, StyleSheet, TouchableOpacity, Text, View, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import css from '../styles/Global';
import MyButton from "./MyButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";


//ICI: LA MODAL QUI AFFICHE LES INGREDIENTS DE LA RECETTE UTILISATEUR \\

export default function IngredientsList({ingredientsList, setIngredientsList, handleDeleteIngredient, setModalVisible, modalVisible}){
//Fonction pour compter le nombre d'ingrédients ajoutés
const ingredientCount = ingredientsList.length;


return (
  <SafeAreaView style={styles.container}>
               {/* Modal qui affiche la liste des ingrédients */}
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <Text style={styles.modalTitle}> Ingredients List🧂</Text>
      {ingredientsList.length === 0 ? (
        <Text style={styles.emptyList}>No ingredient added yet</Text>
      ) : (
          <FlatList
            data={ingredientsList}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
              <View style={styles.ingredientItem}>
                <Text>{`${item.quantity} ${item.unit} ${item.name}`}</Text>
                   {/* Bouton pour supprimer un ingrédient  */}
                <TouchableOpacity onPress={() => handleDeleteIngredient(item.id)}>
                  <FontAwesome name="times" size={24} color={css.activeIconColor} />
                </TouchableOpacity>
              </View>
          )}/>
        )} 
        {/* Bouton pour fermer la Modal */}
        <MyButton
        dataFlow={() => setModalVisible(false)}
        text="Close"
        buttonType={styles.closeModalButton}/>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1, 
    alignItems: 'center',
    backgroundColor: "#ffff"
  },
  modalContainer: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: css.activeButtonColor,
  },
  modalTitle: { 
    fontSize: css.fontSizeSix, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: css.inactiveButtonColor
  },
  
  ingredientItem: { 
    width: '100%',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: css.backgroundColorOne,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
  },
  emptyList: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
  closeModalButton: { 
    backgroundColor: css.activeIconColor,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    width: '40%',
  },


})