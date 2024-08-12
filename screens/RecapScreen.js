import React, { useEffect, useState} from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ingredient, { removeIngredientToStore ,removeAllIngredientToStore } from "../reducers/ingredient";

import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";

import Recap from "../components/Recap";


// {"confidence": 0.9998, "food_info": {"display_name": "Banana", "food_id": "f6ae02c12ed752bcdf92060492cf6572", "fv_grade": "A", "g_per_serving": 100, "nutrition": {"alcohol_100g": 0, "calcium_100g": 0.00447, "calories_100g": 92.8, "carbs_100g": 20, "chloride_100g": null, "cholesterol_100g": 0.000065, "copper_100g": null, "fat_100g": 0.2, "fibers_100g": 3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "lories_100g": 92.8, "carbs_100g": 20, "chloride_100g": null, "cholesterol_100g": 0.000065, "copper_100g": null, "fat_100g": 0.2, "fibers_100g": 3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "l, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, ": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, ", "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_10sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamin_c_100g": 0.00654, "vitamin_d_100g": null, "vitamin_e_100g": null, "vitamin_k1_100g": null, "water_100g": null, "zinc_100g": null}}, "ingredients": [], "quantity": 100}
// sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamtamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_10: null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamin_c_100g": 0.00654, "vitamin_d_100g": null, "vitamin_e_100g": null, "vitamin_k1_100g": null, "water_100g": null, "zinc_100g": null}}, "ingredients": [], "quantity": 100}

// const data = [
//   {"display_name": "Candy bar", "food_id": "a9987bf9f43933e89b01ec82d296b163", "fv_grade": "D", "g_per_serving": 52}, "photo":c `file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Fapp-21ef53c8-b5cc-41f5-a4a7-996c6b43a1cb/Camera/308fa0c0-ea57-4b3a-8bc2-08bd2e494b7d.jpg`},
//   {"display_name": "Banana", "food_id": "f6ae02c12ed752bcdf92060492cf6572", "fv_grade": "A", "g_per_serving": 100, "photo": `file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Fapp-21ef53c8-b5cc-41f5-a4a7-996c6b43a1cb/Camera/c759a13d-9b31-4d30-9fcc-1f0511f12e58.jpg`},
// ]

export default function RecapScreen({navigation}) {

  
  const dataBase =[
    {photo: 'C:\Users\andre\Desktop\Deployment\mvp\cookez-frontend\images\/665dea568f97ab001d3861a4.jpg', data: {display_name: 'HelloLePeople', g_per_serving: 100}},
    {photo: '665dec84e83b9f001d0faf10.jpg', data: {display_name: 'World', g_per_serving: 1000}},
  ]

  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.ingredient);
  console.log('LIST INGREDIENTS TO SOTRE: ', ingredients);

  // useEffect(()=>{
  //   dispatch(removeAllIngredientToStore())
  //   return ;
  // },[])

  let listIngredients=<></>;
  // if(dataBase.length>0){
  if(ingredients.length>0){
    listIngredients= ingredients.map((data, i) => {
      console.log(data.data.display_name)
      return <Recap key={i} {...data}/>
    })
  }

  // const handleReturn = () => {
  //   navigation.navigate("Kickoff")
  // }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity style={styles.btnReturn} activeOpacity={0.8} onPress={() => handleReturn()}>
          <FontAwesome name='angle-double-left' size={30} color={'white'}/>
        </TouchableOpacity> */}
        <MySmallButton
        	dataFlow={()=>navigation.navigate("Kickoff")}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>Ingrédients</Text>
      </View>
      <ScrollView contentContainerStyle={styles.galleryContainer}>
          {listIngredients}
      </ScrollView>
      <View style={styles.buttonBottom}>
        <MyButton
			    dataFlow={()=>navigation.navigate('Result')}
			    text="Valider"
			    buttonType={buttonStyles.buttonTwo}
		    />
      </View>
    </SafeAreaView>
  );
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

  scrollView: {
    alignItems: 'center',
    paddingBottom: 20,
  },

  buttonBottom: {
    marginBottom: 30,
  }

});
