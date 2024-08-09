import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image } from 'react-native'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import css from "../styles/Global";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { removeIngredientToStore } from '../reducers/ingredient';

export default function Recap( props ) {
    const [grammes, setGrammes] = useState([]);
    console.log('GRAMS ', grammes)


    const dispatch = useDispatch((state) => state.ingredient.ingredient)

    return (
      <View style={styles.ingredientContainer}>
          <View style={styles.photoContainer}>
            <View style={styles.deleteIcon}>
              <TouchableOpacity onPress={() => dispatch(removeIngredientToStore (props))}>
                <FontAwesome name='times' size={20} color='red'  />
              </TouchableOpacity>
            </View>
            <View>
              <Image source={{ uri: props.photo }} style={styles.photo} />
            </View>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.ingredientName}>{props.data.display_name}</Text>
          </View>
          <View style={styles.infoContainer}>
            <TextInput placeholder={props.data.g_per_serving.toString()} placeholderTextColor={'black'} value={grammes} onChangeText={(value) => setGrammes(value)}/>
            <Text>g</Text>
          </View>
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
        paddingTop: '2%'
      },
    
      photo: {
        width: 80,
        height: 90,
        borderRadius: 10,
        backgroundColor: 'green',
        marginLeft: '4%',
      },
    
      nameContainer: {
      },
    
      infoContainer: {
        flex: 0,
        justifyContent: 'flex-end',
        flexDirection: 'row',
        width: 50,
        height: 20,
        marginRight: 15,
      },
    
      ingredientName: {
        width: 150,
        height: 20,
      },
})