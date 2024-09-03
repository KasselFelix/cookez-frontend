import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Modal } from "react-native";
import imageRecipe from "../modules/images";
import React, { useEffect, useRef, useState, useCallback } from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import * as Unicons from '@iconscout/react-native-unicons';
import addressIp from "../modules/addressIp";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as Animatable from 'react-native-animatable';
import ListRecipes from "../components/ListRecipes";
import SearchRecipe from "../components/SearchRecipe";
import { useDispatch, useSelector } from "react-redux";
import recipe, {updateRecipeToStore,removeAllRecipeToStore,addRecipeToStore} from "../reducers/recipe";
import { useFocusEffect } from "@react-navigation/native";




export default function UserDashboardScreen({navigation}) {

  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const recipeSelect= useSelector((state)=>state.recipe.recipes)


  const [topRecipe,setTopRecipe]=useState(null);
  const [latestRecipe,setLatestRecipe]=useState(null);
  const [imageUrlLatest, setImageUrlLatest] = useState(null);
  const [imageUrlTop, setImageUrlTop] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
	const [searchRecipe, setSearchRecipe] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListRecipe, setDataListRecipe] = useState([]);
	//const [validatedRecipe, setValidatedRecipe] = useState(false);


  const [foundRecipe, setFoundRecipe]= useState([])


  const fetchImageUrl = async (recipeName,recipeDate,setImageUrl) => {
    try {
      const date = new Date(recipeDate).getTime();
      const response = await fetch(`https://cookez-backend.vercel.app/download/${recipeName}_${date}`);
      const data = await response.json();
      if (data.result) {
        setImageUrl(data.imageUrl)
      } else {
        console.error('Error fetching image:', data.error);
      }
    } catch (error) {
      console.error('Fetch image error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Screen is focused');
      recipeAll(); 
      return () => {
        console.log('Screen is unfocused');
      };
    },[])
  )


// FETCH THE RECIPE ROUTE BY NAME 

const handleFetchRecipe = async () => {
		const response = await fetch(`https://cookez-backend.vercel.app/recipes/recipeName`, {
      method:'POST',
      headers:{"Content-Type":"Application/json"},
      body:JSON.stringify({name: searchRecipe})}
    );
		const data =  await response.json();


		if (data.result) {
			setDataListRecipe(data.recipe);
		} else {
			setDataListRecipe(data.error);
		}
	}

	useEffect(() => {
		if (searchRecipe.length > 0) {
			handleFetchRecipe()
		}
	}, [searchRecipe]);

	

  function onItemPress(props){
    
    const votes = props?.votes.length;
    const note= props?.votes.reduce((accumulator,current)=>accumulator+current.note,0)/votes;
    if(modalRef.current){
      modalRef.current.animate('slideOutUp', 800).then(() => {
        setModalVisible(false);
        navigation.navigate('Recipe', { props, note: note, votes: votes})
        })
    }

  }

  const recipeAll = async () => {
    try{
      console.log('UPDATE')
      const response = await fetch(`https://cookez-backend.vercel.app/recipes/all`, {
        method:'POST',
        headers:{}
      });
      const data = await response.json();
      if (data.result) {
        setFoundRecipe(data.recipes);
        const sortRecipes = data.recipes.sort((a, b) => b.votes.length - a.votes.length ) || [];
        const top=sortRecipes[0];
        const latest= data.recipes[data.recipes.length-1];
        setTopRecipe(top);
        setLatestRecipe( latest)
        fetchImageUrl(top?.name,top?.date,setImageUrlTop);
        fetchImageUrl(latest?.name,latest?.date,setImageUrlLatest);
      }
    } catch (error) {
      console.error('error fetching data 🧐', error);
      alert('error', error);
    }
  }

  


