import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, ScrollView} from 'react-native';
import React from 'react';
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import recipes from '../modules/recipes';
import Recipe from '../components/Recipe';
import { useState } from 'react';

export default function ResultScreen({ navigation }) {

  const recipeData = recipes;

  // const [selectedRecipe, setSelecedRecipe] = useState([]);

  const results = recipeData.map((data, i) => {
    return  <Recipe key={i} {...data} />;
  })

  const handleReturn = () => {
    navigation.navigate("Home")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnReturn} activeOpacity={0.8} onPress={() => handleReturn()}>
          <FontAwesome name='angle-double-left' size={30} color={'white'}/>
        </TouchableOpacity>
        <Text style={styles.titlePage}>Résultats</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollView}>
        {results}
      </ScrollView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
    backgroundColor: css.backgroundColorOne
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    paddingRight: '35%',
    fontSize: css.fontSizeFive,
  },

  btnReturn: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    marginBottom: '4%',
    borderRadius: 10,
  },

  scrollView: {
    alignItems: 'center',
    paddingBottom: 20,
  },

  name: {
    fontSize: css.fontSizeSix,
  },
})