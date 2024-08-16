import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Modal } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import * as Unicons from '@iconscout/react-native-unicons';
import addressIp from "../modules/addressIp";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as Animatable from 'react-native-animatable';
import ListRecipes from "../components/ListRecipes";
import SearchRecipe from "../components/SearchRecipe";
import { useDispatch, useSelector } from "react-redux";
import {updateRecipeToStore,removeAllRecipeToStore,addRecipeToStore} from "../reducers/recipe";




export default function UserDashboardScreen({navigation}) {

  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const recipeSelect= useSelector((state)=>state.recipe.recipes)

  const [modalVisible, setModalVisible] = useState(false);
	const [searchRecipe, setSearchRecipe] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListRecipe, setDataListRecipe] = useState([]);
	const [validatedRecipe, setValidatedRecipe] = useState(false);


  const [foundRecipe, setFoundRecipe]= useState([])


// FETCH THE RECIPE ROUTE BY NAME 

const handleFetchRecipe = async (recipe) => {
		const response = await fetch(`http://${addressIp}:3000/recipes/recipeName`, {
      method:'POST',
      headers:{"Content-Type":"Application/json"},
      body:JSON.stringify({searchRecipe: recipe})
    });
		const data =  await response.json();

    console.log(data.recipe);

		if (data.result) {
			setDataListRecipe(data.recipe);
		} else {
			setDataListRecipe(data.error);
		}
    console.log('end')
	}

	useEffect(() => {
		if (searchRecipe.length > 0) {
			handleFetchRecipe(searchRecipe)
		}
	}, [searchRecipe]);

	

