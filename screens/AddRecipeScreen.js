import React, {useEffect, useState} from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions
} from "react-native";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import RNPickerSelect from 'react-native-picker-select';
import addressIp from "../modules/addressIp";
import { useDispatch, useSelector } from "react-redux";
import IngredientsList from "../components/IngredientsList";
import StepsList from "../components/StepsList";
import PickImage from "../components/PickImage";
import TakePhoto from "../components/TakePhoto";
import { removePictureToStore } from "../reducers/picture";

const { width, height } = Dimensions.get('window');

export default function AddRecipeScreen({navigation}) {

  // ETATS POUR LES PICKERS \\
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [selectedNumber2, setSelectedNumber2] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  //ETATS POUR CHAQUE INPUT \\
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeServings, setRecipeServings] = useState("");
  const [recipeDifficulty, setRecipeDifficulty] = useState("");
  const [recipePreptime, setRecipePreptime] = useState("");
  const [recipeCooktime, setRecipeCooktime] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [recipeUnit, setRecipeUnit] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeSteps, setRecipeSteps] = useState("");
  const [recipePicture, setRecipePicture] = useState("");

  // //ETATS POUR LA LISTE DES INGREDIENTS\\
  const [ingredientsList, setIngredientsList] = useState([]);
  // const [stepsList, setStepsList] = useState([]); //////////////////////////// A VOIR
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);


  //ETATS POUR LES HANDLES \\
  const [recipe, setRecipe] = useState("");
  const [stepsArray, setStepsArray] = useState([]);

  // Reducer user 
  const user = useSelector((state) => state.user.value);
  const picture = useSelector((state)=>state.picture.value);
  const dispatch = useDispatch()

  useEffect(()=>{
    dispatch(removePictureToStore())
  },[])

  const handleAddRecipe = () => {
    if(user && user.token){
//     console.log('pass')
//     console.log({
//       username: user.username, 
//       name: recipeName,
//       ingredients: ingredientsList, 
//       difficulty: recipeDifficulty, 
//       picture:`${recipeName}.jpg`, 
//       preparationTime:recipePreptime, 
//       cookingTime: recipeCooktime,
//       // unit:recipeUnit,
//       description:recipeDescription, 
//       servings:recipeServings, 
//       steps:stepsArray,
//       // comments:[],
      console.log('PICTURE',picture)
      const date=Date.now();
      const formData = new FormData();
      formData.append('photoFromFront', {
          uri: picture,
          name: `${recipeName}_${date}.jpg`,
          type: 'image/jpeg',
      });
      fetch(`http://${addressIp}:3000/upload/${recipeName}_${date}`, {
          method: 'POST',
          body: formData,
      })
      .then((response) => response.json())
      .then((data) => {
          if(data.result){
              console.log('NOW: ', data.url)
              // if(name && origin && ingredients.lenght>0 && difficulty && preparationTime && description && steps.length>0) {
              fetch(`http://${addressIp}:3000/recipes/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                      username: user.username,
                      name: recipeName,
                      date:date, 
                      origin:null,
                      ingredients: ingredientsList, 
                      difficulty: recipeDifficulty,
                      votes:[], 
                      picture:`${recipeName}_${date}`, 
                      preparationTime:recipePreptime, 
                      cookingTime: recipeCooktime,
                      description:recipeDescription, 
                      servings:recipeServings, 
                      steps:stepsArray,
                      comments:[],
                })
              })
              .then((res)=> res.json())
              .then((data) => {
                console.log('data:', data);
                      if (data.result){
                        alert("Recipe successfully added !")
                        setIngredientsList([])
                        setRecipe("")
                        setRecipeCooktime("")
                        setRecipeDescription("")
                        setRecipeDifficulty("")
                        setRecipeName("")
                        setRecipeIngredients("")
                        setRecipeName("")
                        setRecipePicture("")
                        setRecipePreptime("")
                        setRecipeQuantity("")
                        setRecipeServings("")
                        setRecipeSteps("")
                        setRecipeUnit("")
                        setStepsArray([])
                        dispatch(removePictureToStore())
                      }else {
                        alert(data.error);
                      }
              })
              .catch((error)=> {
                  alert(error);
              });
          }
      })
      .catch(error => console.error('There has been a problem with your fetch operation:', error));
     
      console.log({
        username: user.username, 
        name: recipeName,
        ingredients: ingredientsList, 
        difficulty: recipeDifficulty, 
        picture:`${recipeName}_${date}.jpg`, 
        preparationTime:recipePreptime, 
        cookingTime: recipeCooktime,
        // unit:recipeUnit,
        description:recipeDescription, 
        servings:recipeServings, 
        steps:stepsArray,
        // comments:[],
      })
    }
    // }
  };

  //Fonction pour ajouter un ingrédient à la liste:
  const handleAddIngredient=()=>{
    if (recipeQuantity && recipeUnit && recipeIngredients) {
      setIngredientsList([...ingredientsList,
        {id: Date.now().toString(), quantity: parseFloat(recipeQuantity), unit: recipeUnit, name: recipeIngredients },
      ]);
      setRecipeQuantity('');
      setRecipeUnit('');
      setRecipeIngredients('');
    }
  };
  // console.log('ADDED INGREDIENT:', ingredientsList);

  //Fonction pour supprimer un ingrédient de la liste
  const handleDeleteIngredient = (id) => {
    setIngredientsList(ingredientsList.filter((ingredient)=> ingredient.id !== id));
  };

  //Fonction pour compter le nombre d'ingrédients ajoutés
  const ingredientCount = ingredientsList.length;

  //Fonction pour compter le nombre de steps ajoutés
  const stepCount = stepsArray.length;

  // Fonction pour ajouter une étape
  const handleAddSteps=()=>{
    if(recipeSteps) {
      //const stepNumber = stepsArray.length + 1; // Numéro de l'étape
      const stepText = `${recipeSteps}`; // Préfixe de l'étape
      setStepsArray([...stepsArray, stepText]); // Ajouter l'étape avec le préfixe
      // setStepsArray([...stepsArray, recipeSteps ]);
      setRecipeSteps("");
    }
  };
  // Fonction pour supprimer un step
  const handleDeleteStep = (stepToDelete) => {
    setStepsArray(stepsArray.filter(step => step !== stepToDelete));
  };

  // Menus déroulant pour servings, difficulty et unités de mesure
  const numbers = Array.from({ length: 6 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const numbers2 = Array.from({ length: 5 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const units = [
    { label: "g", value: "g  " },
    { label: "kg", value: "kg  " },
    { label: "liter", value: "L  " },
    { label: "ml", value: "ml  " },
    { label: "cl", value: "cl  " },
    { label: "tbsp", value: "tbsp  " },
    { label: "tsp", value: "tsp  " },
  ];


  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.container}>
      <View style={styles.header}>
        {/* <View style={styles.buttonReturn}> */}
          <MySmallButton
        	dataFlow={()=>navigation.goBack()}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
      {/* </View> */}
        <Text style={styles.titlePage}>Add your recipe 🍳</Text>
        <View style={styles.btnEmpty}></View>
      </View>
      <View style={styles.formBloc}>
        <View style={styles.formContainer}>
          <ScrollView style={styles.scroll}>
            {/* SECTION RECIPE : TITLE - DESCRIPTION  - SETTINGS*/}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipe______________________________</Text>
              <TextInput placeholder='name*' placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipeName(value)} value={recipeName}/>
              <TextInput placeholder='description*' placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipeDescription(value)} value={recipeDescription}/>
              < View style={styles.settings}>
                <View style={styles.servingBloc}>
                  <Text  style={styles.label}>servings:</Text>
                    <RNPickerSelect
                    value={recipeServings}
                    onValueChange={(value) => setRecipeServings(value)}
                    items={numbers}
                    placeholder={{ label: "0", value: null }}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false} // Permet de personnaliser le style sur Android
                    />
                  <Text style={styles.unit}>pers.  </Text>
                </View>
                <View style={styles.difficultyBloc}>
                  <Text style={styles.label}>difficulty:</Text>
                  <RNPickerSelect
                  onValueChange={(value) => setRecipeDifficulty(value)}
                  items={numbers2}
                  placeholder={{ label: "0", value: null }}
                  style={pickerSelectStyles} 
                  useNativeAndroidPickerStyle={false}
                  />
                <Text style={styles.unit}>/5</Text>
                </View>          
              </View>
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInput1}>
                  <View>
                    <Text>preparation:</Text>
                  </View>
                  <View style={styles.inputRow1}>
                    <TextInput placeholder='0' keyboardType="numeric" maxLength={5} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipePreptime(value)} value={recipePreptime}/>
                    <Text style={styles.unit}>min.  </Text>
                  </View>
                </View>
                  <View style={styles.timeInput2}>
                    <View>
                      <Text>cooking:</Text>
                    </View>
                    <View style={styles.inputRow2}>
                      <TextInput placeholder='0'  keyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipeCooktime(value)} value={recipeCooktime}/>
                      <Text style={styles.unit}>min.  </Text>
                    </View>
                  </View>
              </View>
            </View>
                            {/* SECTION INGREDIENTS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients _________________________</Text>
              <View style={styles.ingredientBloc}>
                <TextInput placeholder='Qty'  keyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.quantityInput} onChangeText={(value) => setRecipeQuantity(value)} value={recipeQuantity}/>
                <RNPickerSelect
                onValueChange={(value) => setRecipeUnit(value)}
                items={units}
                placeholder={{ label: "units", value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                />
                <TextInput placeholder='Ingredient*' placeholderTextColor={'grey'} style={styles.ingredientInput}  onChangeText={(value) => setRecipeIngredients(value)} value={recipeIngredients}/>
              </View>
              {/* Affichage du compteur d'ingrédients */}             
              <Text style={styles.counterText}>ingredients added: {ingredientCount}</Text>              
                      {/* Bouton pour ajouter un ingrédient */}
              <View style={styles.buttonsBloc}>
                  {/* Bouton pour afficher la MODAL */}
                  <TouchableOpacity style={styles.showButton} onPress={()=>{setModalVisible(true)}}>
                  <Text style={styles.addButtonText}>Show ingredients</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>  
                  <Text style={styles.addButtonText}>Add ingredient</Text>
                </TouchableOpacity>
               </View>
               {modalVisible &&
              <IngredientsList
                ingredientsList={ingredientsList}
                setModalVisible={setModalVisible}
                modalVisible={modalVisible}
                setIngredientsList={setIngredientsList} 
                handleDeleteIngredient={handleDeleteIngredient}
              />
               }
            </View>
                          {/* SECTION PREPARATION STEPS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Steps ______________________________</Text>
              <View style={styles.stepsInput}>
                <TextInput placeholder='step*' placeholderTextColor={'grey'} style={styles.formInput}  onChangeText={(value) => setRecipeSteps(value)} value={recipeSteps} multiline={true} textAlignVertical="top"/>
              </View>
                           {/* Affichage du compteur d'étapes */}             
              <Text style={styles.counterText}>steps added: {stepCount}</Text>
              <View style={styles.buttonsBloc}>
              <TouchableOpacity style={styles.showButton} onPress={()=>{setModalVisible2(true)}}>
                  <Text style={styles.addButtonText}>Show steps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() =>{handleAddSteps()}}>
                  <Text style={styles.addButtonText}>Add step</Text>
                </TouchableOpacity>
              </View>
              {modalVisible2 &&   
              <StepsList        
                stepsArray={stepsArray}
                setModalVisible2={setModalVisible2}
                modalVisible2={modalVisible2}
                setStepsArray={setStepsArray} 
                handleDeleteStep={handleDeleteStep}
              />
               }
            </View>
                                  {/* SECTION PICTURE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Picture _____________________________</Text>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {picture ?
                    <Image source={{ uri: picture }} style={{ width: 200, height: 200,borderRadius:20, borderWidth:5, borderColor:css.inactiveButtonColor }} />:
                    <View style={styles.pictureLogo}> 
                        <TakePhoto name={recipeName}/>
                        <PickImage name={recipeName}/>
                    </View>
                  }
                </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <MyButton
          dataFlow={() => handleAddRecipe()}  
          text="Add Recipe"
          buttonType={buttonStyles.buttonThree}
        />
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: width * 1,  
    height: height * 1, 
    paddingVertical: '15%',
    backgroundColor: css.backgroundColorOne
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    fontSize: css.fontSizeFive,
  },

  btnReturn: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.inactiveButtonColor,
    color: css.backgroundColorOne,
    marginBottom: '4%',
    borderRadius: 10,
  },

  btnEmpty: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    marginBottom: '4%',
    borderRadius: 10,
  },

  formBloc:{
    height: '80%',
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: css.activeButtonColor,
    elevation: 5,
    marginBottom:'3.5%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  
  formContainer:{
    width: '95%',
    height: '95%',
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: css.activeButtonColor,
    borderRadius: 20,
    borderColor: css.activeButtonColor,
    padding: 10,    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 10,
  },

  scroll: {
    width:'100%',
  },

  section:{
    marginBottom: 2, 
    marginVertical: 8,
    width: '100%',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: css.inactiveButtonColor,
  },

  pictureLogo: {
    flexDirection:'row',
    justifyContent:'space-around',
    width:'100%',
  },

  formInput:{
    flex: 1, 
    width: '100%',
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    fontSize: 12,
    backgroundColor: "white",
  },

  formInputSmall: {
    flex: 1,
    width: "75%",
    height:40,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    padding: 8,
    fontSize: 12,
    backgroundColor: "white",
  },

  settings:{
    flexDirection: 'row',
    justifyContent:'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    // flexWrap: 'wrap',
  },

  servingBloc:{
    flexDirection: 'row',
    alignItems: 'center',
  },

  difficultyBloc:{
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },

  label: {
    fontSize: 14,
    marginRight: 8,
    marginLeft: 2,
    color: css.inactiveButtonColor,
  },

  unit: {
    fontSize: 14,
    marginLeft: 5,
    color: css.inactiveButtonColor,
  },

  timeInputsContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 50,
  },

  timeInput1:{
    // flex:1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
  },

  timeInput2:{
    flex:0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // paddingLeft: 10,
    alignItems:'center',
    width: '50%',
  },

  inputRow1:{
    width: '50%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  },
  
  inputRow2:{
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ingredientBloc:{
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  quantityInput:{
    width: 50,
    height: 42,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: "white",
    marginRight: 2,
  },

  ingredientInput: {
    flex: 1,
    height: 42,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: "white",
    marginLeft: 2,
  },

  counterText:{
    fontSize: css.fontSizeEight,
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  buttonsBloc:{
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: css.inactiveButtonColor,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "flex-end",
    width: '40%',
  },
  showButton:{
    backgroundColor: css.inactiveButtonColor,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    width: '40%',
  },
  addButtonText: {
    color: css.backgroundColorOne,
    fontSize: 12,
  },
})

const pickerSelectStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  
  inputIOS: {
    width: 50,
    height: 40,
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    backgroundColor: 'white',
    color: 'black',
  },
  inputAndroid: {
    width: 50,
    height: 40,
    fontSize: 12,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: css.inactiveButtonColor,
    borderRadius: 5,
    backgroundColor: 'white',
    color: 'black',
  },
})