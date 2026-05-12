import { FontAwesome } from "@expo/vector-icons";
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useDispatch, useSelector } from 'react-redux';
import MySmallButton from '../components/MySmallButton';
import Recipe from '../components/Recipe';
import addressIp from '../modules/addressIp';
import { setRecipes } from '../reducers/recipe';
import buttonStyles from '../styles/Button';
import css from "../styles/Global";

export default function ResultScreen({ navigation,route }) {

  const user =useSelector((state)=>state.user.value);
  const recipeData = useSelector((state) => state.recipe.value);
  const ingredients = useSelector((state) => state.ingredient.value);
  const origin= useSelector((state)=>state.recipeFilters.value.selectedOrigin);
  const dispatch= useDispatch();


  const handleFetch= async ()=>{
    const ingredientSelected = ingredients.map((e)=> {
      console.log("Debug - Ingredient in state:", e); // Debug : Affiche l'ingrédient tel qu'il est dans le state
      return e = {
        name: e.data.display_name ,
        image: e.photo,
        quantity: e.data.g_per_serving,
        nutrition: e.data.nutrition
      };
    })
    try{
      const response = await fetch(`${addressIp}/recipes/result`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: user.token , 
          ingredients: ingredientSelected,
          allergy:user?.settings?.allergy,
          origin:origin || 'All recipes',
        })
      });
      const data =  await response.json();
      if (data.result) {
        dispatch(setRecipes(data.recipes))
      }
    }catch(error){
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

  useEffect(()=>{
    handleFetch();
  },[])

  
  
  
  const recipes = recipeData.map((data, i) => {
    return  <Recipe key={i} {...data} navigation={navigation}/>;
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.navigate('Recap')}
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
    backgroundColor: css.palette.accent500
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    fontSize: css.typography.h5Size,
  },

  btnReturn: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
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
    fontSize: css.typography.bodySize,
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

