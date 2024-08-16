import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Modal } from 'react-native'
import React, { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux';
import css from "../styles/Global";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Feather } from "@expo/vector-icons";
import { removeIngredientToStore } from '../reducers/ingredient';

export default function Recap( props ) {
    const [grammes, setGrammes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    
    const dispatch = useDispatch((state) => state.ingredient.ingredient)

    // Fonction pour appeler l'API de DALL·E
    // const generateImage = async (ingredientName) => {
    //   try {
    //       const response = await fetch("https://api.openai.com/v1/images/generations", {
    //           method: "POST",
    //           headers: {
    //               "Content-Type": "application/json",
    //               Authorization: `Bearer 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`,
    //           },
    //           body: JSON.stringify({
    //               prompt: `Generate an image of ${ingredientName}`,
    //               n: 1,
    //               size: "1024x1024",
    //           }),
    //       });

    //       const data = await response.json();
    //       console.log('API Response:', data);
    //       if (data && data.data && data.data.length > 0) {
    //           setImageUrl(data.data[0].url); // Met à jour l'état avec l'URL de l'image
    //       } else {
    //           console.error("No image found");
    //       }
    //   } catch (error) {
    //       console.error("Error fetching image from DALL·E", error);
    //   }
    // }

    const fetchImageFromUnsplash = async (ingredientName) => {
      try {
          const response = await fetch(`https://api.unsplash.com/search/photos?query=${ingredientName}&client_id=jtpouSnBgNG5G1d0xNZhOXdrd5fyMN-BfcPWG_0uQMQ`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
              setImageUrl(data.results[0].urls.small);
          } else {
              console.error("No image found");
          }
      } catch (error) {
          console.error("Error fetching image from Unsplash", error);
      }
    };

    // Appel de l'API lors du montage du composant ou si l'ingredient change
    useEffect(() => {
      //generateImage(props.data.display_name);
      fetchImageFromUnsplash (props.data.display_name)
    }, [props.data.display_name]);
    
    return (
      <View style={styles.ingredientContainer}>
          <View style={styles.photoContainer}>
            <View style={styles.deleteIcon}>
              <TouchableOpacity onPress={() => dispatch(removeIngredientToStore(props))}>
                <FontAwesome name='times' size={20} color='red'  />
              </TouchableOpacity>
            </View>
            <View>
              {/* <Image source={{ uri: null }} style={styles.image} /> */}
               {/* Utilise l'image générée si elle existe */}
               {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    ) : (
                      <Image source={{ uri: props.photo }} style={styles.image} />
                    )}
            </View>
          </View>
          <View>
            <Text style={styles.ingredientName}>{props.data.display_name}</Text>
          </View>
          <View style={styles.infoGramsContainer}>
            <View style={styles.infoGrams}>
            <TextInput keyboardType="numeric" maxLength={4} placeholder={`${props.data.g_per_serving}`} placeholderTextColor={'black'} value={grammes} onChangeText={(value) => setGrammes(value)}/>
            <Text>g</Text>
            </View>
          </View>
          <View style={styles.infoBtn}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => {console.log('ICI'); setModalVisible(true)}} >
                <Feather name="info" size={24} color="black"/>
            </TouchableOpacity>
          </View>
          <Modal visible={modalVisible} animationtType="fade" transparent>
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                      <View styles={styles.modal}>
                        <Text style={styles.titleText}>Nutrition of: {props.data.display_name}/100g</Text>
                        <View style={styles.deleteIconModal}>
                          <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <FontAwesome name='times' size={25} color='red'  />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.aLineContainer}>
                          <Text>⚫ </Text> 
                          <Text style={styles.text}>Calories:</Text>
                          <Text>{props.data.nutrition.calories_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Sugars:</Text>
                        <Text>{props.data.nutrition.sugars_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Proteins:</Text>
                        <Text> {props.data.nutrition.proteins_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text>
                        <Text style={styles.text}>Fat:</Text>
                        <Text> {props.data.nutrition.fat_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Fibers:</Text>
                        <Text>{props.data.nutrition.fibers_100g || 0}</Text>
                      </View>
                </View>
              </View>
          </Modal>
      </View>
    )
}

const styles = StyleSheet.create({
    ingredientContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: 330,
        borderRadius: 10,
        backgroundColor: css.backgroundColorTwo,
        marginBottom: '5%',
      },
    
      photoContainer: {
        alignItems: 'flex-start',
      },
      
      deleteIcon: {
        width: '95%',
        alignItems: 'flex-end',
        position: 'absolute',
        zIndex: 1,
        paddingTop: '2%',
        paddingRight: '6%',
      },
    
      image: {
        width: 90,
        height: 95,
        borderRadius: 10,
        marginLeft: '4%',
      },
    
      ingredientName: {
        width: 70,
        height: 20,
        fontWeight: 'bold',
      },

      infoGramsContainer: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'red',
        width: 80,
        height: 30,
        backgroundColor: 'white',
        borderRadius: 80,
        paddingRight: 5,
      },

      infoGrams: {
        flex: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'black',
        width: 50,
        marginBottom: 3,
      },

      infoBtn: {
        marginRight: 15,
        marginLeft: 20
      },

      modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
    
      modalContainer: {
        flex: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
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

      aLineContainer: {
        flex: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 200,
        paddingBottom: 15,
      },

      deleteIconModal: {
        marginTop: 5,
        alignItems: 'flex-end',
        width: 290,
        position: 'absolute',
      },

      modal: {
        backgroundColor: 'green',
      },

      titleText: {
        fontSize: 20,
        fontWeight: 'bold',
      },

      text: {
        fontSize: 18,
        marginRight: 45,
        height: 25,
        width: 100,
      }
})