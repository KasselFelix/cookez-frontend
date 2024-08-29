import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, ScrollView, View, Image, Text, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { Camera, CameraType, FlashMode } from "expo-camera/legacy";
import { useDispatch, useSelector } from "react-redux";
import { addIngredientToStore } from "../reducers/ingredient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useIsFocused } from "@react-navigation/native";

import addressIp from "../modules/addressIp";
import ListIngredients from "../components/ListIngredients";
import SearchIngredients from "../components/SearchIngredients";
import MySmallButton from "../components/MySmallButton";
import MyButton from '../components/MyButton';
import buttonStyles from '../styles/Button';
import css from "../styles/Global";
import * as Animatable from 'react-native-animatable';

export default function KickoffScreen({navigation}) {
  	const saveMoney=false;
	const API_KEY="3bJ5BKRL.zWoKPci3XQUszxDUlGKYGePe6ZlLFrYk";//A securiser dans app.json


	//camera
  	const [hasPermission, setHasPermission] = useState(false);
  	const [type, setType] = useState(CameraType.back);
  	const [flashMode, setFlashMode] = useState(FlashMode.off);


  	const [pictures, setPictures] = useState([]);
  	const [modalVisible, setModalVisible] = useState(false);
	const [searchInput, setSearchInput] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListIngredient, setDataListIngredient] = useState([]);
	const [validatedIngredient, setValidatedIngredient] = useState([]);
	
	const ingredients=  useSelector((state)=>state.ingredient.ingredient)
	
  	const dispatch = useDispatch();
  	const isFocused = useIsFocused();
	const [imageUrl, setImageUrl] = useState(null);
  	let cameraRef = useRef(null);
	const modalRef = useRef(null);

  	const background = [];

	  useEffect(() => {
		(async () => {
			const result = await Camera.requestCameraPermissionsAsync();
			if(result){
			   setHasPermission(result.status === 'granted');
			 }
		  })();
  
	},[]);

	// useEffect(() => {
    // const getData = async () => {
    //   const apiResponse = await fetch(
    //     "https://my-json-server.typicode.com/kevintomas1995/logRocket_searchBar/languages"
    //   );
    //   const data = await apiResponse.json();
    //   setListIngredient(data);
    // };
    // getData();
    // }, []);

	const handleFetchIngredients = async () => {
		const response = await fetch(`http://${addressIp}:3000/ingredients/${searchInput}`);
		const data =  await response.json();
		if (data.result) {
			//console.log('search',data);
			setDataListIngredient(data.ingredients.map((e, i) => {return {id: i, name: e.name, display_name: e.name, photo: e.image, g_per_serving: e.quantity, nutrition: e.nutrition }}));
			//console.log('datalist: ', dataListIngredient)
		} else {
			setDataListIngredient(data.error);
		}
	}

	useEffect(() => {
		if (searchInput.length > 0) {
			handleFetchIngredients()
		}
	}, [searchInput]);

	//en cours de dev pour afficher la photo apres recherche
	// const fetchImageFromUnsplash = async (ingredientName) => {
	// 	try {
	// 		const response = await fetch(`https://api.unsplash.com/search/photos?query=${ingredientName}&client_id=jtpouSnBgNG5G1d0xNZhOXdrd5fyMN-BfcPWG_0uQMQ`);
	// 		const data = await response.json();
	// 		if (data.results && data.results.length > 0) {
	// 			setImageUrl(data.results[0].urls.small);
	// 			setPictures([...pictures, imageUrl])
	// 		} else {
	// 			console.error("No image found");
	// 		}
	// 	} catch (error) {
	// 		console.error("Error fetching image from Unsplash", error);
	// 	}
	//   };


	function handleBtn () {
		if(!saveMoney){
			for (let imagePath of pictures){
				// Make the request
				// if(!imagePath.includes("https://images.unsplash.com/")){
				const handleFetch = async (cpt=0)=>{
					try{						
						//Create FormData	
						const formData = new FormData();
						formData.append('image', {
							uri: imagePath,
							type: 'image/jpeg',
							name: `image${cpt++}.jpg`,
						});
							const response= await fetch("https://vision.foodvisor.io/api/1.0/en/analysis", {
										method: 'POST',
										headers: {
										'Authorization': `Api-Key ${API_KEY}`,
										'Content-Type': 'multipart/form-data',
										},
										body: formData});
							if (response.ok) {
								const data = await response.json();
								if(data){
									if (data.items && data.items.length > 0 && data.items[0].food.length > 0) {
										// console.log('NOW: ', data.items[0].food[0]);
										dispatch(addIngredientToStore({photo:imagePath, data:data.items[0].food[0].food_info}))
									}
								}else{
									// console.log('no data')
								}

							  } else {
								throw new Error(`HTTP status ${response.status}`);
							  }						
					}catch(error){
						console.error('Something bad happened:', error);
					}
				}
				handleFetch();	 
			// }
			}
		}
		navigation.navigate('Recap')
	};

	const takePicture = async () => {
		const photo = await cameraRef.takePictureAsync({ quality: 0.3 });
		if (photo) {
			setPictures([...pictures, photo.uri])
		}else{
			alert('Your photo was not taken well, Try to retake it pls 👏')
		}

	};

	
	//CAMERA
	if (!hasPermission || !isFocused) {
		return (
		  <View style={styles.container}>
			<View style={styles.cameraContainer}> 
			</View>
		  </View>
		)
	  }
	

	const photos = pictures.map((data, i) => {
		return (
		  <View key={i} style={styles.photoContainer}>
			<View style={styles.deleteIcon}>
				<TouchableOpacity onPress={() => {
					let copyPictures = pictures.filter(e=>e!==data);
					setPictures(copyPictures)
					}}>
				  <FontAwesome name='times' size={20} color={css.activeIconColor}/>
				</TouchableOpacity>
			</View>
			<Image source={{ uri: data }} style={styles.photo} />
		  </View>
		);
	  });

	const backgroundIngredient = () => {
		for (let i = pictures.length; i < 3; i++) {
				background.push(<View key={i} style={sytle=styles.addPicturesContainer}>
					<FontAwesome name="camera-retro" size={70} color="rgba(255,255,255, 0.4)" />
					<Text style={styles.text}>Ingredient</Text>
				</View>);	
				
		}	
		return  background;
	}

	// function onItemPress(data){
	// 	//fetchImageFromUnsplash (data.name)
	// 	setValidatedIngredient([...validatedIngredient,data.id])
	// 	//dispatch(addIngredientToStore({photo:imageUrl ,data: {display_name: data.name, g_per_serving: data.g_per_serving, nutrition: data.nutrition }}))
	// 	dispatch(addIngredientToStore({photo: data.photo, data: {display_name: data.name, g_per_serving: data.g_per_serving, nutrition: data.nutrition }}))
	// 	if(modalRef.current){
	// 		modalRef.current.animate('slideOutUp', 800).then(() => {
	// 			setModalVisible(false);
	// 	  	})
	// 	}
	// }

	function onItemPress(data){
		setValidatedIngredient([...validatedIngredient,data.id])
		dispatch(addIngredientToStore({photo: data.photo, data: {display_name: data.name, g_per_serving: data.g_per_serving, nutrition: data.nutrition }}))
	}

	const handleAddIngredient = () => {
		setSearchInput("");
		if(modalRef.current){
			modalRef.current.animate('slideOutUp', 800).then(() => {
			setModalVisible(false);
			setDataListIngredient([]);
			setValidatedIngredient([])
		  	})
		}
	}

	// const handleAddIngredient = () => {
	// 	dispatch(addIngredientToStore({photo: dataListIngredient[0].photo, data: {display_name: dataListIngredient[0].name, g_per_serving: dataListIngredient[0].g_per_serving, nutrition: dataListIngredient[0].nutrition }}));
	// 	console.log('reducer',ingredients)
	// }

	

	const handleGoBack = () => {
		setSearchInput("");
		if(modalRef.current){
			modalRef.current.animate('slideOutUp', 800).then(() => {
			setModalVisible(false);
			setDataListIngredient([]);
		  	})
		}
	}

	const displayAddedIngredients = () => {
		const nameIngredientsAdded = ingredients.map((e, i) => e.data.display_name)
		return nameIngredientsAdded.join(', ');
	}
	
  	return (
		  <View style={styles.container} >
			<Modal visible={modalVisible} animationtType="none" transparent>
					<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.key}>

       		 		<View style={styles.modal}>
       		 		    <Animatable.View
						ref={modalRef}
						animation="slideInUp"
						duration={700}   
						style={styles.modalBackgound}>
							<View style={styles.modalContainer}>

								<SearchIngredients
									searchInput={searchInput}
									setSearchInput={setSearchInput}
									setDataListIngredient={setDataListIngredient}
									clicked={clicked}
									setClicked={setClicked}
								/>
								
								<ListIngredients
								searchInput={searchInput}
								data={dataListIngredient}
								setClicked={setClicked}
								validatedIngredient={validatedIngredient}
								setValidatedIngredient={setValidatedIngredient}
								onItemPress={onItemPress}
								/>
							</View>
									
							<View style={styles.modalButtons}>
								<View style={styles.backRetour}>
									<MySmallButton 
										dataFlow={()=> {handleGoBack()}}
										text={'Go back'}
										buttonType={buttonStyles.buttonFour}
										setSearchInput={setSearchInput}
										setDataListIngredient={setDataListIngredient}
									/>
								</View>
								<View style={styles.validButton}>
									<MySmallButton 
										dataFlow={()=> {handleAddIngredient()}}
										text={'Add'}
										buttonType={buttonStyles.buttonFour}
									/>
								</View>
							</View>
       		 		    </Animatable.View>
       		 		</View>
					</KeyboardAvoidingView>
       			</Modal>
			<View style={styles.cameraContainer}> 
				<Camera type={type} flashMode={flashMode} ref={(ref) => (cameraRef = ref)} style={styles.camera}>
						<View style={styles.buttonsCameraContainer}>
							<TouchableOpacity onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)} style={styles.buttonsCamera}>
								<FontAwesome name="rotate-right" size={25} color="#ffffff" />
							</TouchableOpacity>

							<TouchableOpacity onPress={() => setFlashMode(flashMode === FlashMode.off ? FlashMode.torch : FlashMode.off)} style={styles.buttonsCamera}>
								<FontAwesome name="flash" size={25} color={flashMode === FlashMode.off ? "#ffffff" : "#e8be4b"} />
							</TouchableOpacity>
						</View>
				</Camera>	
			</View> 

        	<ScrollView horizontal  contentContainerStyle={styles.galleryContainer}>
				{photos}
				{backgroundIngredient()}
        	</ScrollView>
			{ ingredients.length > 0 && !modalVisible &&
			<View style={styles.ingredientsAddedContainter}>
				<View styles={styles.ingredientsTotal}>
					<Text>
						Added ingredients ({ingredients.length}):
					</Text>
				</View>
				<ScrollView horizontal  contentContainerStyle={styles.galleryContainer}>
				<View style={styles.ingredientsAdded}>
					<Text>
						{displayAddedIngredients()}
					</Text>
				</View>
				</ScrollView>
			</View>
			}
		
			<View style={styles.containerButtonBottom}>
								
				<View style={styles.buttonSearch}>
					<MyButton
						dataFlow={()=> setModalVisible(true)}
						text={"Search"}
        				buttonType={buttonStyles.buttonFour}
					/>
				</View>
			
				<View style={styles.buttonNext}>
					<MyButton
						dataFlow={()=>handleBtn()}
						text={"Next"}
        				buttonType={buttonStyles.buttonFour}
					/>
				</View>
			</View>

			<View style={styles.snapContainer}>
				<TouchableOpacity onPress={() => cameraRef && takePicture()}>
					<FontAwesome name="circle-thin" size={95} color="#ffffff" />
				</TouchableOpacity>
			</View>
		</View>
   )
}

