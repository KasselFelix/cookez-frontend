import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Modal, Animated, PanResponder, Dimensions } from 'react-native'
import React, { useState,useEffect,useRef } from 'react'
import { useDispatch } from 'react-redux';
import { OPENAI_API_KEY, UNSPLASH_API_KEY, DEEPAI_API_KEY, PEXELS_API_KEY } from '../modules/apiKeys';
import css from "../styles/Global";
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { removeIngredient, updateIngredientQuantity, updateIngredientUnit } from '../reducers/ingredient';

// Units the backend's convertToBaseUnit knows. Mass + volume crossover is
// allowed for g/ml-based ingredients under the kitchen-shorthand assumption
// 1 g ≈ 1 ml. Accurate for water-density liquids (water, milk, broth);
// approximate for fats and dense solids (flour, sugar, honey). Worth it for
// the UX flexibility — the imprecision is comparable to recipe variance.
// `unit` is exposed everywhere so the user can express "3 apples" without
// guessing the gram weight — convertToBaseUnit('unit', referenceWeight)
// multiplies by the Ingredient.quantity reference recorded in the BDD.
const UNIT_OPTIONS_BY_BASE = {
    g:    ['g', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'tbsp', 'tsp', 'unit'],
    ml:   ['ml', 'cl', 'dl', 'l', 'g', 'kg', 'mg', 'tbsp', 'tsp', 'unit'],
    unit: ['unit'],
};

const { width } = Dimensions.get('window');

export default function Recap( props ) {
    // The canonical quantity lives in Redux (`data.g_per_serving`), so
    // navigating away from RecapScreen and back preserves the override.
    // Local state mirrors Redux for fluid typing — `updateIngredientQuantity`
    // is dispatched on every change with the parsed numeric value.
    const [grammes, setGrammes] = useState(
        props.data.g_per_serving != null ? String(props.data.g_per_serving) : ''
    );
    const [modalVisible, setModalVisible] = useState(false);
    const [unitModalVisible, setUnitModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    const dispatch = useDispatch()

    const baseUnit = props.data.defaultUnit || 'g';
    const unitOptions = UNIT_OPTIONS_BY_BASE[baseUnit] || ['g'];
    const currentUnit = props.data.unit || baseUnit;
    const isUnitEditable = unitOptions.length > 1;

    const handleQuantityChange = (value) => {
        // Strip non-digit characters defensively, then mirror to Redux.
        // Empty string is allowed in local state (mid-edit) but is stored
        // as 0 in Redux so the recipe-result query still has a number.
        const cleaned = value.replace(/[^0-9]/g, '');
        setGrammes(cleaned);
        dispatch(updateIngredientQuantity({
            display_name: props.data.display_name,
            quantity: cleaned === '' ? 0 : Number(cleaned),
        }));
    };

    const handleUnitPick = (u) => {
        setUnitModalVisible(false);
        dispatch(updateIngredientUnit({
            display_name: props.data.display_name,
            unit: u,
        }));
    };

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
        const response = await fetch(`https://api.pexels.com/v1/search?query=${ingredientName}&per_page=1`, {
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
            <TextInput
              keyboardType="numeric"
              maxLength={5}
              value={grammes}
              onChangeText={handleQuantityChange}
              style={styles.qtyInput}
              selectTextOnFocus
              accessibilityLabel={`Quantity for ${props.data.display_name}`}
            />
            {isUnitEditable ? (
              <TouchableOpacity
                onPress={() => setUnitModalVisible(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Change unit (current: ${currentUnit})`}
                style={styles.unitTrigger}
              >
                <Text style={styles.qtyUnit}>{currentUnit}</Text>
                <FontAwesome name="caret-down" size={12} color="black" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.qtyUnit}>{currentUnit}</Text>
            )}
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
                        <Text>{props.data.nutrition?.calories_100g ?? 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text>
                        <Text style={styles.text}> Sugars:</Text>
                        <Text>{props.data.nutrition?.sugars_100g != null ? Number.parseFloat(props.data.nutrition.sugars_100g).toFixed(2) : 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text>
                        <Text style={styles.text}> Proteins:</Text>
                        <Text>{props.data.nutrition?.proteins_100g != null ? Number.parseFloat(props.data.nutrition.proteins_100g).toFixed(2) : 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text>
                        <Text style={styles.text}> Fat:</Text>
                        <Text>{props.data.nutrition?.fat_100g != null ? Number.parseFloat(props.data.nutrition.fat_100g).toFixed(2) : 0}</Text>
                      </View>
                      <View style={styles.aLineContainer}>
                        <Text>● </Text>
                        <Text style={styles.text}> Fibers:</Text>
                        <Text>{props.data.nutrition?.fibers_100g != null ? Number.parseFloat(props.data.nutrition.fibers_100g).toFixed(2) : 0}</Text>
                      </View>
                </View>
              </View>
          </Modal>
          <Modal visible={unitModalVisible} animationType="fade" transparent onRequestClose={() => setUnitModalVisible(false)}>
              <TouchableOpacity
                style={styles.unitBackdrop}
                activeOpacity={1}
                onPress={() => setUnitModalVisible(false)}
              >
                <View style={styles.unitSheet}>
                  <Text style={styles.unitSheetTitle}>{props.data.display_name}</Text>
                  {unitOptions.map((u) => {
                    const active = u === currentUnit;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => handleUnitPick(u)}
                        style={[styles.unitRow, active && styles.unitRowActive]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.unitRowText, active && styles.unitRowTextActive]}>{u}</Text>
                        {active && <FontAwesome name="check" size={16} color={css.palette.white} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableOpacity>
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
        ...css.shadow.heavy,
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
        //backgroundColor: 'red',
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
        width: 60,
        marginBottom: 3,
      },

      qtyInput: {
        color: 'black',
        fontSize: 14,
        paddingVertical: 0,
        minWidth: 32,
        textAlign: 'center',
      },

      qtyUnit: {
        color: 'black',
        fontSize: 14,
        marginLeft: 2,
      },

      unitTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 2,
      },

      unitBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
      },

      unitSheet: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: 240,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },

      unitSheetTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
        color: 'black',
      },

      unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginVertical: 2,
      },

      unitRowActive: {
        backgroundColor: css.palette.secondary500,
      },

      unitRowText: {
        fontSize: 15,
        color: 'black',
      },

      unitRowTextActive: {
        color: 'white',
        fontWeight: '600',
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