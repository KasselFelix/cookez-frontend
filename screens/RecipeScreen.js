import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Modal, Image,  RefreshControl} from "react-native";
import React, {useState, useEffect, useRef} from "react";
import { useSelector } from "react-redux";
import Popover from "react-native-popover-view";
import * as Animatable from 'react-native-animatable';
import FontAwesome from "react-native-vector-icons/FontAwesome";
// CSS
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import addressIp from "../modules/addressIp";
import imageRecipe from "../modules/images";
// COMPONENTS
import Comments from "../components/Comments";

export default function RecipeScreen({ route, navigation }) {

  // DATA NAVIGATE FROM COMPONENTS RECIPE 
  const selectedRecipe = route.params.props
  const votes = route.params.votes

  const user = useSelector((state)=>state.user.value);

  // HOOK STATE FOR THE HEART LOGO ON THE RECIPE
  const [like, setLike] = useState(false);
  const [showPopover, setShowPopover]=useState(false);
  const [showPopoverVote, setShowPopoverVote]=useState(false);
  const [modalVisible,setModalVisible]=useState(false);
  const [starNote,setStarNote]=useState(0);
  const [action,setAction]=useState(false);
  const [allComments, setAllComments] = useState([])
  const [refreshing, setRefreshing] = React.useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [inputMessage,setInputMessage]=useState('');
  const [modalVisibleAddComment, setModalVisibleAddComment] = useState(false);

  const modalRef = useRef(null);

  // AUTO CLOSE THE POPOVER 
  useEffect(() => {
    setTimeout(() => setShowPopover(false), 5500);
    setTimeout(() => setShowPopoverVote(false), 5500);
    fetchImageUrl();
    console.log('IMAGEURL',imageUrl)
  }, [])

  useEffect(() => {
    fetchImageUrl();
  }, [imageUrl]);

  const onRefresh = React.useCallback(() => {
    console.log('REFRESH')
    setRefreshing(true);
    route.params.update();
    fetchImageUrl();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const fetchImageUrl = async () => {
    try {
      const date = new Date(selectedRecipe.date).getTime();
      const response = await fetch(`http://${addressIp}:3000/download/${selectedRecipe.name}_${date}`);
      const data = await response.json();
      if (data.result) {
        setImageUrl(data.imageUrl);
      } else {
        console.error('Error fetching image:', data.error);
      }
    } catch (error) {
      console.error('Fetch image error:', error);
    }
  };

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

  // HANDLE FAVORITE HEART 1/3
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
  
  const fetchAddComment = async () => {
    try {
      const response = await fetch(`http://${addressIp}:3000/comments/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          token: user.token,
          message: inputMessage,
          recipe: selectedRecipe._id,
        })
      });
      const data =  await response.json();
      if (data.result) {
        console.log('DATA',data)
        console.log('Comment added successfully:', data.comment);
        setModalVisibleAddComment(false);
        setInputMessage('');
        route.params.update()
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

  const handleAddComment =() => {
    if(user.token){
      setModalVisibleAddComment(true)
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
        color={i < route.params.note ? "#FAFA00" : "#A9A9A9" }
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
      <View style={styles.container}>
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
          
        {/* BLOC RECETTE SELECTED  */}
        <View style={ commentsDisplay.length > 0 ? (user.token ? styles.recipeContainerAdjustLogged : styles.recipeContainerAdjust ) : styles.recipeContainer}>
          <ScrollView
            style={styles.scrollViewMain}
            contentContainerStyle={{alignItems:'center'}}
            refreshControl={<RefreshControl /*refreshing={refreshing} onRefresh={onRefresh}*//>}>
            <Animatable.View animation="slideInDown" duration={700} style={ imageRecipe[`${selectedRecipe.picture}`] ? styles.pictureBloc :styles.pictureBlocURL }>
              <View style={styles.firstContainer}>
                <Text style={styles.sectionsTitle}>{selectedRecipe.origin}</Text>
              </View>
              <View style={styles.imageContainer}>
                {imageRecipe[`${selectedRecipe.picture}`]? 
                  <Image style={ styles.imagePlaceholderURI } source={ imageRecipe[`${selectedRecipe.picture}`]}/>:
                  <Image style={ styles.imagePlaceholderURL } source={ { uri: imageUrl  || null} }/>}
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
            <Text style={styles.sectionsTitle}>Steps</Text>
            <View style={styles.content}>
              {steps}
            </View>
          </Animatable.View>
          </ScrollView>
        </View>
  
        {/* BLOC COMMENTS */}
        { commentsDisplay.length > 0 ? 
        <View style={styles.commentsBloc}>
          <ScrollView horizontal  contentContainerStyle={styles.CommentScrollView}>
            {commentsDisplay}
          </ScrollView> 
        </View> : 
        <Popover 
          placement="floating"
          backgroundStyle={styles.popoverBackground}
          isVisible={showPopover}
          onRequestClose={()=> setShowPopover(false)}
          from={(
            <TouchableOpacity style={styles.commentIcon} onPress={() => handleAddComment()}>
              <FontAwesome name="comments" size={30} color={user.token?css.inactiveButtonColor:'grey'} />
            </TouchableOpacity>
          )}>
          <View style={styles.popoverContainer}>
            <Text>You can unlock this feature by Signing in ❤️</Text>
          </View>
        </Popover>}
    
        {/* BOUTON  */}
        { !user.token &&
        <View style={styles.footer}>
          <View style={styles.separator} />
            <View style={styles.moreFeaturesBtn}>
              <MyButton
                dataFlow={() => navigation.navigate("MoreFeatures")}
                text="More Features"
                buttonType={buttonStyles.buttonTwo}
              />
            </View>
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
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisibleAddComment}
          onRequestClose={() => setModalVisibleAddComment(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Add a Comment</Text>
              <TextInput
                style={styles.input}
                placeholder="Type your comment..."
                value={inputMessage}
                onChangeText={(text) => {
                  if (text.length <= 250) {
                    setInputMessage(text);
                  }
                }}
                multiline={true}
                numberOfLines={4}
                maxLength={250} // Empêche la saisie au-delà de la limite
              />
              <Text style={styles.charCount}>
                {inputMessage.length}/250
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonCancel]} 
                  onPress={() => setModalVisibleAddComment(false)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonAdd]} 
                  onPress={()=>fetchAddComment()}
                >
                  <Text style={styles.textStyle}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>    
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    height:'100%',
    paddingTop: '15%',
    alignItems:'center',
    backgroundColor: css.backgroundColorTwo,
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

  recipeContainer: {
    width:'100%',
    height:'80%',
    paddingBottom:'auto',
    overflow:'hidden',
  },

  recipeContainerAdjust: {
    width:'100%',
    height: '60%',
    paddingBottom:'auto',
    overflow:'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recipeContainerAdjustLogged: {
    width:'100%',
    height: '70%',
    paddingBottom:'auto',
    overflow:'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollViewMain: {
    width:'100%',
    height:'auto',
    overflow:'visible',
  },

  pictureBloc: {
    justifyContent:'flex-start',
    width: "90%",
    height: "32%",
    backgroundColor: css.backgroundColorOne,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  pictureBlocURL: {
    justifyContent:'flex-start',
    width: "90%",
    height: '50%',
    backgroundColor: css.backgroundColorOne,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  
  sectionsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },

  firstContainer: {
    paddingTop:'2%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  voteBtn: {
    width: 120,
    height: 25,
    justifyContent: 'center'
,   alignItems: 'center',
    borderRadius: 10,
  },

  imageContainer: {
    justifyContent:'flex-Start',
    height:'58%',
    marginBottom:'2%',
  },

  imagePlaceholderURL: {
    height:'100%',
    width : '100%',
    resizeMode:'cover', 
    borderRadius: 8,
  },

  imagePlaceholderURI: {
    height:'100%',
    width : '100%',
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

  textUnder: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  infos: {
    fontSize: 12,
  },

  // content: {
  //   paddingBottom: 50,
  // },
  
  descriptionBloc: {
    width: "90%",
    backgroundColor: css.backgroundColorOne,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  ingredientsBloc: {
    width: "90%",
    backgroundColor: css.backgroundColorOne,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  
  stepsBloc: {
    width: "90%",
    backgroundColor: css.backgroundColorOne,
    padding: 10,
    borderRadius: 8,
    paddingBottom: 200,
  },

  separator: {
    height: 1,
    width: "90%",
    backgroundColor: "black",
    marginBottom: '2%'
  },

  CommentScrollView: {
    height: 200,
    width: 1100,
  },

  commentsBloc: {
    height:'20%',
    alignItems:'center',
    justifyContent:'center',
    marginTop: 10,
    width: "90%",
    backgroundColor: css.backgroundColorOne,
    padding: 10,
    borderRadius: 8,
  },

  CommentScrollView: {
    height: 200,
    width: 'auto',
  },

  footer: {
    alignItems:'center',
    marginTop:'auto',
    width:'100%',
    height:'auto',
    alignSelf:'flex-end',
    justifyContent:'flex-end',
  },

  scrollView: {
    flex: 1,
  },

  commentIcon: {
    margin: 5,
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

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },

  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
  },

  input: {
    width: '100%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },

  charCount: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    color: '#888',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },

  buttonCancel: {
    backgroundColor: '#f44336',
  },

  buttonAdd: {
    backgroundColor: '#4CAF50',
  },

  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  moreFeaturesBtn: {
    margin: '2%',
  }
});
