import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput
} from "react-native";
import React, {useState} from "react";
// import { useDispatch } from "react-redux";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../modules/MyButton";
import MySmallButton from "../modules/MySmallButton";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import RNPickerSelect from 'react-native-picker-select';
// import {addRecipeToStore} from '../reducers/recipe';

const BACKEND_ADDRESS = "http://192.168.100.181:3000";

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

//ETATS POUR LES HANDLES \\
  const [recipe, setRecipe] = useState("");
  const [ingredient, setIngredient] = useState([]);
  const [stepsArray, setStepsArray] = useState([]);

//const user = useSelector((state) => state.user.user);
const user={username:'reptincel',token:"vePuvRek0PzD61hJVkyryC4EoGCZH-RY"} //simulation user 
console.log('HELLO: ', );

const handleAddRecipe = () => {
  console.log('user:', user);
  console.log('LAAAAA :', {
              username: user.username, 
              name: recipeName,
              ingredients: recipeIngredients, 
              difficulty: recipeDifficulty, 
              // picture:`${recipeName}.jpg`, 
              preparationTime:recipePreptime, 
              cookingTime: recipeCooktime,
              description:recipeDescription, 
              servings:recipeServings, 
              steps:recipeSteps,
              votes: [],
              comments: [],
  });
  
  if(user && user.token){
    // if(name && origin && ingredients.lenght>0 && difficulty && preparationTime && description && steps.length>0) {
      fetch(`${BACKEND_ADDRESS}/recipes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
              username: user.username, 
              name: recipeName,
              ingredients: [{recipeIngredients}], 
              difficulty: recipeDifficulty, 
              picture:`${recipeName}.jpg`, 
              preparationTime:recipePreptime, 
              cookingTime: recipeCooktime,
              description:recipeDescription, 
              servings:recipeServings, 
              steps:recipeSteps,
      })
      })
      .then((res)=> res.json())
      .then((data) => {
        console.log('data:', data);
        
        if (data.result){
          alert("Recipe successfully added !")
          setIngredient([])
          setRecipe("")
          setStepsArray([])
        }else {
          alert("Failed to add recipe");
        }
      })
      .catch((error)=> {
        alert("an error occured while adding recipe");
      });
    }
    // }
};

const handleAddIngredient=()=>{
  setIngredient([...ingredient, {
    name: recipeIngredients,
    // image: `${name}`.jpg,
    quantity: recipeQuantity,
    nutrition: null,
  }])
}

const handleAddSteps=()=>{
  setStepsArray([...stepsArray, recipeSteps ])
}

// const ingredients=(<View  style={styles.ingredientBloc}>
//   <TextInput placeholder='Qty'  KeyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.quantityInput}/>
//   <RNPickerSelect
//   onValueChange={(value) => setRecipeUnit(value)}
//   items={units}
//   placeholder={{ label: "units", value: null }}
//   style={pickerSelectStyles}
//   useNativeAndroidPickerStyle={false} // Permet de personnaliser le style sur Android
//   />
//   <TextInput placeholder='Ingredient' placeholderTextColor={'grey'} style={styles.ingredientInput}/>
// </View> )

// Menus popup pour servings, difficulty et unités de mesure
  const numbers = Array.from({ length: 6 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));
  const numbers2 = Array.from({ length: 5 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));
  const units = [
    { label: "g", value: "g" },
    { label: "kg", value: "kg" },
    { label: "liter", value: "l" },
    { label: "ml", value: "ml" },
    { label: "cl", value: "cl" },
    { label: "tbsp", value: "tbsp" },
    { label: "tsp", value: "tsp" },
  ];
  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.header}>
          <MySmallButton
        	dataFlow={()=>navigation.goBack()}
          text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={styles.titlePage}>Add your recipe</Text>
      </View>
      <ScrollView>
      <View style={styles.formContainer}>
                        {/* SECTION RECIPE : TITLE - DESCRIPTION  - SETTINGS*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe_____________________________</Text>
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
                {/* <Text>time</Text> */}
              </View>
              <View style={styles.inputRow1}>
                <TextInput placeholder='0' KeyboardType="numeric" maxLength={5} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipePreptime(value)} value={recipePreptime}/>
                <Text style={styles.unit}>min.  </Text>
              </View>
            </View>
            <View style={styles.timeInput2}>
              <View>
                <Text>cooking:</Text>
                {/* <Text>time</Text> */}
              </View>
              <View style={styles.inputRow2}>
                <TextInput placeholder='0'  KeyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipeCooktime(value)} value={recipeCooktime}/>
                <Text style={styles.unit}>min.  </Text>
              </View>
            </View>
          </View>
        </View>
                            {/* SECTION INGREDIENTS */}
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients__________________________</Text>
          <View style={styles.ingredientBloc}>
            <TextInput placeholder='Qty'  KeyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.quantityInput} onChangeText={(value) => setRecipeQuantity(value)} value={recipeQuantity}/>
            <RNPickerSelect
            onValueChange={(value) => setRecipeUnit(value)}
            items={units}
            placeholder={{ label: "units", value: null }}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            />
            <TextInput placeholder='Ingredient*' placeholderTextColor={'grey'} style={styles.ingredientInput}  onChangeText={(value) => setRecipeIngredients(value)} value={recipeIngredients}/>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={()=>{handleAddIngredient()}} >
            <Text style={styles.addButtonText}>Add ingredient</Text>
          </TouchableOpacity>
          </View>
                          {/* SECTION PREPARATION STEPS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preparation__________________________</Text>
        <View style={styles.stepsInput}>
            <TextInput placeholder='step 1*' placeholderTextColor={'grey'} style={styles.formInput}  onChangeText={(value) => setRecipeSteps(value)} value={recipeSteps}/>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() =>{handleAddSteps()}}
            >
            <Text style={styles.addButtonText}>Add step</Text>
          </TouchableOpacity>
      </View>
                                  {/* SECTION PICTURE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Picture_______________________________</Text>
        <View style={styles.stepsInput}>
            <TextInput placeholder='add a picture' placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipePicture(value)} value={recipePicture}/>
        </View>
        </View>
    </View>
      </ScrollView>
<MyButton
dataFlow={() => handleAddRecipe()}  
text="Add Recipe"
buttonType={buttonStyles.buttonThree}
/>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
    backgroundColor: css.backgroundColorOne
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
   },

  titlePage: {
    paddingRight: '35%',
    fontSize: css.fontSizeFive,
  },
  
  formContainer:{
    flex:1,
    width: '100%',
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: css.activeButtonColor,
    borderRadius: 20,
    padding: 10,  
    marginBottom: 10,

  },
  section:{
    marginBottom: 2, 
    width: '100%',
    // backgroundColor: 'grey',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: css.inactiveButtonColor,
  },
  formInput:{
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
  addButton: {
    backgroundColor: css.inactiveButtonColor,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "flex-end",
    width: '40%'
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