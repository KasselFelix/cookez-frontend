import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Modal, Image} from "react-native";
import React, {useState, useEffect, useRef} from "react";
import { useSelector } from "react-redux";
import Popover from "react-native-popover-view";
import * as Animatable from 'react-native-animatable';
import FontAwesome from "react-native-vector-icons/FontAwesome";
// CSS
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
// MODULES
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import addressIp from "../modules/addressIp";
import imageRecipe from "../modules/images";
// COMPONENTS
import Comments from "../components/Comments";

export default function RecipeScreen({ route, navigation }) {

  // DATA NAVIGATE FROM COMPONENTS RECIPE 
  const selectedRecipe = route.params.props
  const votes = route.params.votes

  const user = useSelector((state)=>state.user.value);

  /* HOOK STATE FOR THE HEART LOGO ON THE RECIPE*/
  const [like, setLike] = useState(false);
  const [showPopover, setShowPopover]=useState(false);
  const [showPopoverVote, setShowPopoverVote]=useState(false);
  const [modalVisible,setModalVisible]=useState(false);
  const [starNote,setStarNote]=useState(0);
  const [action,setAction]=useState(false);
  const [allComments, setAllComments] = useState([])

  // Animatable ?
  const modalRef = useRef(null);

  // AUTO CLOSE THE POPOVER 
  useEffect(() => {
    setTimeout(() => setShowPopover(false), 5500);
    setTimeout(() => setShowPopoverVote(false), 5500);
  }, [])


  // HNADLE VOTE RECIPE 1/3
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
  
  // 2/3
  useEffect(() => {
    if (user.token) { 
      handleFetchVote(starNote);
    }
  }, [starNote]);
  
  // 3/3
  const handleVote=()=>{
    if(user.token ){
      setModalVisible(true)
    }else{
      setShowPopoverVote(true)
    }
  }

  // HANDLE FAVORITE HEART 3/3
  const handleFetchLike = async () => {
    setAction(true)
    const response = await fetch(`http://${addressIp}:3000/recipes/updateFavorite`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username, 
        _id: selectedRecipe._id, 
        action
      })
    });
    const data =  await response.json();
    if (data.result) {
      setLike(data.like);
      route.params.update()
    }
  }

  // 2/3
  useEffect(() => {
    if(user.token){
      handleFetchLike();
    }
  }, []);
  
  // 3/3 CONDITIONAL FUNCTION TO CHANGE HEART COLOR UPON CLICKING FOR LOGGED IN USER VERSION
  const handleLikeRecipe =() => {
    if(user.token){
      handleFetchLike()
    }else{
      setShowPopover(true)
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
          style={styles.stars}
        />
      </TouchableOpacity>
    );
  }

  
  const ingredients= selectedRecipe.ingredients.map((e,i)=>{
      return <Text key={i}> ● {e.quantity}g {e.name}</Text>
  })
  
  const steps= selectedRecipe.steps.map((text,i)=>{
    return <Text key={i}>{i+1}. {text}</Text>
  })
  
  // FETCH GETS ALL USERS WHO VOTED UP/DOWN 1/3
  const handleUpDownVoteByUser = async () => {
    try {
      const response = await fetch(`http://${addressIp}:3000/comments/byRecipe`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          recipe: selectedRecipe._id
        })
      });
      const data = await response.json()
      if (data.result) {
        const comments = data.comments.map(e => e)
        setAllComments(comments)
      }
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  };
    
  // 2/3
    useEffect(() => {
      handleUpDownVoteByUser()
    }, []);
    
    // 3/3
      const commentsDisplay= allComments.map((e,i)=>{
        return <Comments key={i} {...e} update={route.params.update} alreadyUp={e.usersAlreadyUpVoted.includes(user.username)} alreadyDown={e.usersAlreadyDownVoted.includes(user.username)} upDownCountInitial={e.usersAlreadyUpVoted.length - e.usersAlreadyDownVoted.length}/*handleUpCommentRecipeScreen={handleUpCommentRecipeScreen}*/ />
      });
    
    return (
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.goBack()}
          text={<FontAwesome name="angle-double-left" size={30} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>{selectedRecipe.name}</Text>
        { user.token ? <MySmallButton
          dataFlow={() => navigation.navigate('TabNavigator',{screen:'userDashboard'})}
          text={<FontAwesome name="home" size={25} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        /> :
        <MySmallButton
          dataFlow={() => navigation.navigate('Home')}
          text={<FontAwesome name="home" size={25} color={"white"} />}
          buttonType={buttonStyles.buttonSmall}
        />}
      </View>
      <ScrollView> 

      {/* BLOC RECETTE SELECTED  */}
        <View style={styles.recipeContainer}>
          <Animatable.View animation="slideInDown" duration={700} style={styles.pictureBloc}>
            <View style={styles.firstContainer}>
              <Text style={styles.sectionsTitle}>{selectedRecipe.origin}</Text>
            </View>
            <View style={styles.imageContainer}>
              <Image style={styles.imagePlaceholder} source={imageRecipe[`${selectedRecipe.picture}` || null]}/>{/*{{ uri: selectedRecipe.picture}}/>*/}
                <Popover 
                  placement="floating"
                  backgroundStyle={styles.popoverBackground}
                  isVisible={showPopover}
                  onRequestClose={()=> setShowPopover(false)}
                  from={(
                  <TouchableOpacity style={styles.favoriteButton} onPress={()=> {handleLikeRecipe();}}>
                    <FontAwesome name="heart" size={24} color={like?"#E45858":"grey"} />
                  </TouchableOpacity>
                  )}>
                  <View style={styles.popoverContainer}>
                    <Text>You can unlock this feature by Signing in ❤️</Text>
                  </View>
                </Popover>
              </View>
              <View>
              <View style={styles.voteContainer}>
              <Popover 
                placement="floating"
                backgroundStyle={styles.popoverBackground}
                isVisible={showPopoverVote}
                onRequestClose={()=> setShowPopoverVote(false)}
                from={(
                  <TouchableOpacity style={styles.voteBtn} activeOpacity={0.8} onPress={() => handleVote()}>
                    <View style={styles.starsContainer}>{stars}</View>
                  </TouchableOpacity>
                )}>
                <View style={styles.popoverContainer}>
                  <Text>You can unlock this feature by Signing in ❤️ </Text>
                </View>
              </Popover>


                <Text>Votes: {votes?.length}</Text>
              </View>
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
                  style={styles.ingredientsBloc}>
            <Text style={styles.sectionsTitle}>Ingredients</Text>
            <View style={styles.content}>
              {ingredients}
            </View>
          </Animatable.View>

          {/* BLOC STEPS */}
          <Animatable.View
              animation="slideInRight"
              duration={700}
              style={styles.stepsBloc}>
            <Text style={styles.sectionsTitle}>Étapes</Text>
            <View style={styles.content}>
              {steps}
            </View>
          </Animatable.View>
        </View>
      </ScrollView>

      {/* BLOC COMMENTS */}
      { commentsDisplay.length > 0 && 
      <ScrollView horizontal  contentContainerStyle={styles.CommentScrollView}>
        {commentsDisplay}
      </ScrollView> }


      {/* BOUTON  */}
      <View style={styles.separator} />
      { !user.token &&
      <View style={styles.moreFeaturesBtn}>
        <MyButton
          dataFlow={() => navigation.navigate("MoreFeatures")}
          text="More Features"
          buttonType={buttonStyles.buttonTwo}
        />
      </View>
      }
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
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
    backgroundColor: css.backgroundColorOne,
  }, 
  
  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  titlePage: {
    fontSize: css.fontSizeFive,
  },

  btnEmpty: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    marginBottom: '4%',
    borderRadius: 10,
  },

  recipeContainer: {
    // flex: 1,
    alignItems: 'center',
  },

  scrollViewMain: {
    marginHorizontal: '7%',
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

  firstContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2%',
  },

  voteBtn: {
    width: 120,
    height: 25,
    justifyContent: 'center'
,   alignItems: 'center',
    borderRadius: 10,
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

  popoverBackground: {
    backgroundColor: 'transparent',
  },

  popoverContainer:{
    width:300,
    height:70,
    textAlign:'center',
    alignItems:'center',
    justifyContent:'center',
    paddingTop: '2%',
  },

  favoriteButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },

  voteContainer: {
    flex: 0, 
    flexDirection: 'row',
    alignItems:'flex-end',
    justifyContent:'space-between',
  },

  starsContainer: {
    flexDirection: 'row',

  },

  stars: {
    borderWidth: 2,
    borderColor: 'yellow',
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
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  ingredientsBloc: {
    width: "90%",
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  
  stepsBloc: {
    width: "90%",
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

  CommentScrollView: {
    height: 200,
    width: 1100,
  },

  commentsBloc: {
    marginTop:10,
    width: "90%",
    backgroundColor: css.backgroundColorTwo,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  content: {
    paddingBottom: 100,
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

  moreFeaturesBtn: {
    margin: '2%',
  }
});
