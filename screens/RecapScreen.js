import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { removeAllIngredientToStore } from '../reducers/ingredient'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';

import Popover from "react-native-popover-view";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";
import RNPickerSelect from 'react-native-picker-select';

import Recap from "../components/Recap";

export default function RecapScreen({ navigation }) {

  const [showPopover, setShowPopover]=useState(false);
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.ingredient);
  const [slectOrigin, setSelectOrigin] = useState("");

  const handleShowPopover =() => {
    setShowPopover(true)
    // console.log('IF FALSE: ', showPopover)
}

  let listIngredients=<></>;
  if (ingredients.length > 0) {
    listIngredients= ingredients.map((data, i) => {
      return <Recap key={i} {...data}/>
    })
  };

  const handleReturn = () => {
    navigation.navigate("Kickoff")
  };

  const handleRemove = () => {
    setShowPopover(false);
    dispatch(removeAllIngredientToStore(ingredients));
  };

  const display =  (
    ingredients.length > 0 ?
      <View style={styles.popoverContainer}>
      <Text>Sure about removing them all ?!</Text>
      <View style={styles.removebtnContainer}>
        <TouchableOpacity style={styles.popoverCancelBtn} activeOpacity={0.8} onPress={() => setShowPopover(false)} >
            <FontAwesome name='times' size={22} color={css.activeIconColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.popoverValidBtn} activeOpacity={0.8} onPress={() => handleRemove()} >
            <FontAwesome name={'check'} size={22} color={'white'}/>
        </TouchableOpacity>
      </View>
    </View> :
      <View style={styles.popoverContainer}>
      <Text>No ingredients to remove again 😊</Text>
    </View>
  )

  const originRecipes = [
    { label: "All recipes", value: "All recipes" },
    { label: "France", value: "France" },
    { label: "Cambodia", value: "Cambodia" },
    { label: "Cuba", value: "Cuba" },
    { label: "Colombia", value: "Colombia" },
    { label: "Italy", value: "Italy" },
    { label: "Spain", value: "Spain" },
    { label: "Japan", value: "Japan" },
    { label: "India", value: "India" },
    { label: "Mexico", value: "Mexico" },
    { label: "Thailand", value: "Thailand" },
    { label: "Breakfast", value: "Breakfast" },
    { label: "Dessert", value: "Dessert" },
    { label: "Main Course", value: "Main Course" },
    { label: "Appetizer", value: "Appetizer" },
    { label: "Sweet", value: "Sweet" },
    { label: "Savory", value: "Savory" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
        	dataFlow={()=> handleReturn()}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>{ingredients.length === 1 ? 'Ingredient' : 'Ingredients'}</Text>
        <View>
        <Popover 
              placement= "floating"
              backgroundStyle={styles.popoverBackground}
              isVisible={showPopover}
              onRequestClose={()=> setShowPopover(false)}
              from={(
              <TouchableOpacity style={styles.favoriteButton} /*onPress={()=> {handleShowPopover();}}*/>
                <MySmallButton
                  dataFlow={()=> {handleShowPopover()}}
                  text={<FontAwesome name='times' size={25} color={css.activeIconColor} />}
                  buttonType={buttonStyles.buttonSmall}
                />
              </TouchableOpacity>
              )}>
              {display}
            </Popover>
        </View>
      </View>
      <View>
        <Text style={styles.textMenu}>1. Select your ingredients 🎯</Text>
        <View style={styles.separator}><Text><Text>--------------------------------------------------------------------------------------</Text></Text></View>
      </View>
      { ingredients.length === 0 && <Animatable.View animation="slideInDown" duration={700} style={styles.noIngredientsContainer}>
        <View style={styles.noIngredients}><Text>Go back to add your ingredients by 📸 or 🔎</Text><Text> Your futures recipes awaits you 🥘 !  </Text></View> 
      </Animatable.View>}
      <ScrollView contentContainerStyle={styles.galleryContainer}>
          {listIngredients}
      </ScrollView>
      <View>
        <Text style={styles.textMenu}>2. Choose your meal type 😋 </Text>
        <View style={styles.separator}><Text><Text>--------------------------------------------------------------------------------------</Text></Text></View>
        <View style={styles.difficultyBloc}>
                  <RNPickerSelect
                  onValueChange={(value) => setSelectOrigin(value)}
                  items={originRecipes}
                  // placeholder={{ label: "All recipes", value: "All recipes" }}
                  style={pickerSelectStyles} 
                  useNativeAndroidPickerStyle={false}
                  />
                </View>   
      </View>
      <View style={styles.buttonBottom}>
        <MyButton
			    dataFlow={()=>navigation.navigate('Result')}
			    text="Recipes >>"
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

  popoverBackground: {
    backgroundColor: 'transparent',
  },

  popoverContainer:{
    width:300,
    height:70,
    textAlign:'center',
    alignItems:'center',
    justifyContent:'center',
    paddingTop: '2%',
  },


  removebtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 100,
  },

  popoverCancelBtn:{
    flex: 0,
    margin: '2%',
    alignItems:'center',
    justifyContent:'center',
    borderRadius: 100,
    width: 30,
    height: 30,
    backgroundColor: css.backgroundColorTwo,
  },

  popoverValidBtn:{
    flex: 0,
    margin: '2%',
    alignItems:'center',
    justifyContent:'center',
    borderRadius: 100,
    width: 30,
    height: 30,
    backgroundColor: css.backgroundColorTwo,
  },

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  titlePage: {
    fontSize: css.fontSizeFive,
  },

  textMenu: {
    marginTop: '2%',
    fontSize: css.fontSizeSix,
  },

  separator: {
    height: 2,
    width: "90%",
    backgroundColor: "black",
    marginBottom: '3%',
  },

  noIngredientsContainer: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '50%',
  },

  noIngredients: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryContainer: {
    marginHorizontal: '7%',
  },

  buttonBottom: {
    marginBottom: 30,
  }

});
const pickerSelectStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  
  inputIOS: {
    marginLeft: '1%',
    width: 350,
    height: 40,
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    backgroundColor: 'white',
    color: 'black',
    marginBottom: '4%',
  },

  inputAndroid: {
    marginLeft: '2%',
    width: 350,
    height: 40,
    fontSize: 12,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    backgroundColor: 'white',
    color: 'black',
    marginBottom: '4%',
  },
})
