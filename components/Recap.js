import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Modal } from 'react-native'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import css from "../styles/Global";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Feather } from "@expo/vector-icons";
import { removeIngredientToStore } from '../reducers/ingredient';

export default function Recap( props ) {
    const [grammes, setGrammes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    
    const dispatch = useDispatch((state) => state.ingredient.ingredient)
    
    return (
      <View style={styles.ingredientContainer}>
          <View style={styles.photoContainer}>
            <View style={styles.deleteIcon}>
              <TouchableOpacity onPress={() => dispatch(removeIngredientToStore(props))}>
                <FontAwesome name='times' size={20} color='red'  />
              </TouchableOpacity>
            </View>
            <View>
              <Image source={{ uri: props.photo }} style={styles.photo} />
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
    
      photo: {
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