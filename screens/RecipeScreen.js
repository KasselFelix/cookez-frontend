import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Modal, Image} from "react-native";
import React, {useState, useEffect, useRef} from "react";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import addressIp from "../modules/addressIp";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import Popover from "react-native-popover-view";
import { useSelector } from "react-redux";

import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import imageRecipe from "../modules/images";

export default function RecipeScreen({ route, navigation }) {

  //const user ={username:'reptincel',token:'vePuvRek0PzD61hJVkyryC4EoGCZH-RY'};
  //const user = {username:null,token:null};
  const user =useSelector((state)=>state.user.value);
  const selectedRecipe= route.params.props
  const votes=route.params.votes

  /* HOOK STATE FOR THE HEART LOGO ON THE RECIPE*/
  const [like, setLike] = useState(false);
  const [showPopover, setShowPopover]=useState(false);
  const [showPopoverVote, setShowPopoverVote]=useState(false);
  const [modalVisible,setModalVisible]=useState(false);
  const [starNote,setStarNote]=useState(0);
  const [action,setAction]=useState(false);
  //const user=useSelector((state)=>{state.user.user})
  const modalRef = useRef(null);

// auto close the popover 
  useEffect(() => {
    setTimeout(() => setShowPopover(false), 5500);
    setTimeout(() => setShowPopoverVote(false), 5500);
  }, [])


  const handleVote=()=>{
    if(user.token ){
      setModalVisible(true)
    }else{
      setShowPopoverVote(true)
    }
  }

  const handleFetchVote = async (note) => {
    const response = await fetch(`http://${addressIp}:3000/recipes/vote/${selectedRecipe._id}`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username, note
      })
    });
    const data =  await response.json();
    if (data.result) {
      if (modalRef.current) {
        modalRef.current.animate('slideOutUp', 800).then(() => {
              setModalVisible(false);
        });
      }
      route.params.update()
    }
  }

  const handleFetchLike = async () => {
    setAction(true)
    const response = await fetch(`http://${addressIp}:3000/recipes/updateFavorite`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username, _id:selectedRecipe._id,action
      })
    });
    const data =  await response.json();
    if (data.result) {
      setLike(data.like);
      route.params.update()
    }
  }

  function handleStarsVote(note){
    const last=note;
    setStarNote(note)
    if(starNote==last && modalRef.current){
      modalRef.current.animate('slideOutUp', 800).then(() => {
      setModalVisible(false);
    });}
  }

  useEffect(() => {
    if (user.token) { 
      handleFetchVote(starNote);
    }
  }, [starNote]);

  useEffect(() => {
    if(user.token){
      handleFetchLike();
    }
  }, []);
  


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

  const starsVotes = [];
  for (let i = 0; i < 5; i++) {
    starsVotes.push(
      <TouchableOpacity key={i} onPress={()=> {handleStarsVote(i+1)}}>
        <FontAwesome
          name="star"
          size={25}
          color={i < starNote ? "blue" : "#9c9c98"}
        />
      </TouchableOpacity>
    );
  }


  // CONDITIONAL FUNCTION TO CHANGE HEART COLOR UPON CLICKING FOR LOGGED IN USER VERSION
  const handleLikeRecipe =() => {
    if(user.token){
      handleFetchLike()
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
          text={<FontAwesome name="angle-double-left" size={30} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>{selectedRecipe.name}</Text>
        {/* <View></View> */}
      </View>
      {/* BLOC RECETTE SELECTED  */}
      <Animatable.View
              animation="slideInDown"
              duration={700}
               style={styles.pictureBloc}>
        <Text style={styles.sectionsTitle}>{selectedRecipe.name}</Text>
        <View style={styles.imageContainer}>
          <Image style={styles.imagePlaceholder} source={imageRecipe[`${selectedRecipe.picture}` || null]}/>{/*{{ uri: selectedRecipe.picture}}/>*/}
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
          <View style={styles.icons}>
            <View style={styles.stars}>{stars}<Text>({votes.length})</Text></View>
            <Popover 
              isVisible={showPopoverVote}
              onRequestClose={()=> setShowPopoverVote(false)}
              from={(
                <TouchableOpacity style={styles.btnReturn} activeOpacity={0.8} onPress={() => handleVote()}>
                  <FontAwesome name='angle-double-right' size={30} color={'white'}/>
                </TouchableOpacity>
              )}>
              <View style={styles.popover}>
                <Text>You can unlock this feature by Signing in ! </Text>
              </View>
            </Popover>
          </View>
        <View style={styles.textUnder}>
          <Text style={styles.infos}>
            Prep: {selectedRecipe.preparationTime} min
          </Text>
          <Text style={styles.infos}>
            Difficulty: {selectedRecipe.difficulty}/5
          </Text>
        </View>
      </Animatable.View>

      {/* BLOC DESCRIPTION*/}
      <Animatable.View
              animation="slideInRight"
              duration={700}
              style={styles.descriptionBloc}>
        <Text style={styles.sectionsTitle}>Description</Text>
        <ScrollView >
          <View style={styles.content}>
            <Text>{selectedRecipe.description}</Text>
          </View>
        </ScrollView>
      </Animatable.View>

      {/* BLOC INGREDIENTS */}
      <Animatable.View
              animation="slideInLeft"
              duration={600}
              style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Ingredients</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {ingredients}
          </View>
        </ScrollView>
      </Animatable.View>

      {/* BLOC STEPS */}
      <Animatable.View
          animation="slideInRight"
          duration={700}
          style={styles.recipeBloc}>
        <Text style={styles.sectionsTitle}>Étapes</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {steps}
          </View>
        </ScrollView>
      </Animatable.View>

      <View style={styles.separator} />

      {/* BOUTON  */}
      <MyButton
        dataFlow={() => navigation.navigate("MoreFeatures")}
        text="More Features"
        buttonType={buttonStyles.buttonTwo}
      />

       {/* BLOC COMMENTAIRES */
      comments.length>0 && <Animatable.View
      animation="slideInUp"
      duration={700}
      style={styles.commentsBloc}>
    <Text style={styles.sectionsTitle}>Commentaires</Text>
    <ScrollView >
      {comments}
    </ScrollView>
  </Animatable.View>}

      <Modal visible={modalVisible} animationtType="none" transparent>
        <View style={styles.modal}>
          <Animatable.View
              ref={modalRef}
              animation="slideInDown"
              duration={700}
              style={styles.modalContainer}
            >
            {starsVotes}
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    height:'200%',
    alignItems: "center",
    backgroundColor: css.backgroundColorOne,
    paddingTop: '15%',
  },
  
  header: {
    flex: 0,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  titlePage: {
    width: '70%',
    fontSize: css.fontSizeFive,
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

  icons:{
    flexDirection:'row',
    justifyContent:'space-between'
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

  descriptionBloc: {
    width: "90%",
    height: 70,
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
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
    marginTop:10,
    width: "90%",
    height:300,
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

  modal:{
    height:'100%',
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  modalContainer:{
    flexDirection:'row',
    backgroundColor:'white',
    borderRadius: 20,
    padding: 20,
    alignItems:'center',
    justifyContent:'center',
    width:'80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
});
