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
import { useFocusEffect } from "@react-navigation/native";




export default function UserDashboardScreen({navigation}) {

  const [modalVisible, setModalVisible] = useState(false);
	const [searchRecipe, setSearchRecipe] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListRecipe, setDataListRecipe] = useState([]);
  const [recipes, setRecipes]= useState([])

  const modalRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen is focused');
      recipeAll(); 
      return () => {
        console.log('Screen is unfocused');
      };
    },[])
  )

  useEffect(() => {
		if (searchRecipe.length > 0) {
			handleFetchRecipe()
		}
	}, [searchRecipe]);


  async  function  fetchImageUrl(recipeName,recipeDate) {
    try {
      const date = new Date(recipeDate).getTime();
      const response = await fetch(`https://cookez-backend.vercel.app/download/${recipeName}_${date}`);
      const data = await response.json();
      if (data.result ) {
        return  data.imageUrl;
      } else {
        console.error('Error fetching image:', data.error);
      }
    } catch (error) {
      console.error('Fetch image error:', error);
    }
    return null;
  };


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


  const recipeAll = async () => {
    try{
      console.log('UPDATE')
      const response = await fetch(`https://cookez-backend.vercel.app/recipes/all`, {
        method:'POST',
        headers:{}
      });
      if (!response.ok) {
        throw new Error(`${response.text()}`);
      }
      const data = await response.json();
      if (data.result) {
        // Utilise Promise.all pour attendre la résolution de toutes les promesses de fetchImageUrl
        const dataRecipes = await Promise.all(
          data.recipes.map(async (e)=>{
            const url= await fetchImageUrl(e.name,e.date);
            return {...e,url:url}
        }));
        setRecipes(dataRecipes);
      }
    } catch (error) {
      console.error( error.message);
    }
  }

  
  function onItemPress(props){
    const votes = props?.votes;
    const note= props?.votes.reduce((accumulator,current)=>accumulator+current.note,0)/votes.length;
    if(modalRef.current){
      modalRef.current.animate('slideOutUp', 800).then(() => {
        setModalVisible(false);
        navigation.navigate('Recipe', { props, note: note, votes: votes})
        })
    }
  }
  

    /// list des top recipes
  const listTopRecipes=recipes.sort((a, b) =>
      ((b.votes.reduce((acc, curr) => acc + curr.note, 0) / b.votes.length)   
        - (a.votes.reduce((acc, curr) => acc + curr.note, 0) / a.votes.length)) 
        && (b.votes.length - a.votes.length) ).slice(0,5)
  .sort((a, b) => ((b.votes.reduce((acc, curr) => acc + curr.note, 0) / b.votes.length) 
      - (a.votes.reduce((acc, curr) => acc + curr.note, 0) / a.votes.length)))
  .map((data,i)=>{
      
      const noteTopRecipe = data?.votes.reduce((accumulator,current)=>accumulator+current.note,0)/data?.votes.length;
      const topStars = [];
      for (let i = 0; i < 5; i++) {
        topStars.push(
          <FontAwesome
            key={i}
            name="star"
            size={15}
            color={i < noteTopRecipe ? "#d4b413" : "#9c9c98"}
          />
        );
      }

      return (
        <TouchableOpacity 
              key={i}
              style={styles.recipeTopContainer} 
              onPress={() => { navigation.navigate('Recipe', {props:data, note: noteTopRecipe, votes: data.votes })}}
            > 
            <ScrollView style={styles.scrollView}>

              <View style={styles.topStars}>
                <Text>{data?.name}</Text>
                <View style={styles.topStars}>
                  {topStars}
                  <Text>{data?.votes.length}</Text>
                </View>
              </View>
              <View style={styles.imageBlock}>
              {imageRecipe[`${data?.picture}`]? 
                      <Image style={styles.topImage} source={ imageRecipe[`${data?.picture}`]}/>:
                      <Image style={styles.topImage} source={{ uri: data.url} }/>}
              </View>
            </ScrollView>
        </TouchableOpacity>
      )
  })
  
  
  /// list des dernieres recettes
  const listLatestRecipes=[...recipes].reverse().slice(0,5).map((latestRecipe,i)=>{
    
    const noteLatestRecipe = latestRecipe?.votes.reduce((accumulator, current)=>accumulator+current.note,0)/latestRecipe?.votes.length;
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
      <TouchableOpacity
              key={i} 
              style={styles.recipeLatestContainer} 
              onPress={() => { navigation.navigate('Recipe', {props:latestRecipe, note: noteLatestRecipe, votes: latestRecipe.votes})}}
              > 
              <Text style={styles.title1}>{latestRecipe?.name}</Text>
              <ScrollView style={styles.scrollView}>
                <View style={styles.latestStars}>
                  <Text>{latestRecipe?.preparationTime}min</Text>
                  <View style={styles.latestStars}>
                    {latestStars}
                    <Text>{latestRecipe?.votes.length}</Text>
                  </View>
                </View>
                <View style={styles.imageBlock}>
                {imageRecipe[`${latestRecipe?.picture}`]? 
                        <Image style={styles.latestImage} source={ imageRecipe[`${latestRecipe?.picture}`]}/>:
                        <Image style={styles.latestImage} source={{ uri: latestRecipe?.url } }/>}
                </View>
              </ScrollView>
      </TouchableOpacity>
    )
  })
  
    
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
      
      <View style={styles.lowerContainers}>
      
        <ScrollView style={styles.scrollLowerContainer}>
          <Text style={styles.title}>Top Recipe</Text>
          <ScrollView horizontal={true} style={styles.scrollTopRecipeContainer} >
            {listTopRecipes}
          </ScrollView>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Community</Text>
          </View>
          <View style={styles.latestContainer}>
            {listLatestRecipes}
          </View>
        </ScrollView>
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
							</View>
       		 		    </Animatable.View>
       		 		</View>
       			</Modal> 
    </View>
  )
}

