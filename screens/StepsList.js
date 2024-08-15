import React from "react";
import { Modal, StyleSheet, TouchableOpacity, Text, View, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import css from '../styles/Global';
import MyButton from "../modules/MyButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";

//ICI: LA MODAL QUI AFFICHE LES INGREDIENTS DE LA RECETTE UTILISATEUR \\


export default function StepsList({stepsArray, handleDeleteStep, setModalVisible2, modalVisible2}){
  //Fonction pour compter le nombre d'de steps ajoutés
const stepCount = stepsArray.length;

return (
  <SafeAreaView style={styles.container}>
    <Modal visible={modalVisible2} animationType="slide" onRequestClose={() => setModalVisible2(false)}>
    <SafeAreaView style={styles.modalContainer}>
    <Text style={styles.modalTitle}> Steps List 🥄</Text>
    {stepsArray.length === 0 ? (
        <Text style={styles.emptyList2}>No step added yet</Text>
      ) : (
          <FlatList
            data={stepsArray}
            keyExtractor={(item, index)=> index.toString()}
            renderItem={({item}) => (
              <View style={styles.stepItem}>
                <Text>{item}</Text>
                   {/* Bouton pour supprimer un ingrédient  */}
                <TouchableOpacity onPress={() => handleDeleteStep(item)}>
                  <FontAwesome name="trash" size={20} color={css.activeIconColor} />
                </TouchableOpacity>
              </View>
          )}/>
        )}
               {/* Bouton pour fermer la Modal */}
      <MyButton
        dataFlow={() => setModalVisible2(false)}
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
  
  stepItem: { 
    width: '100%',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: css.backgroundColorOne,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyList2: {
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



