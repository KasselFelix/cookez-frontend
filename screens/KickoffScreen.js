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
import { useDispatch, useSelector } from "react-redux";
import { addIngredient, removeIngredient } from "../reducers/ingredient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useIsFocused } from "@react-navigation/native";

import MyButton from "../modules/MyButton";
import buttonStyles from "../styles/Button";
import css from "../styles/Global";

export default function KickoffScreen({ navigation }) {
  const saveMoney = false;
  const API_KEY = "qD5sB6nb.BaYym0RxgqgmXQb5GEGgUZJshGNQhYby";

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

  function handleBtn() {
    if (!saveMoney) {
      for (let imagePath of pictures) {
        console.log(imagePath);
        // Make the request
        const handleFetch = async (cpt = 0) => {
          try {
            //Create FormData
            const formData = new FormData();
            formData.append("image", {
              uri: imagePath,
              type: "image/jpeg",
              name: `image${cpt++}.jpg`,
            });

            const response = await fetch(
              "https://vision.foodvisor.io/api/1.0/en/analysis",
              {
                method: "POST",
                headers: {
                  Authorization: `Api-Key ${API_KEY}`,
                  "Content-Type": "multipart/form-data",
                },
                body: formData,
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (data) {
                console.log(data);
                if (
                  data.items &&
                  data.items.length > 0 &&
                  data.items[0].food.length > 0
                ) {
                  console.log(data.items[0].food[0]);
                  dispatch(
                    addIngredient({
                      photo: imagePath,
                      data: data.items[0].food[0].food_info,
                    })
                  );
                }
              } else {
                console.log("no data");
              }
            } else {
              throw new Error(`HTTP status ${response.status}`);
            }
          } catch (error) {
            console.error("Something bad happened:", error);
          }
        };
        handleFetch();
      }
    }
    navigation.navigate("Recap");
  }

  const takePicture = async () => {
    const photo = await cameraRef.takePictureAsync({ quality: 0.3 });
    if (photo) {
      //const formData = new FormData();
      // formData.append('photoFromFront', {
      // 	uri: photo.uri,
      // 	name: 'photo.jpg',
      // 	type: 'image/jpeg',
      // });
      // fetch('http://192.168.1.11:3000/upload', {
      // 	method: 'POST',
      // 	body: formData,
      //    })
      //    .then((response) => response.json())
      // 	.then((data) => {
      // 		if(data.result){
      // 			console.log(data.url)
      // 		}
      // })
      // .catch(error => console.error('There has been a problem with your fetch operation:', error));

      //console.log(photo.uri)
      setPictures([...pictures, photo.uri]);
    }
  };

  if (!hasPermission || !isFocused) {
    return <View />;
  }

  const photos = pictures.map((data, i) => {
    return (
      <View key={i} style={styles.photoContainer}>
        <TouchableOpacity
          onPress={() => {
            let copyPictures = pictures.filter((e) => e !== data);
            setPictures(copyPictures);
          }}
        >
          <FontAwesome
            name="times"
            size={20}
            color="red"
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
        <Image source={{ uri: data }} style={styles.photo} />
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        type={type}
        flashMode={flashMode}
        ref={(ref) => (cameraRef = ref)}
        style={styles.camera}
      >
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() =>
              setType(
                type === CameraType.back ? CameraType.front : CameraType.back
              )
            }
            style={styles.button}
          >
            <FontAwesome name="rotate-right" size={25} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setFlashMode(
                flashMode === FlashMode.off ? FlashMode.torch : FlashMode.off
              )
            }
            style={styles.button}
          >
            <FontAwesome
              name="flash"
              size={25}
              color={flashMode === FlashMode.off ? "#ffffff" : "#e8be4b"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.snapContainer}>
          <TouchableOpacity onPress={() => cameraRef && takePicture()}>
            <FontAwesome name="circle-thin" size={95} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Camera>

      <ScrollView horizontal contentContainerStyle={styles.galleryContainer}>
        {photos}
      </ScrollView>

      <MyButton
        dataFlow={() => handleBtn()}
        text={">>"}
        buttonType={buttonStyles.buttonTwo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: css.backgroundColorTwo,
  },
  camera: {
    height: "50%",
    width: "90%",
    marginBottom: 10,
  },
  buttonsContainer: {
    flex: 0.1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 50,
  },
  snapContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 25,
  },
  photoContainer: {
    alignItems: "flex-end",
  },
  photo: {
    margin: 10,
    width: 150,
    height: 150,
  },
  deleteIcon: {
    marginRight: 10,
  },
  galleryContainer: {
    flexWrap: "wrap",
    alignItems: "center",
  },
});