//retrieve 'votes'
  const noteTopRecipe = topRecipe?.votes.reduce((accumulator,current)=>accumulator+current.note,0)/topRecipe?.votes.length;

  const noteLatestRecipe = latestRecipe?.votes.reduce((accumulator, current)=>accumulator+current.note,0)/latestRecipe?.votes.length;

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
          source={require("../assets/logo/cookez_logo.png")}
           alt="logo" accessibilityLabel="logo"
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
        <TouchableOpacity 
          style={styles.recipeContainer} 
          onPress={() => { navigation.navigate('Recipe', {props:topRecipe, note: noteTopRecipe, votes: topRecipe.votes })}}
        > 
        <Text style={styles.title1}>Top Recipe</Text>
        <ScrollView style={styles.scrollView}>

          <View style={styles.topStars}>
            <Text>{topRecipe?.name}</Text>
            <View style={styles.topStars}>
              {topStars}
              <Text>{topRecipe?.votes.length}</Text>
            </View>
          </View>
          {/* {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe[31].name}</Text>
            </View>
          )} */}
        <View style={styles.imageBlock}>
        {imageRecipe[`${topRecipe?.picture}`]? 
                <Image style={styles.topImage} source={ imageRecipe[`${topRecipe?.picture}`]}/>:
                <Image style={styles.topImage} source={{ uri: imageUrlTop  || null} }/>}
        </View>
          {/* {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )} */}
        </ScrollView>
        </TouchableOpacity>
      </View>
      <View style={styles.lowerContainers}>
         <TouchableOpacity 
          style={styles.recipeContainer} 
          onPress={() => { navigation.navigate('Recipe', {props:latestRecipe, note: noteLatestRecipe, votes: latestRecipe.votes})}}
          > 
      <Text style={styles.title1}>Latest Recipe</Text>
        <ScrollView style={styles.scrollView}>
        {/* {foundRecipe.length > 0 && (
            <View>
              <Text style={styles.recipe}>{foundRecipe.name}</Text>
            </View>
          )} */}
        <View style={styles.latestStars}>
          <Text>{latestRecipe?.name}</Text>
          <View style={styles.latestStars}>
            {latestStars}
            <Text>{latestRecipe?.votes.length}</Text>
          </View>
        </View>
        <View style={styles.imageBlock}>
        {imageRecipe[`${latestRecipe?.picture}`]? 
                <Image style={styles.latestImage} source={ imageRecipe[`${latestRecipe?.picture}`]}/>:
                <Image style={styles.latestImage} source={{ uri: imageUrlLatest  || null} }/>}
        </View>
          {/* {votes.length > 0 ?(
            votes.map((note, index) =>(
              <Text style={styles.votes} key={index}>Note:{note}</Text>
            ))
          ) : (
            <Text style={styles.votes}>No votes available</Text>
          )} */}

        </ScrollView>
        </TouchableOpacity>
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
								//validatedRecipe={validatedRecipe}
								//setValidatedRecipe={setValidatedRecipe}
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
  paddingTop:'15%',
  alignItems:'center'
},

logoBanner:{
  width:'80%',
  height:'12%',
  alignItems:'center',
  justifyContent:'center',
},


logo:{
  width:'100%',
  height:'100%',
  objectFit:'contain',
  shadowColor:'#000',
  shadowOffset: { width: 3, height:10 }, // Shadow offset for iOS
  shadowOpacity: 2,          // Shadow opacity for iOS
  shadowRadius: 2,  
  marginBottom:0,           // Shadow radius for iOS
  elevation:5,
},

higherIcon: {
  alignSelf:'center',
  height:'7%',
  marginBottom:10, 
},

lowerIcons:{
  width:'100%',
  flexDirection: 'row',
  justifyContent:'space-around',
  marginBottom:0,
},
titleBlock:{
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
  justifyContent: "space-between"
},
latestStars: {
  flexDirection: "row",
  justifyContent:'space-between'
},

imageBlock:{
  width:'97%',
  marginHorizontal:'auto',
  height:130,
  backgroundColor:'white',
  borderRadius:9,
  borderWidth:2,
},

topImage:{
  width:'100%',
  height:'100%',
  resizeMode:'cover'
},
latestImage:{
  width:'100%',
  height:'100%',
  resizeMode:'cover'
},

lowerContainers:{
  backgroundColor:css.backgroundColorTwo,
  borderWidth:2,
  width:'98%',
  borderRadius:15,
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

backRetour:{
  width:'100%',
  alignItems:'center',
}
})