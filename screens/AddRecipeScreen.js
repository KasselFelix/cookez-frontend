import React, {useState} from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import RNPickerSelect from 'react-native-picker-select';
import addressIp from "../modules/addressIp";
import { useSelector } from "react-redux";
import IngredientsList from "./IngredientsList";
import StepsList from "./StepsList";

export default function AddRecipeScreen({navigation}) {
  // const dispatch = useDispatch();

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
  // const [ingredient, setIngredient] = useState([]);
  const [stepsArray, setStepsArray] = useState([]);

// Reducer user 
const user = useSelector((state) => state.user.value);

const handleAddRecipe = () => {
  if(user && user.token){
    console.log('pass')
    console.log({
      username: user.username, 
      name: recipeName,
      ingredients: ingredientsList, 
      difficulty: recipeDifficulty, 
      picture:`${recipeName}.jpg`, 
      preparationTime:recipePreptime, 
      cookingTime: recipeCooktime,
      // unit:recipeUnit,
      description:recipeDescription, 
      servings:recipeServings, 
      steps:stepsArray,
      // comments:[],
})
    // if(name && origin && ingredients.lenght>0 && difficulty && preparationTime && description && steps.length>0) {
      fetch(`http://${addressIp}:3000/recipes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
              username: user.username, 
              name: recipeName,
              ingredients: ingredientsList, 
              difficulty: recipeDifficulty, 
              picture:`${recipeName}.jpg`, 
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
        }else {
          alert(data.error);
        }
      })
      .catch((error)=> {
        alert(error);
      });
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
    const stepNumber = stepsArray.length + 1; // Numéro de l'étape
    const stepText = `Step ${stepNumber}: ${recipeSteps}`; // Préfixe de l'étape
    setStepsArray([...stepsArray, stepText]); // Ajouter l'étape avec le préfixe
    console.log('array',stepsArray)
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
        <View style={styles.buttonReturn}>
          <MySmallButton
        	dataFlow={()=>navigation.goBack()}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
      </View>
        <Text style={styles.titlePage}>Add your recipe 🍳</Text>
      </View>
      <ScrollView>
        <View style={styles.formBloc}>
          <View style={styles.formContainer}>
                        {/* SECTION RECIPE : TITLE - DESCRIPTION  - SETTINGS*/}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipe______________________________</Text>
              <TextInput placeholder='title*' placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipeName(value)} value={recipeName}/>
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
              <View style={styles.stepsInput}>
                <TextInput placeholder='add a picture' placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipePicture(value)} value={recipePicture}/>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: '6%', //pour monter le titre de la page
    backgroundColor: css.backgroundColorOne,
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 10, //pour que le titre ne monte pas trop haut
   },

   buttonReturn:{
    height: '100%',
    width: '10%',
    marginRight: 60,
   },
  titlePage: {
    paddingRight: '5%',
    fontSize: css.fontSizeFive,
    
  },
  formBloc:{
    flex:1,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    backgroundColor: css.activeButtonColor,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  formContainer:{
    flex:1,
    width: '98%',
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
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 5,
    marginRight: 1,
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
    // backgroundColor: 'pink',
  },
  servingBloc:{
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'green',
  },
  difficultyBloc:{
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'orange',
    marginRight: 5,
  },
  label: {
    fontSize: 14,
    marginRight: 8,
    marginLeft: 2,
    // backgroundColor: 'yellow',
    color: css.inactiveButtonColor,
  },
  unit: {
    fontSize: 14,
    marginLeft: 5,
    color: css.inactiveButtonColor,
  },
  timeInputsContainer:{
    flexDirection: 'row',
    // backgroundColor: 'red',
    justifyContent: 'space-between',
    width: '100%',
    height: 50,
  },
  timeInput1:{
    // flex:1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: 'blue',
    width: '50%',
  },
  timeInput2:{
    flex:0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // paddingLeft: 10,
    alignItems:'center',
    // backgroundColor: 'pink',
    width: '50%',
  },
  inputRow1:{
    width: '50%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  // backgroundColor: 'yellow',
  },
  inputRow2:{
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  // backgroundColor: 'orange',
  },
  ingredientBloc:{
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: 'pink',
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
    // backgroundColor: 'yellow',
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
    // backgroundColor: 'orange',
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