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
import recipe, { addRecipeToStore, updateRecipeToStore } from '../reducers/recipe';

export default function ResultScreen({ navigation }) {
  //const recipeData = recipes;
  const user =useSelector((state)=>state.user.user);
  const recipeData= useSelector((state)=>state.recipe.recipes);
  const ingredients= useSelector((state)=>state.ingredient.ingredient)
  const dispatch= useDispatch();

  useEffect(()=>{
    console.log(user)
    //console.log('ing before',ingredients)
    const ingredientSelected=ingredients.map((e)=> {
      return e={name: e.data.display_name ,
      image: e.photo,
      quantity: e.data.g_per_serving,
      nutrition: e.data.nutrition};
    })

    //console.log('body',ingredientSelected)
    fetch('http://192.168.100.246:3000/recipes/result', {
          method:'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username:user?user.username:'',ingredients:ingredientSelected,
            excludeIngredients:[]
          })
      }).then((response) => response.json())
			.then((data) => {
					if(data.result){
            //console.log('fetch:',data.recipes)
						dispatch(updateRecipeToStore(data.recipes))
            //console.log('reducer',recipeData)

					}
			})
			.catch(error => console.error('There has been a problem with your fetch operation:', error));
  },[])
 

 
  const recipes = recipeData.map((data, i) => {
    return  <Recipe key={i} {...data} navigation={navigation} />;
  })

  const handleReturn = () => {
    navigation.navigate("Home")
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnReturn} activeOpacity={0.8} onPress={() => handleReturn()}>
          <FontAwesome name='angle-double-left' size={30} color={'white'}/>
        </TouchableOpacity>
        <Text style={styles.titlePage}>Résultats</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {recipes.length>0 ? recipes: <View><Text> try with more ingredient again 🤔  </Text><Text> maybe it's time to go shopping!  </Text></View>}
      </ScrollView>
      

    </View>
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