import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";

import Recap from "../components/Recap";

export default function RecapScreen({ navigation }) {
  
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.ingredient);

  // useEffect(()=>{
  //   dispatch(removeAllIngredientToStore())
  //   return ;
  // },[])

  let listIngredients=<></>;
  if(ingredients.length>0){
    listIngredients= ingredients.map((data, i) => {
      console.log('props',data)
      return <Recap key={i} {...data}/>
    })
  }

  const handleReturn = () => {
    navigation.navigate("Kickoff")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
        	dataFlow={()=> handleReturn()}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>{ingredients.length > 1 ? 'Ingredients' : 'Ingredient'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.galleryContainer}>
          {listIngredients}
      </ScrollView>
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
    backgroundColor: css.backgroundColorOne,
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
