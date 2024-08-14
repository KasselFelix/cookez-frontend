import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView} from "react-native";
import React, {useState, useEffect} from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import Popover from "react-native-popover-view";
import { useSelector } from "react-redux";

export default function RecipeScreen({ route, navigation }) {
  /* HOOK STATE FOR THE HEART LOGO ON THE RECIPE*/
  const [like, setLike] = useState(false);
  const [showPopover, setShowPopover]=useState(false);
  const user=useSelector((state)=>{state.user.user})

// auto close the popover 
  useEffect(() => {
    setTimeout(() => setShowPopover(false), 5500);
  }, [])

  const selectedRecipe= route.params.props

  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <FontAwesome
        key={i}
        name="star"
        size={25}
        color={i < route.params.note ? "#d4b413" : "#9c9c98"}
      />
    );
  }

  // CONDITIONAL FUNCTION TO CHANGE HEART COLOR UPON CLICKING FOR LOGGED IN USER VERSION
  const handleLikeRecipe =() => {
    if(user && user.token){
      setLike(!like);
    }else{
      setShowPopover(true)
    }
  }
  
  const ingredients= selectedRecipe.ingredients.map((e,i)=>{
      return <Text key={i}> {e.quantity}g {e.name}</Text>
  })
  
  const steps= selectedRecipe.steps.map((text,i)=>{
    return <Text key={i}>{i+1}. {text}</Text>
  })

  const comments= selectedRecipe.comments.map((e,i)=>{
    return <View key={i} style={styles.content}>
          <Text>{e.username}   {e.date}</Text>
          <Text>{e.message}</Text>
    </View>
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={
            <FontAwesome name="angle-double-left" size={30} color={"white"} />
          }
          buttonType={buttonStyles.buttonSmall}
        />
      </View>

      {/* BLOC RECETTE SELECTED  */}
      <View style={styles.pictureBloc}>
        <Text style={styles.sectionsTitle}>{selectedRecipe.name}</Text>
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder} />
            <Popover 
              isVisible={showPopover}
              onRequestClose={()=> setShowPopover(false)}
              from={(
              <TouchableOpacity style={styles.favoriteButton} onPress={()=> {handleLikeRecipe();}}>
                <FontAwesome name="heart" size={24} color={like?"#E45858":"grey"} />
              </TouchableOpacity>
              )}>
              <View style={styles.popover}>
                <Text>You can unlock this feature by Signing in ❤️</Text>
              </View>
            </Popover>
          </View>
        <View style={styles.stars}>{stars}</View>

        <View style={styles.textUnder}>
          <Text style={styles.infos}>
            Prep: {selectedRecipe.preparationTime} min
          </Text>
          <Text style={styles.infos}>
            Difficulty: {selectedRecipe.difficulty}/5
          </Text>
        </View>
      </View>

      {/* BLOC INGREDIENTS */}
      <View style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Ingredients</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {ingredients}
          </View>
        </ScrollView>
      </View>

      {/* BLOC STEPS */}
      <View style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Étapes</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {steps}
          </View>
        </ScrollView>
      </View>

      <View style={styles.separator} />

      {/* BLOC COMMENTAIRES */}
      <View style={styles.commentsBloc}>
        <Text style={styles.sectionsTitle}>Commentaires</Text>
        {comments}
      </View>

      {/* BOUTON  */}
      <MyButton
        dataFlow={() => navigation.navigate("MoreFeatures")}
        text="More Features"
        buttonType={buttonStyles.buttonTwo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: css.backgroundColorOne,
    paddingTop: 20,
  },
  header: {
    flex: 0,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },

  pictureBloc: {
    width: "90%",
    height: 180,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  sectionsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },

  imageContainer: {
    marginBottom: 5,
  },

  imagePlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },

  popover:{
    width:300,
    height:50,
    textAlign:'center',
    alignItems:'center',
    justifyContent:'center',
  },

  favoriteButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },

  stars: {
    flexDirection: "row",
  },

  textUnder: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  infos: {
    fontSize: 12,
  },

  recipeBloc: {
    width: "90%",
    height: 150,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  separator: {
    height: 1,
    width: "90%",
    backgroundColor: "black",
    marginVertical: 16,
  },

  commentsBloc: {
    width: "90%",
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  content: {
    paddingBottom: 10,
  },

  scrollView: {
    flex: 1,
  },
});
