import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import * as Unicons from '@iconscout/react-native-unicons';
import addressIp from "../modules/addressIp";



export default function UserDashboardScreen({navigation}) {

  const [foundRecipe, setFoundRecipe]= useState([])

  const recipeAll = async () => {
    try{
      const response = await fetch(`http://${addressIp}:3000/recipes/all`, {
        method:'POST',
        headers:{}
      });
      const data = await response.json();
      if (data.result) {
        setFoundRecipe(data.recipes);
        console.log('fetched recipes', data.recipes);
      }
    } catch (error) {
      console.error('error fetching data 🧐', error);
      alert('error', error);
  }
}

  useEffect(()=> {
    
    recipeAll(); 
  }, [])
// map on 'foundRecipe' to retrieve 'votes'
  const votes = foundRecipe?.votes?.map(e=>e.note) || [];



  return (

    <View style={styles.container}>
      <View style={styles.logoBanner}>
       <Image
          style={styles.logo}
          source={require("../assets/logo/cookez logo.png")}
        />
      </View>
      <View style={styles.higherIcon}>
        <TouchableOpacity onPress={()=> navigation.navigate('Kickoff')}>
        <Unicons.UilCameraPlus size={60} color='white'/>
        </TouchableOpacity>
      </View>
      <View style={styles.lowerIcons}>

        {/* INSERT THE POPOVER FOR LOOKING FOR A RECIPE */}

        <TouchableOpacity name='wishList'>
          <Unicons.UilHeart style={styles.icons} size={40} color='white'/>
        </TouchableOpacity>
        <TouchableOpacity name='searchRecipe' onPress={()=> navigation.navigate('Kickoff')}>
          <Unicons.UilSearch style={styles.icons} size={50} color='white'/>
        </TouchableOpacity>
        <TouchableOpacity name='Profile'>
          <Unicons.UilUser style={styles.icons} size={40} color='white'/>
        </TouchableOpacity>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Community</Text>

      </View>
      <View style={styles.lowerContainers}>
        <Text style={styles.title1}>Top Recipe</Text>
        <ScrollView style={styles.scrollView}>
      
          {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe[31].name}</Text>
            </View>
          )}
        <View style={styles.imageBlock}>

        </View>
          {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )}
        </ScrollView>
      </View>
      <View style={styles.lowerContainers}>
      <Text style={styles.title1}>Latest Recipe</Text>
        <ScrollView style={styles.scrollView}>
        {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe[15].name}</Text>
            </View>
          )}
        <View style={styles.imageBlock}>

        </View>
          {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )}

        </ScrollView>
      </View>
      <View style={styles.buttons}>
        <MyButton
          dataFlow={() => navigation.navigate("AddRecipe")}
          text={"ADD RECIPE ✍🏽"}
          buttonType={buttonStyles.buttonTwo}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor: css.backgroundColorOne,
},


logo:{
  alignItems:'center',
  margin:0,
  width:390,
  height:115,
  objectFit:'contain',
  alignSelf:'center',
  marginTop:'18%',
  marginBottom:15,
  shadowOffset: { width: 0, height:8 }, // Shadow offset for iOS
  shadowOpacity: 0.8,          // Shadow opacity for iOS
  shadowRadius: 3,  
  marginBottom:0,           // Shadow radius for iOS

},

higherIcon: {
  flex:0.1,
  alignSelf:'center',
  height:20,
 
},
lowerIcons:{
  flex:0.1,
  width:'100%',
  flexDirection: 'row',
  justifyContent:'space-around',
  marginBottom:10,

},
titleBlock:{
  flex:0,
  width:'100%',
  marginBottom:19,
},
title:{
  textAlign:'center',
  fontSize:30,
},
title1:{
  textAlign:'center',
  fontSize:18,
},
recipe:{
  paddingHorizontal:6,
},
votes:{
  paddingHorizontal:6,
},
imageBlock:{
  flex:0.2,
  width:'97%',
  marginHorizontal:'auto',
  height:130,
  backgroundColor:css.iconColor,
  borderRadius:9,
  borderWidth:2,
},

lowerContainers:{
  flex:0.333,
  backgroundColor:css.backgroundColorTwo,
  borderWidth:2,
  width:'98%',
  borderRadius:'10%',
  marginHorizontal:'auto',
  padding:2,
  marginBottom:10,
  shadowOffset: { width: 0, height:8 }, // Shadow offset for iOS
  shadowOpacity: 0.8,          // Shadow opacity for iOS
  shadowRadius: 3,  
},
buttons:{

},
})