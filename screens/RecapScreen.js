import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { removePhoto} from '../reducers/ingredient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import MyButton from "../modules/MyButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";


//{"confidence": 0.9998, "food_info": {"display_name": "Banana", "food_id": "f6ae02c12ed752bcdf92060492cf6572", "fv_grade": "A", "g_per_serving": 100, "nutrition": {"alcohol_100g": 0, "calcium_100g": 0.00447, "calories_100g": 92.8, "carbs_100g": 20, "chloride_100g": null, "cholesterol_100g": 0.000065, "copper_100g": null, "fat_100g": 0.2, "fibers_100g": 3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "lories_100g": 92.8, "carbs_100g": 20, "chloride_100g": null, "cholesterol_100g": 0.000065, "copper_100g": null, "fat_100g": 0.2, "fibers_100g": 3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "3.1, "glycemic_index": 45, "insat_fat_100g": 0.0922, "iodine_100g": null, "iron_100g": 0.000281, "magnesium_100g": 0.0328, "manganese_100g": null, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "l, "mono_fat_100g": 0.0184, "omega_3_100g": 0.0263, "omega_6_100g": 0.039282, "phosphorus_100g": 0.0175, "poly_fat_100g": 0.0738, "polyols_100g": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, ": null, "potassium_100g": 0.411, "proteins_100g": 1.2, "salt_100g": null, "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, ", "sat_fat_100g": 0.0616, "selenium_100g": null, "sodium_100g": 0.001, "sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_10sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamin_c_100g": 0.00654, "vitamin_d_100g": null, "vitamin_e_100g": null, "vitamin_k1_100g": null, "water_100g": null, "zinc_100g": null}}, "ingredients": [], "quantity": 100}
// sugars_100g": 15.9, "veg_percent": 1, "vitamin_a_beta_k_100g": null, "vitamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamtamin_a_retinol_100g": null, "vitamin_b12_100g": null, "vitamin_b1_100g": null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_10: null, "vitamin_b2_100g": null, "vitamin_b3_100g": null, "vitamin_b5_100g": null, "vitamin_b6_100g": null, "vitamin_b9_100g": 0.0000229, "vitamin_c_100g": 0.00654, "vitamin_d_100g": null, "vitamin_e_100g": null, "vitamin_k1_100g": null, "water_100g": null, "zinc_100g": null}}, "ingredients": [], "quantity": 100}


export default function RecapScreen({navigation}) {
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.value);

  //food_info.display_name
  const listIngredients=<></>;
  if(ingredients.length>0){
    listIngredients=ingredients.map((e,i)=>{
      console.log('ok')
      return <View key={i}>
        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={() => dispatch(removeIngredient(e))}>
            <FontAwesome name='times' size={20} color='red' style={styles.deleteIcon} />
          </TouchableOpacity>
          <Image source={{ uri: e.photo }} style={styles.photo} />
          </View>
          <Text>{e.data.display_name}</Text>
          <Text>{e.data.g_per_serving}g</Text>
        </View>;
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ingredients</Text>
      <ScrollView contentContainerStyle={styles.galleryContainer}>
          {listIngredients}
      </ScrollView>
      <MyButton
			dataFlow={()=>navigation.navigate('Result')}//handleBtn()}
			text={">>"}
			buttonType={buttonStyles.buttonTwo}
		  />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  galleryContainer: {
    width:'80%',
    alignSelf:'center'
  },
  photoContainer: {
    alignItems: 'flex-start',
    width:'100%'
  },
  photo: {
    margin: 10,
    width: 50,
    height: 50,
  },
  title: {
    fontFamily: 'Futura',
    alignSelf:'center',
    fontSize: 22,
    marginTop: 10,
    marginBottom: 10,
  },
  deleteIcon: {
    marginRight: 10,
  },
  text: {
    marginBottom: 15,
  },
});
