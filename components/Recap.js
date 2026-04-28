import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Modal, Animated, PanResponder, Dimensions } from 'react-native'
import React, { useState,useEffect,useRef } from 'react'
import { useDispatch } from 'react-redux';
import { OPENAI_API_KEY, UNSPLASH_API_KEY, DEEPAI_API_KEY, PEXELS_API_KEY } from '../modules/apiKeys';
import css from "../styles/Global";
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { removeIngredient } from '../reducers/ingredient';

const { width } = Dimensions.get('window');

export default function Recap( props ) {
    const [grammes, setGrammes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    
    const dispatch = useDispatch()

    // --- SWIPE ---
    // On utilise des Animated.Value persistantes
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const opacity = useRef(new Animated.Value(1)).current;

    // IMPORTANT : Réinitialiser la position si l'ingrédient change 
    // (évite que le suivant hérite de la position "éjectée")
    useEffect(() => {
        pan.setValue({ x: 0, y: 0 });
        opacity.setValue(1);
    }, [props.data.display_name]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                const { dx, dy } = gestureState;
              // On n'active le swipe QUE si :
              // - Le mouvement horizontal est supérieur à 20px
              // - le mouvement horizontal est nettement plus fort que le vertical (évite les conflits au scroll)
              return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy);
            },

            onPanResponderTerminationRequest: () => false, // Garde le contrôle même si le système veut l'arrêter

            onPanResponderMove: (evt, gestureState) => {
              // On ne bouge le composant que si on est vraiment dans un geste horizontal
              pan.x.setValue(gestureState.dx);
               // Effet visuel : plus on glisse, plus ça devient transparent
              const newOpacity = 1 - Math.abs(gestureState.dx) / (width * 0.7);
              opacity.setValue(newOpacity);
            },
    
            onPanResponderRelease: (evt, gestureState) => {
            // 50% de la largeur de l'écran suffit pour supprimer
            if (Math.abs(gestureState.dx) > width * 0.5) {
                // Suppression confirmée
                Animated.parallel([
                    Animated.timing(pan.x, {
                        toValue: gestureState.dx > 0 ? width : -width,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    })
                ]).start(() => {
                    dispatch(removeIngredient(props));
                });
            } else {
                // Retour à la normale avec un effet "ressort" plus ferme
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    friction: 7, // Plus c'est haut, moins ça rebondit
                    tension: 40,
                    useNativeDriver: false,
                }).start();
                
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: false,
                }).start();
            }
        },
        
        // Sécurité : si le geste est interrompu par le système (appel, notification)
        onPanResponderTerminate: () => {
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
            }).start();
            opacity.setValue(1);
        }
        })
    ).current;

    //Fonction pour appeler l'API de DALL·E
    // const generateImageFromDalle = async (ingredientName) => {
    //   try {
    //       const response = await fetch("https://api.openai.com/v1/images/generations", {
    //           method: "POST",
    //           headers: {
    //               "Content-Type": "application/json",
    //               Authorization: `Bearer ${OPENAI_API_KEY}`,
    //           },
    //           body: JSON.stringify({
    //               prompt: `Generate an image of ${ingredientName}`,
    //               n: 1,
    //               size: "1024x1024",
    //           }),
    //       });

    //       const data = await response.json();
    //       // console.log('API Response:', data);
    //       if (data && data.data && data.data.length > 0) {
    //           setImageUrl(data.data[0].url); // Met à jour l'état avec l'URL de l'image
    //       } else {
    //           console.error("No image found");
    //       }
    //   } catch (error) {
    //       console.error("Error fetching image from DALL·E", error);
    //   }
    // }

    //Fonction pour appeler l'API unsplash
    // const generateImageFromUnsplash = async (ingredientName) => {
    //   try {
    //       const response = await fetch(`https://api.unsplash.com/search/photos?query=${ingredientName}&client_id=${UNSPLASH_API_KEY}`);
    //       const data = await response.json();
    //       if (data.results && data.results.length > 0) {
    //           setImageUrl(data.results[0].urls.small);
    //       } else {
    //           console.error("No image found");
    //       }
    //   } catch (error) {
    //       console.error("Error fetching image from Unsplash", error);
    //   }
    // };


  //   const generateImageFromDeepAI = async (ingredientName) => {
  //     try {
  //         const response = await fetch("https://api.deepai.org/api/text2img", {
  //             method: "POST",
  //             headers: {
  //                 "Content-Type": "application/json",
  //                 "Api-Key": DEEPAI_API_KEY,
  //             },
  //             body: JSON.stringify({ text: `A picture of ${ingredientName}` }),
  //         });
  //         const data = await response.json();
  //         if (data.output_url) {
  //             setImageUrl(data.output_url);
  //         } else {
  //             console.error("No image found",data);
  //         }
  //     } catch (error) {
  //         console.error("Error fetching image from DeepAI", error);
  //     }
  // };

  const generateImageFromPexels = async (ingredientName) => {
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${ingredientName}`, {
            headers: {
                Authorization: PEXELS_API_KEY,
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
      <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.ingredientContainer,
                {
                    transform: [{ translateX: pan.x }],
                    opacity: opacity
                }
            ]}>
          <View style={styles.photoContainer}>
            <View style={styles.deleteIcon}>
              <TouchableOpacity onPress={() => dispatch(removeIngredient(props))} style={styles.cross}>
                <FontAwesome name='times' size={20} color={css.palette.error}  />
              </TouchableOpacity>
            </View>
            <View>
               {/* Utilise l'image générée si elle existe */}
               {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image}  alt="picture of one recipe" accessibilityLabel="picture of one recipe"/>
                    ) : (
                      <Image source={{ uri: props.photo }} style={styles.image} alt="picture of one recipe" accessibilityLabel="picture of one recipe"/>
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
                          <FontAwesome name='times' size={25} color={css.palette.error}  />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text> 
                        <Text style={styles.text}> Calories:</Text>
                        <Text>{props.data.nutrition.calories_100g || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text> 
                        <Text style={styles.text}> Sugars:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.sugars_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text> 
                        <Text style={styles.text}> Proteins:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.proteins_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text>
                        <Text style={styles.text}> Fat:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.fat_100g).toFixed(2) || 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text> 
                        <Text style={styles.text}> Fibers:</Text>
                        <Text>{Number.parseFloat(props.data.nutrition.fibers_100g).toFixed(2) || 0}</Text>
                      </View>
                </View>
              </View>
          </Modal>
      </Animated.View>
    )
}

const styles = StyleSheet.create({
    ingredientContainer: {
        marginVertical: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: 330,
        borderRadius: 10,
        backgroundColor: css.palette.accent500,
        elevation: 3,
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
        backgroundColor:css.palette.accent500,
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
        width: 120,
      },
})