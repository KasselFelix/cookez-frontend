import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import css from "../styles/Global";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import imageRecipe from '../modules/images';

export default function Recipe( props ) {

    const note = props.votes.reduce((accumulator, user) => {
      return accumulator + user.note;
    }, 0)/props.votes.length;

    const voteRecipe= () => {
      let stars = [];
      for (let i=0; i < 5; i++) {
        stars.push(<FontAwesome key={i} name='star' size={18} color={i < note ? "#d4b413" : "#9c9c98"} />)
      }

      return stars;
    }

    return (
        <View style={styles.recipeContainer}>
          <TouchableOpacity 
          style={styles.recipeContainer} 
          onPress={() => { props.navigation.navigate('Recipe', {props, note: note, votes: props.votes, update:props.update })}}
          >
            <Text style={styles.name}>{props.name}</Text>
            <Text> {props.origin}</Text>
            <View style={styles.imageContainer}>
              <Image style={styles.image} source={imageRecipe[`${props.picture}` || null]}/>{/*{{ uri: props.picture}}/>*/}
              <View style={styles.voteContainer}> 
                <View style={styles.vote}>
                  {voteRecipe()}
                </View>
                  <Text> votes: {props.votes.length}</Text>
              </View>
            </View>
            <View style={styles.infos}>
              <Text style={styles.text}>Difficulté: {props.difficulty}/5</Text>
              <Text style={styles.text}>Temps de préparation: {props.preparationTime}m</Text>
            </View>
          </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({

  recipeContainer: {
    width: 330,
    height: 340,
    borderRadius: 10,
    backgroundColor: 'white',
    marginBottom: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  name: {
    fontSize: css.fontSizeSix,
  },

  imageContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: '3%',
    marginLeft: '10%',
    width: '80%',
    height: '90%',
  },

  image: {
    width: '110%',
    height: '94%',
    borderRadius: 10,
    backgroundColor: css.backgroundColorTwo,
  },

  voteContainer: {
    flex: 0,
    alignItems: 'flex-end',
    width: '100%',
  },

  vote:{
    flex: 0,
    flexDirection: 'row',
  },

  infos: {
    marginTop: '6%',
  },

  text: {
    fontSize: css.fontSizeSix,
  },
})