const styles = StyleSheet.create({
	container:{
		flex: 1,
		alignContent: 'center',
		alignItems:'center',
		width: '100%',
		height: '100%',
		backgroundColor:css.backgroundColorTwo,
		paddingTop: css.paddingTop,
	},

	modalBackgound: {
		flex: 0,
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
	},
	
	key: {
		flex: 1,
		alignContent: 'center',
		alignItems:'center',
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
		background: 'red',
	},

	validButton: {
	marginBottom: 20,
	},

	searchInput: {
	flex: 0,
	alignItems: 'center',
	marginBottom: 20,
	width: '80%',
	borderWidth: 1,
	borderColor: 'grey',
	backgroundColor: 'rgba(255,255,255, 0.6)',
	},

	cameraContainer: {
		backgroundColor: 'black',
		borderRadius: 50,
		overflow: 'hidden',
		height:'50%',
		width:'90%',
		marginBottom:10,
	},

	styleCamera:{
		height:350,
		width:350,
		marginBottom:10,
		borderRadius: 40,
		overflow: "hidden",
	},

	camera: {
		height:'100%',
		width:'100%',
	},

	buttonsCameraContainer: {
		flex: 0.1,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingTop: 20,
		paddingLeft: 20,
		paddingRight: 20,
	},

	buttonsCamera: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		borderRadius: 50,
	},

	galleryContainer: {
		flexWrap: 'wrap',
		alignItems:'center',
	},

	deleteIcon: {
        width: '95%',
        alignItems: 'flex-end',
        position: 'absolute',
        zIndex: 1,
        paddingTop: '3%',
      },

	photo: {
		width: 150,
		height: 150,
		margin: 5,
	},

	addPicturesContainer: {
		flex: 0,
		justifyContent: 'center',
		alignItems: 'center',
		width: 150,
		height: 150,
		margin: 5,
		paddingBottom: 10,
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: 'rgba(255,255,255, 0.4)',
	},

	text: {
		color: 'rgba(255,255,255, 0.4)',
	},

	ingredientsAddedContainter: {
		flex: 0,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255, 0.7)',
		height: 30,
		marginBottom: 15,
		paddingLeft: 10,
	},

	ingredientsAdded: {
		paddingLeft: 6,
	},

	containerButtonBottom: {
		flex: 0,
		flexDirection: 'row',
		justifyContent:'space-around',
		width: '100%',
		height: 50,
	},

	buttonSearch: {
		width: '100%',
		paddingRight: 30,
	},

	buttonNext: {
		width: '100%',
		paddingLeft: 30,
	},

	snapContainer: {
		flex: 0,
		alignItems: "center",
		justifyContent: "flex-end",
		backgroundColor: css.inactiveButtonColor,
		width: 100,
		borderRadius: 100,
		marginBottom: '4%'
	},
})