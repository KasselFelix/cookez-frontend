import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, ScrollView} from 'react-native';
import React, { useEffect } from 'react';
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
//import recipes from '../modules/recipes';
import Recipe from '../components/Recipe';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import user from '../reducers/user';
import ingredient from '../reducers/ingredient';
import recipe, { addRecipeToStore } from '../reducers/recipe';

export default function ResultScreen({ navigation }) {
  //const recipeData = recipes;
  const user =useSelector((state)=>state.user.user);
  const recipes = useSelector((state)=>state.recipe.recipes);
  const ingredients= useSelector((state)=>state.ingredient.ingredient)
  const dispatch= useDispatch();

  useEffect(()=>{
    fetch('http://192.168.100.246:3000/recipes/result', {
				method: 'POST',
				body: {username:user.username},
			   })
			   .then((response) => response.json())
				.then((data) => {
					if(data.result){
						dispatch(addRecipeToStore(data.recipes))
					}
			})
			.catch(error => console.error('There has been a problem with your fetch operation:', error));
  },[])
 

  // const [selectedRecipe, setSelecedRecipe] = useState([]);

  recipes = recipeData.map((data, i) => {
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