const styles = StyleSheet.create({

  container:{
    width:"100%",
    height:'100%',
    backgroundColor: css.backgroundColorOne,
    paddingTop:'15%',
    alignItems:'center',
    justifyContent:'space-around'
  },

  logoBanner:{
    width:'80%',
    height:'12%',
    alignItems:'center',
    justifyContent:'center',
    shadowColor:'#000',
    shadowOffset: { width: 3, height:10 }, // Shadow offset for iOS
    shadowOpacity: 2,          // Shadow opacity for iOS
    shadowRadius: 2,  // Shadow radius for iOS
    marginBottom:0,
    //elevation:32,           
  },

  logo:{
    width:'100%',
    height:'100%',
    resizeMode:'contain',
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
    marginBottom:10,
  },

  titleBlock:{
    width:'100%',
    marginBottom:5,
  },

  title:{
    textAlign:'center',
    fontSize:30,
    color:'white',
    fontWeight: "bold",
    fontFamily: css.fontFamilyOne,
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


  lowerContainers:{
    backgroundColor:css.backgroundColorTwo,
    flexGrow:1,//autorise l'element a granfir si de l'espace est disponible
    flexShrink:1,//autorise l'element a retrecir si overflow
    width:'100%',
    marginHorizontal:'auto',
    padding:2,
    paddingTop:4,
    borderWidth:4,
    borderTopLeftRadius:30,
    borderTopRightRadius:30,
    borderBottomWidth:3,
    borderColor:'white',
    shadowOffset: { width: 0, height:8 }, // Shadow offset for iOS
    shadowOpacity: 0.8,          // Shadow opacity for iOS
    shadowRadius: 3,   // Shadow radius for iOS
    elevation:5,
  },

  scrollLowerContainer:{
    width:'100%',
  },

  scrollTopRecipeContainer:{
    marginTop:10,
  },

  recipeTopContainer:{
    backgroundColor:'white',
    paddingTop:10,
    borderRadius:10,
    marginLeft:10,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 },  
    shadowOpacity: 0.2,
    shadowRadius: 4.65,  
    elevation:5,
  },

  topStars: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  latestStars: {
    flexDirection: "row",
    justifyContent:'space-between'
  },

  imageBlock:{
    width:'100%',
    height:130,
    backgroundColor:'white',
    borderBottomLeftRadius:10,
    borderBottomRightRadius:10,
    overflow:'hidden',//masque les bords de l'image contenu dans l'element
  },

  topImage:{
    width:'100%',
    height:'100%',
    resizeMode:'cover',
  },

  latestImage:{
    width:'100%',
    height:'100%',
    resizeMode:'cover'
  },

  latestContainer:{
    width:'100%',
    alignItems:'center',
  },

  recipeLatestContainer:{
    width:'98%',
    backgroundColor:'white',
    padding:10,
    borderRadius:20,
    marginBottom:10,
  },

  buttons:{
    height:'13%',
    justifyContent:'center',
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
    shadowOffset: {width: 0, height: 2},
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