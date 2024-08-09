import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
} from "react-native";
import { Camera, CameraType, FlashMode } from "expo-camera/legacy";
import { useDispatch,useSelector } from "react-redux";
import { addIngredientToStore,removeIngredientToStore } from "../reducers/ingredient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useIsFocused } from "@react-navigation/native";

import MyButton from '../modules/MyButton';
import MySmallButton from "../modules/MyButton";
import buttonStyles from '../styles/Button';
import css from "../styles/Global";


export default function KickoffScreen({navigation}) {
	const saveMoney=false;
	const API_KEY="qD5sB6nb.BaYym0RxgqgmXQb5GEGgUZJshGNQhYby"

  const [hasPermission, setHasPermission] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [pictures, setPictures] = useState([]);

  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  let cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const result = await Camera.requestCameraPermissionsAsync();
      if (result) {
        setHasPermission(result.status === "granted");
      }
    })();
  }, []);

	function handleBtn () {
		if(!saveMoney){
			for (let imagePath of pictures){
				console.log('LAAAA', imagePath)
				// Make the request
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
										body: formData,});
							if (response.ok) {
								const data = await response.json();
								if(data){
									console.log('SALUT: ', data);
									if (data.items && data.items.length > 0 && data.items[0].food.length > 0) {
										console.log('NOW: ', data.items[0].food[0]);
										dispatch(addIngredientToStore({photo:imagePath,data:data.items[0].food[0].food_info}))
									}
								}else{
									console.log('no data')
								}


							  } else {
								throw new Error(`HTTP status ${response.status}`);
							  }						
					}catch(error){
						console.error('Something bad happened:', error);
					}
				}
				handleFetch();	 
			}
			
		}
		navigation.navigate('Recap')
	}

	const takePicture = async () => {
		const photo = await cameraRef.takePictureAsync({ quality: 0.3 });
		if (photo) {
			const formData = new FormData();
			formData.append('photoFromFront', {
				uri: photo.uri,
				name: 'photo.jpg',
				type: 'image/jpeg',
			});
			fetch('http://192.168.100.20:3000/upload', {
				method: 'POST',
				body: formData,
			   })
			   .then((response) => response.json())
				.then((data) => {
					if(data.result){
						console.log('NOW: ', data.url)
					}
			})
			.catch(error => console.error('There has been a problem with your fetch operation:', error));
			
			console.log(photo.uri)
			setPictures([...pictures,photo.uri])
		}

	};

	if (!hasPermission || !isFocused) {
		return <View />;
	}
	
	const photos = pictures.map((data, i) => {
		return (
		  <View key={i} style={styles.photoContainer}>
			<View style={styles.deleteIcon}>
				<TouchableOpacity onPress={() => {
					let copyPictures = pictures.filter(e=>e!==data);
					setPictures(copyPictures)
					}}>
				  <FontAwesome name='times' size={20} color='red'/>
				</TouchableOpacity>
			</View>
			<Image source={{ uri: data }} style={styles.photo} />
		  </View>
		);
	  });
	

  return (
	<SafeAreaView style={styles.container} >
		<Camera type={type} flashMode={flashMode} ref={(ref) => (cameraRef = ref)} style={styles.camera}>
				<View style={styles.buttonsCameraContainer}>
					<TouchableOpacity onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)} style={styles.buttonsCamera}>
						<FontAwesome name="rotate-right" size={25} color="#ffffff" />
					</TouchableOpacity>

					<TouchableOpacity onPress={() => setFlashMode(flashMode === FlashMode.off ? FlashMode.torch : FlashMode.off)} style={styles.buttonsCamera}>
						<FontAwesome name="flash" size={25} color={flashMode === FlashMode.off ? "#ffffff" : "#e8be4b"} />
					</TouchableOpacity>
				</View>

				{/* <View style={styles.snapContainer}>
					<TouchableOpacity onPress={() => cameraRef && takePicture()}>
						<FontAwesome name="circle-thin" size={95} color="#ffffff" />
					</TouchableOpacity>
				</View> */}
		</Camera>
		
        <ScrollView horizontal  contentContainerStyle={styles.galleryContainer}>
			{photos}
			{/* <View style={sytle= }></View> */}
        </ScrollView>
		
		<View style={styles.containerButtonBottom}>
			<View style={styles.buttonSearch}>
				<MyButton
					dataFlow={()=>handleBtn()}
					text={"Search"}
        			buttonType={buttonStyles.buttonTwo}
				/>
			</View>
			<View style={styles.buttonNext}>
				<MyButton
					dataFlow={()=>handleBtn()}
					text={"Suivant"}
        			buttonType={buttonStyles.buttonTwo}
				/>
			</View>
		</View>

		<View style={styles.snapContainer}>
			<TouchableOpacity onPress={() => cameraRef && takePicture()}>
				<FontAwesome name="circle-thin" size={95} color="#ffffff" />
			</TouchableOpacity>
		</View>
	</SafeAreaView>
  )
}

const styles = StyleSheet.create({
	container:{
		flex: 1,
		alignItems:'center',
		backgroundColor:css.backgroundColorTwo,
		paddingTop: css.paddingTop,
	},

	camera: {
		height:'50%',
		width:'90%',
		marginBottom:10,
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
		margin: 5
	},

	containerButtonBottom: {
		flex: 0,
		flexDirection: 'row',
		justifyContent:'space-around',
		width: '100%',
		height: 50,
		marginBottom: 25,
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
		marginBottom: '6%'
	},
})