function onItemPress(data){
  
  console.log('test',dataListRecipe[0])
  //const votes= recipe.votes.length;
  //const note= recipe.votes.reduce((accumulator,current)=>accumulator+current.note,0)/votesTopRecipe;

  //navigation.navigate('Recipe', {data, note: note, votes: votes})
  if(modalRef.current){
    modalRef.current.animate('slideOutUp', 800).then(() => {
      setModalVisible(false);
      })
  }
}

  const recipeAll = async () => {
    try{
      const response = await fetch(`http://${addressIp}:3000/recipes/all`, {
        method:'POST',
        headers:{}
      });
      const data = await response.json();
      if (data.result) {
        setFoundRecipe(data.recipes);
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

  const sortRecipes = foundRecipe?.sort((a, b) => b.votes.length - a.votes.length ) || [];
  const topRecipe = sortRecipes[0]
  const votesTopRecipe = topRecipe?.votes.length;
  const noteTopRecipe = topRecipe?.votes.reduce((accumulator,current)=>accumulator+current.note,0)/votesTopRecipe;

  const latestRecipe = foundRecipe[foundRecipe.length-1];
  const votesLatestRecipe = latestRecipe?.votes.length;
  const noteLatestRecipe = latestRecipe?.votes.reduce((accumulator, current)=>accumulator+current.note,0)/votesLatestRecipe

  const renderVotesTopRecipe = (
  <View >
    <Text>{votesTopRecipe}</Text>
  </View>
)

const renderVotesLatestRecipe= (
  <View >
    <Text>{votesLatestRecipe}</Text>
  </View>
)

const topStars = [];
  for (let i = 0; i < 5; i++) {
    topStars.push(
      <FontAwesome
        key={i}
        name="star"
        size={25}
        color={i < noteTopRecipe ? "#d4b413" : "#9c9c98"}
      />
    );
  }

  const latestStars =[];
    for (let i=0; i < 5; i++) {
      latestStars.push(
        <FontAwesome 
        key={i}
        name="star"
        size={25}
        color={i < noteLatestRecipe ? "#d4b413" : "#9c9c98"}
        />
      )
    }

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
        <Unicons.UilCameraPlus size={60} color='black'/>
        </TouchableOpacity>
      </View>
      <View style={styles.lowerIcons}>
      
        <TouchableOpacity name='wishList' onPress={()=> navigation.navigate('Favorite')} >
          <Unicons.UilHeart style={styles.icons} size={40} color='#7f2727'/>
        </TouchableOpacity>
        <TouchableOpacity name='searchRecipe' onPress={()=> setModalVisible(true)}>
          <Unicons.UilSearch style={styles.icons} size={50} color='black'/>
        </TouchableOpacity>
        <TouchableOpacity name='Profile' onPress={()=> navigation.navigate('Profile')}>
          <Unicons.UilUser style={styles.icons} size={40} color='black'/>
        </TouchableOpacity>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Community</Text>

      </View>
      <View style={styles.lowerContainers}>
        <Text style={styles.title1}>Top Recipe</Text>
        <ScrollView style={styles.scrollView}>

          <View style={styles.topStars}>
            <Text>{topRecipe?.name}</Text>
            {topStars}
            {renderVotesTopRecipe}
          </View>
          {/* {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe[31].name}</Text>
            </View>
          )} */}
        <View style={styles.imageBlock}>
          <Image style={styles.topImage}>{topRecipe?.image}</Image>
        </View>
          {/* {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )} */}
        </ScrollView>
      </View>
      <View style={styles.lowerContainers}>
      <Text style={styles.title1}>Latest Recipe</Text>
        <ScrollView style={styles.scrollView}>
        {/* {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe.name}</Text>
            </View>
          )} */}
        <View style={styles.latestStars}>
          <Text>{latestRecipe?.name}</Text>
            {latestStars}
            {renderVotesLatestRecipe}
        </View>
        <View style={styles.imageBlock}>
        <Image style={styles.latestImage}>{latestRecipe?.image}</Image>
        </View>
          {/* {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )} */}

        </ScrollView>
      </View>
      <View style={styles.buttons}>
        <MyButton
          dataFlow={() => navigation.navigate("AddRecipe")}
          text={"ADD RECIPE ✍🏽"}
          buttonType={buttonStyles.buttonTwo}
        />
      </View>
      <Modal visible={modalVisible} animationtType="none" transparent>
       		 		<View style={styles.modal}>
       		 		    <Animatable.View
						ref={modalRef}
						animation="slideInUp"
						duration={700}   
						style={styles.modalBackgound}>
							<View style={styles.modalContainer}>

								<SearchRecipe
									searchRecipe={searchRecipe}
									setSearchRecipe={setSearchRecipe}
									setDataListRecipe={setDataListRecipe}
									clicked={clicked}
									setClicked={setClicked}
								/>
								
								<ListRecipes
								searchRecipe={searchRecipe}
								data={dataListRecipe}
								setClicked={setClicked}
								validatedRecipe={validatedRecipe}
								setValidatedRecipe={setValidatedRecipe}
								onItemPress={onItemPress}
								/>
							</View>
									
							<View style={styles.modalButtons}>
								<View style={styles.backRetour}>
									<MySmallButton 
										dataFlow={()=> {setModalVisible(false) ; setDataListRecipe([])}}
										text={'Go back'}
										buttonType={buttonStyles.buttonFour}
										setSearchRecipe={setSearchRecipe}
										setDataListRecipe={setDataListRecipe}
									/>
								</View>
								{/* <View style={styles.validButton}>
									<MySmallButton 
										dataFlow={()=> {handleSearch(); ; setDataListIngredient([])}}
										text={'Add'}
										buttonType={buttonStyles.buttonFour}
									/>
								</View> */}
							</View>
       		 		    </Animatable.View>
       		 		</View>
       			</Modal> 
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
  shadowOffset: { width: 3, height:10 }, // Shadow offset for iOS
  shadowOpacity: 2,          // Shadow opacity for iOS
  shadowRadius: 2,  
  marginBottom:0,           // Shadow radius for iOS

},

higherIcon: {
  flex:0.1,
  alignSelf:'center',
  height:20,
  marginBottom:10,
 
},
lowerIcons:{
  flex:0.1,
  width:'100%',
  flexDirection: 'row',
  justifyContent:'space-around',
  marginBottom:0,

},
titleBlock:{
  flex:0,
  width:'100%',
  marginBottom:5,
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
topStars: {
  flexDirection: "row",

},
latestStars: {
  flexDirection: "row",
},

imageBlock:{
  flex:0.2,
  width:'97%',
  marginHorizontal:'auto',
  height:130,
  backgroundColor:'transparent',
  borderRadius:9,
  borderWidth:2,
},
topImage:{
  width:'100%',
  height:'100%',
  objectFit:'contain'
},
latestImage:{
  width:'100%',
  height:'100%',
  objectFit:'contain'
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
modalBackgound: {
  flex: 1,
  paddingTop:'30%',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  height: '100%',
},

modal: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},

modalContainer: {
  flex: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: css.backgroundColorOne,
  borderRadius: 20,
  height: 310,
  width:350,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  marginBottom: 15,
},

modalButtons: {
  flex: 0, 
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '60%',
},

validButton: {
marginBottom: 20,
},

searchRecipe: {
flex: 0,
alignItems: 'center',
marginBottom: 20,
width: '80%',
borderWidth: 1,
borderColor: 'grey',
backgroundColor: 'rgba(255,255,255, 0.6)',
},
})