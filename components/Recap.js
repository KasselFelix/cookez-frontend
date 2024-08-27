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

    //Fonction pour appeler l'API de DALL·E
    const generateImageFromDalle = async (ingredientName) => {
      try {
          const response = await fetch("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer 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`,
              },
              body: JSON.stringify({
                  prompt: `Generate an image of ${ingredientName}`,
                  n: 1,
                  size: "1024x1024",
              }),
          });

          const data = await response.json();
          // console.log('API Response:', data);
          if (data && data.data && data.data.length > 0) {
              setImageUrl(data.data[0].url); // Met à jour l'état avec l'URL de l'image
          } else {
              console.error("No image found");
          }
      } catch (error) {
          console.error("Error fetching image from DALL·E", error);
      }
    }

    //Fonction pour appeler l'API unsplash
    const generateImageFromUnsplash = async (ingredientName) => {
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


    const generateImageFromDeepAI = async (ingredientName) => {
      try {
          const response = await fetch("https://api.deepai.org/api/text2img", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Api-Key": "6a4f36cf-6144-4c7e-8ed9-b686eff0d3d6",
              },
              body: JSON.stringify({ text: `A picture of ${ingredientName}` }),
          });
          const data = await response.json();
          if (data.output_url) {
              setImageUrl(data.output_url);
          } else {
              console.error("No image found",data);
          }
      } catch (error) {
          console.error("Error fetching image from DeepAI", error);
      }
  };

  const generateImageFromPexels = async (ingredientName) => {
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${ingredientName}`, {
            headers: {
                Authorization: 'mujY10VeWWIrl3uzp9QaY9NWbM9YjgFNMi1OWzBD15ePJf3L0WynHm4P',
            },
        });
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            setImageUrl(data.photos[0].src.small);
        } else {
            console.error("No image found");
        }
    } catch (error) {
        console.error("Error fetching image from Pexels", error);
    }
};

    // Appel de l'API lors du montage du composant ou si l'ingredient change
    useEffect(() => {
      //generateImageFromDalle(props.data.display_name);
      //generateImageFromUnsplash (props.data.display_name);
      //generateImageFromDeepAI (props.data.display_name)
      generateImageFromPexels(props.data.display_name);
    }, [props.data.display_name]);
    
    return (
      <View style={styles.ingredientContainer}>
          <View style={styles.photoContainer}>
            <View style={styles.deleteIcon}>
              <TouchableOpacity onPress={() => dispatch(removeIngredientToStore(props))} style={styles.cross}>
                <FontAwesome name='times' size={20} color={css.activeIconColor}  />
              </TouchableOpacity>
            </View>
            <View>
               {/* Utilise l'image générée si elle existe */}
               {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    ) : (
                      <Image source={{ uri: props.photo }} style={styles.image} />
                    )}
            </View>
          </View>
          <View style={styles.ingredientNameContainter}>
            <Text style={styles.ingredientName}>{props.data.display_name}</Text>
          </View>
          <View style={styles.infoGramsContainer}>
            <View style={styles.infoGrams}>
            <TextInput keyboardType="numeric" maxLength={4} placeholder={`${props.data.g_per_serving}`} placeholderTextColor={'black'} value={grammes} onChangeText={(value) => setGrammes(value)}/>
            <Text>g</Text>
            </View>
          </View>
          <View style={styles.infoBtn}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => { setModalVisible(true) }} >
                <Feather name="info" size={24} color='white'/>
            </TouchableOpacity>
          </View>
          <Modal visible={modalVisible} animationtType="fade" transparent>
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                      <View style={styles.deleteIconModal}>
                        <Text style={styles.titleText}> {props.data.display_name}/100g</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                          <FontAwesome name='times' size={25} color={css.activeIconColor}  />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.aLineContainer}>
                          <Text>⚫ </Text> 
                          <Text style={styles.text}>Calories:</Text>
                          <Text>{props.data.nutrition.calories_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Sugars:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.sugars_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Proteins:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.proteins_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text>
                        <Text style={styles.text}>Fat:</Text>
                        <Text> {Number.parseFloat(props.data.nutrition.fat_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>⚫ </Text> 
                        <Text style={styles.text}>Fibers:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.fibers_100g).toFixed(2) || 0}</Text>
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
        backgroundColor: css.backgroundColorOne,
        marginBottom: '5%',
      },
    
      photoContainer: {
        alignItems: 'flex-start',
      },
      
      deleteIcon: {
        zIndex:1,
        width: '95%',
        alignItems: 'flex-end',
        position: 'absolute',
        paddingTop: '2%',
        paddingRight: '6%',
        marginTop:'3%'
      },

      cross: {
        backgroundColor:css.backgroundColorOne,
        borderRadius:5,
        //height:'100%',
        width:'25%',
        alignItems: 'center',
        //justifyContent:'center'
      },
    
      image: {
        width: 90,
        height: 95,
        //borderRadius:10,
        //borderTopEndRadius:10,
        //borderBottomLeftRadius:10,
        //borderTopEndRadius:10,
        borderBottomLeftRadius:10,
        borderTopLeftRadius:10,
        // marginLeft: '4%',
      },
    
      ingredientNameContainter: {
        justifyContent: 'center',
        width: 70,
        height: 80,
        fontWeight: 'bold',
      },

      ingredientName: {
        fontWeight: 'bold',
      },

      infoGramsContainer: {
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
        alignItems: 'center',
        justifyContent:'space-around',
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
      },

      deleteIconModal: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems: 'center',
        width: '80%',
        height: '10%',
      },

      aLineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 200,
        height: '10%',
      },

      titleText: {
        marginLeft:'28%',
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