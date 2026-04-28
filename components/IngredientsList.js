import React from "react";
import { Modal, StyleSheet, TouchableOpacity, Text, View, FlatList 
} from 'react-native';
import css from '../styles/Global';
import MyButton from "./MyButton";
import { FontAwesome } from "@expo/vector-icons";

//ICI: LA MODAL QUI AFFICHE LES INGREDIENTS DE LA RECETTE UTILISATEUR \\

export default function IngredientsList({ingredientsList, setIngredientsList, handleDeleteIngredient, setModalVisible, modalVisible}){
//Fonction pour compter le nombre d'ingrédients ajoutés
const ingredientCount = ingredientsList.length;


return (
  <View style={styles.container}>
               {/* Modal qui affiche la liste des ingrédients */}
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
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
                  <FontAwesome name="times" size={24} color={css.palette.error} />
                </TouchableOpacity>
              </View>
          )}/>
        )} 
        {/* Bouton pour fermer la Modal */}
        <MyButton
        dataFlow={() => setModalVisible(false)}
        text="Close"
        buttonType={styles.closeModalButton}/>
      </View>
    </Modal>
  </View>
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
    backgroundColor: css.palette.secondary500,
  },
  modalTitle: { 
    fontSize: css.typography.bodySize, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: css.palette.primary800
  },
  
  ingredientItem: { 
    width: '100%',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: css.palette.accent500,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: css.palette.primary800,
  },
  emptyList: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
  closeModalButton: { 
    backgroundColor: css.palette.error,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    width: '40%',
  },


})