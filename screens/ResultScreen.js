import { StyleSheet, Text, View, TouchableOpacity, ScrollView} from 'react-native';
import React, { useEffect, useState } from 'react';
import css from "../styles/Global";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Recipe from '../components/Recipe';
import { useDispatch, useSelector } from 'react-redux';
import { updateRecipeToStore } from '../reducers/recipe';
import addressIp from '../modules/addressIp';
import MySmallButton from '../modules/MySmallButton';
import buttonStyles from '../styles/Button';
import * as Animatable from 'react-native-animatable';

export default function ResultScreen({ navigation }) {

  const user =useSelector((state)=>state.user.value);
  const recipeData= useSelector((state)=>state.recipe.recipes);
  const ingredients= useSelector((state)=>state.ingredient.ingredient)
  const dispatch= useDispatch();

  const handleFetch= async ()=>{
    const ingredientSelected = ingredients.map((e)=> {
      return e={name: e.data.display_name ,
      image: e.photo,
      quantity: e.data.g_per_serving,
      nutrition: e.data.nutrition};
    })
    try{
      const response = await fetch(`http://${addressIp}:3000/recipes/result`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username || '', 
          ingredients: ingredientSelected,
          excludeIngredients:[]
        })
      });
      const data =  await response.json();
      if (data.result) {
        dispatch(updateRecipeToStore(data.recipes))
      }
    }catch(error){
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

  useEffect(()=>{
    handleFetch();
  },[])

  function update(){
    handleFetch();
  }
 
  const recipes = recipeData.map((data, i) => {
    return  <Recipe key={i} {...data} navigation={navigation} update={update} />;
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={<FontAwesome name="angle-double-left" size={30} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>Result{recipes.length >  0 && 's'}</Text>
        <View style={styles.btnEmpty}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {recipes.length > 0 ? recipes: <Animatable.View animation="slideInDown" duration={700} style={styles.noRecipesContainer}> 
          <View style={styles.noRecipes}><Text> try with more ingredient again 🤔 </Text><Text> maybe it's time to go shopping!  </Text></View>
          </Animatable.View>}
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

  btnEmpty: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    marginBottom: '4%',
    borderRadius: 10,
  },

  scrollView: {
    marginHorizontal: '7%',
  },

  name: {
    fontSize: css.fontSizeSix,
  },

  noRecipesContainer: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '120%',
  },

  noRecipes: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

}); 

