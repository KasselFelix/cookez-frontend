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
  Dimensions,
  accessibilityLabel
} from "react-native";
import css from "../styles/Global";
import buttonStyles from "../styles/Button";
import MyButton from "../components/MyButton";
import MySmallButton from "../components/MySmallButton";
import { FontAwesome } from "@expo/vector-icons";
import OptionPicker from "../components/addRecipe/OptionPicker";
import useT from "../i18n/useT";
import addressIp from "../modules/addressIp";
import { authHeaders, jsonAuthHeaders } from "../modules/authHeaders";
import { useDispatch, useSelector } from "react-redux";
import IngredientsList from "../components/IngredientsList";
import StepsList from "../components/StepsList";
import PickImage from "../components/PickImage";
import TakePhoto from "../components/TakePhoto";
import useTabBarHeight from "../hooks/useTabBarHeight";
import { clearPicture } from "../reducers/picture";
import InlineMessage from "../components/feedback/InlineMessage";
import { useToast } from "../contexts/ToastProvider";

const { width, height } = Dimensions.get('window');

export default function AddRecipeScreen({navigation}) {
  const tabBarHeight = useTabBarHeight();
  const t = useT();
  const { show: showToast } = useToast();
  // Message under the photo buttons, where the user just touched: the name
  // field is at the top of the form, often scrolled out of sight (plan 020).
  const [photoMessage, setPhotoMessage] = useState("");

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
    'REMOVE PICTURE:'
    return ()=>dispatch(clearPicture());
  },[])

  // The next name typed or photo chosen clears the photo message.
  useEffect(() => {
    setPhotoMessage("");
  }, [recipeName, picture]);


  async function handleAddRecipe() {
    try {
        // Vérification de la photo
        if (!picture) {
            setPhotoMessage(t('addRecipe.photoMissing'));
        }else if (user?.token) {
            const pictureName = `${recipeName.trim()}_${Date.now()}`;
            const formData = new FormData();
            formData.append('photoFromFront', {
                uri: picture,
                name: `${pictureName}.jpg`,
                type: 'image/jpeg',
            });

            // Envoi de l'image. A `?`, `#` or `/` in the recipe name would cut the
            // path: the name is encoded, and the server cleans it into its id.
            const uploadResponse = await fetch(`${addressIp}/upload/${encodeURIComponent(pictureName)}`, {
                method: 'POST',
                // No Content-Type: fetch sets the multipart boundary itself.
                headers: authHeaders(user.token),
                body: formData,
            });

            // The upload route answers its errors with a 4xx/5xx status and a JSON
            // body: read it first, so the user sees why (daily limit, invalid
            // image) rather than a generic message.
            let uploadData = null;
            try {
                uploadData = await uploadResponse.json();
            } catch {
                uploadData = null;
            }

            if (!uploadResponse.ok || !uploadData?.result) {
                // Silent before plan 020 when the status was 200: nothing happened.
                showToast({
                    type: 'error',
                    title: t('addRecipe.publishFailed'),
                    message: uploadData?.error || t('addRecipe.uploadRefused'),
                });
            } else {
                // Envoi des informations de la recette. The server sets the
                // author, the date, the votes and the comments; `picture` is the
                // id it gave the uploaded photo.
                const recipeResponse = await fetch(`${addressIp}/recipes/add`, {
                    method: "POST",
                    headers: jsonAuthHeaders(user.token),
                    body: JSON.stringify({
                        name: recipeName,
                        origin: null,
                        ingredients: ingredientsList,
                        difficulty: recipeDifficulty,
                        picture: uploadData.picture,
                        preparationTime: recipePreptime,
                        cookingTime: recipeCooktime,
                        description: recipeDescription,
                        servings: recipeServings,
                        steps: stepsArray,
                    }),
                });

                const recipeData = await recipeResponse.json();
                //console.log('Recipe creation response data:', recipeData);

                if (recipeData.result) {
                    showToast({ type: 'success', message: t('addRecipe.published') });

                    // Réinitialisation du formulaire
                    setIngredientsList([]);
                    setRecipe("");
                    setRecipeCooktime("");
                    setRecipeDescription("");
                    setRecipeDifficulty("");
                    setRecipeIngredients("");
                    setRecipeName("");
                    setRecipePicture("");
                    setRecipePreptime("");
                    setRecipeQuantity("");
                    setRecipeServings("");
                    setRecipeSteps("");
                    setRecipeUnit("");
                    setStepsArray([]);
                    dispatch(clearPicture());
                } else {
                    showToast({
                        type: 'error',
                        title: t('addRecipe.publishFailed'),
                        message: recipeData.error || t('common.error'),
                    });
                }
            }
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error.message);
        showToast({ type: 'error', title: t('addRecipe.publishFailed'), message: t('common.networkError') });
    }
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

  //Fonction pour supprimer un ingrédient de la liste
  const handleDeleteIngredient = (id) => {
    setIngredientsList(ingredientsList.filter((ingredient)=> ingredient.id !== id));
  };

  //compte le nombre d'ingrédients ajoutés
  const ingredientCount = ingredientsList.length;

  //compte le nombre de steps ajoutés
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

  // Labels are translated; values stay as they are, the backend reads them.
  const units = [
    { label: t("addRecipe.units.g"), value: "g  " },
    { label: t("addRecipe.units.kg"), value: "kg  " },
    { label: t("addRecipe.units.liter"), value: "L  " },
    { label: t("addRecipe.units.ml"), value: "ml  " },
    { label: t("addRecipe.units.cl"), value: "cl  " },
    { label: t("addRecipe.units.tbsp"), value: "tbsp  " },
    { label: t("addRecipe.units.tsp"), value: "tsp  " },
    // A count of pieces (3 eggs). The backend trims the value and reads
    // 'unit' as pieces of the ingredient's reference weight.
    { label: t("addRecipe.units.unit"), value: "unit  " },
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
        <Text style={styles.titlePage}>{t('addRecipe.title')}</Text>
        <View style={styles.btnEmpty}></View>
      </View>
      {/* The space for the floating tab bar sits on the card, not on the
          KeyboardAvoidingView: in iOS "padding" mode, that view replaces its
          paddingBottom with the keyboard height (0 when closed), and the card
          then ran under the tab bar, hiding "Add Recipe" (plan 017, step 29). */}
      <View testID="addRecipe-card" style={[styles.formBloc, { marginBottom: tabBarHeight + css.spacing.md }]}>
        <View style={styles.formContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: css.spacing.lg, alignItems: 'center' }}
          >
            {/* SECTION RECIPE : TITLE - DESCRIPTION  - SETTINGS*/}
            <View style={styles.section}>
              <View style={styles.separationContainer}>
                <Text style={styles.sectionTitle}>{t('addRecipe.sections.recipe')}</Text>
                <View  style={styles.separation}/>
              </View>
              <TextInput placeholder={t('addRecipe.namePlaceholder')} placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipeName(value)} value={recipeName}/>
              <TextInput placeholder={t('addRecipe.descriptionPlaceholder')} placeholderTextColor={'grey'} style={styles.formInput} onChangeText={(value) => setRecipeDescription(value)} value={recipeDescription}/>
              < View style={styles.settings}>
                <View style={styles.servingBloc}>
                  <Text  style={styles.label}>{t('addRecipe.servingsLabel')}</Text>
                    <OptionPicker
                      value={recipeServings}
                      onChange={setRecipeServings}
                      options={numbers}
                      placeholder="0"
                      title={t('addRecipe.servingsTitle')}
                      accessibilityLabel={t('addRecipe.servingsTitle')}
                    />
                  <Text style={styles.unit}>{`${t('addRecipe.persons')}  `}</Text>
                </View>
                <View style={styles.difficultyBloc}>
                  <Text style={styles.label}>{t('addRecipe.difficultyLabel')}</Text>
                  <OptionPicker
                    value={recipeDifficulty}
                    onChange={setRecipeDifficulty}
                    options={numbers2}
                    placeholder="0"
                    title={t('addRecipe.difficultyTitle')}
                    accessibilityLabel={t('addRecipe.difficultyTitle')}
                  />
                <Text style={styles.unit}>/5</Text>
                </View>          
              </View>
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInput1}>
                  <View>
                    <Text>{t('addRecipe.preparationLabel')}</Text>
                  </View>
                  <View style={styles.inputRow1}>
                    <TextInput placeholder='0' keyboardType="numeric" maxLength={5} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipePreptime(value)} value={recipePreptime}/>
                    <Text style={styles.unit}>{`${t('addRecipe.minutes')}  `}</Text>
                  </View>
                </View>
                  <View style={styles.timeInput2}>
                    <View>
                      <Text>{t('addRecipe.cookingLabel')}</Text>
                    </View>
                    <View style={styles.inputRow2}>
                      <TextInput placeholder='0'  keyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.formInputSmall} onChangeText={(value) => setRecipeCooktime(value)} value={recipeCooktime}/>
                      <Text style={styles.unit}>{`${t('addRecipe.minutes')}  `}</Text>
                    </View>
                  </View>
              </View>
            </View>
                            {/* SECTION INGREDIENTS */}
            <View style={styles.section}>
              <View style={styles.separationContainer}>
              <Text style={styles.sectionTitle}>{t('addRecipe.sections.ingredients')}</Text>
              <View  style={styles.separation}/>
              </View>
              <View style={styles.ingredientBloc}>
                <TextInput placeholder={t('addRecipe.quantityPlaceholder')}  keyboardType="numeric" maxLength={3} placeholderTextColor={'grey'} style={styles.quantityInput} onChangeText={(value) => setRecipeQuantity(value)} value={recipeQuantity}/>
                <OptionPicker
                  value={recipeUnit}
                  onChange={setRecipeUnit}
                  options={units}
                  placeholder={t('addRecipe.unitPlaceholder')}
                  title={t('addRecipe.unitTitle')}
                  accessibilityLabel={t('addRecipe.unitTitle')}
                  testID="addRecipe-unit"
                />
                <TextInput placeholder={t('addRecipe.ingredientPlaceholder')} placeholderTextColor={'grey'} style={styles.ingredientInput}  onChangeText={(value) => setRecipeIngredients(value)} value={recipeIngredients}/>
              </View>
              {/* Affichage du compteur d'ingrédients */}             
              <Text style={styles.counterText}>{t('addRecipe.ingredientsAdded', { count: ingredientCount })}</Text>              
                      {/* Bouton pour ajouter un ingrédient */}
              <View style={styles.buttonsBloc}>
                  {/* Bouton pour afficher la MODAL */}
                  <TouchableOpacity style={styles.showButton} onPress={()=>{setModalVisible(true)}}>
                  <Text style={styles.addButtonText}>{t('addRecipe.showIngredients')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>  
                  <Text style={styles.addButtonText}>{t('addRecipe.addIngredient')}</Text>
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
              <View style={styles.separationContainer}>
                <Text style={styles.sectionTitle}>{t('addRecipe.sections.steps')}</Text>
                <View  style={styles.separation}/>
              </View>
              <View style={styles.stepsInput}>
                <TextInput placeholder={t('addRecipe.stepPlaceholder')} placeholderTextColor={'grey'} style={styles.formInput}  onChangeText={(value) => setRecipeSteps(value)} value={recipeSteps} multiline={true} textAlignVertical="top"/>
              </View>
                           {/* Affichage du compteur d'étapes */}             
              <Text style={styles.counterText}>{t('addRecipe.stepsAdded', { count: stepCount })}</Text>
              <View style={styles.buttonsBloc}>
              <TouchableOpacity style={styles.showButton} onPress={()=>{setModalVisible2(true)}}>
                  <Text style={styles.addButtonText}>{t('addRecipe.showSteps')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() =>{handleAddSteps()}}>
                  <Text style={styles.addButtonText}>{t('addRecipe.addStep')}</Text>
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
              <View style={styles.separationContainer}>
                <Text style={styles.sectionTitle}>{t('addRecipe.sections.picture')}</Text>
                <View  style={styles.separation}/>
              </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {picture ?
                    <View style={{ width:'100%', alignItems: 'center'}}>
                    <View style={styles.deleteIcon}>
                      <TouchableOpacity onPress={() => dispatch(clearPicture())} style={styles.cross} accessibilityRole="button" accessibilityLabel={t('addRecipe.removePhotoA11y')}>
                        <FontAwesome name='times' size={20} color={css.palette.error}  />
                      </TouchableOpacity>
                    </View>
                    <Image source={{ uri: picture }} alt={t('addRecipe.photoA11y')} accessibilityLabel={t('addRecipe.photoA11y')} style={{ width: 200, height: 200,borderRadius:20, borderWidth:5, borderColor:css.palette.primary800 }} />        
                    </View> :
                    <View style={styles.pictureLogo}> 
                        <TakePhoto name={recipeName} onNameMissing={() => setPhotoMessage(t('addRecipe.nameFirst'))}/>
                        <PickImage name={recipeName} onNameMissing={() => setPhotoMessage(t('addRecipe.nameFirst'))}/>
                    </View>
                  }
                  <InlineMessage
                    testID="addRecipe-photo-message"
                    type="info"
                    message={photoMessage}
                    style={{ marginTop: css.spacing.sm }}
                  />
                </View>
            </View>
            <View style={{ marginTop: css.spacing.lg }}>
              <MyButton
                dataFlow={() => {handleAddRecipe()}}
                text={t('addRecipe.submit')}
                buttonType={buttonStyles.buttonThree}
              />
            </View>
          </ScrollView>
        </View>
      </View>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: width * 1,  
    height: height * 1, 
    paddingTop: '15%',
    backgroundColor: css.palette.accent500
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  titlePage: {
    fontSize: css.typography.h5Size,
  },

  btnReturn: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    backgroundColor: css.palette.primary800,
    color: css.palette.accent500,
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
    flex: 1,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: css.palette.secondary500,
    elevation: 5,
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
    backgroundColor: css.palette.secondary500,
    borderRadius: 20,
    borderColor: css.palette.secondary500,
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
    color: css.palette.primary800,
  },

  separationContainer: {
    flexDirection:'row',
    alignItems:'baseline',
  },

  separation:{
    borderBottomWidth:2,
    borderBottomColor:css.palette.primary800,
    width:'100%'
  },

  deleteIcon: {
    zIndex:1,
    width: '50%',
    position: 'absolute',
    paddingTop: '2%',
  },

  cross: {
    backgroundColor:css.palette.accent500,
    borderRadius:5,
    width:'25%',
    alignItems: 'center',
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
    borderColor: css.palette.primary800,
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
    borderColor: css.palette.primary800,
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
    color: css.palette.primary800,
  },

  unit: {
    fontSize: 14,
    marginLeft: 5,
    color: css.palette.primary800,
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
    borderColor: css.palette.primary800,
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
    borderColor: css.palette.primary800,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: "white",
    marginLeft: 2,
  },

  counterText:{
    fontSize: css.typography.captionSize,
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  buttonsBloc:{
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: css.palette.primary800,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "flex-end",
    width: '40%',
  },
  showButton:{
    backgroundColor: css.palette.primary800,
    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    width: '40%',
  },
  addButtonText: {
    color: css.palette.accent500,
    fontSize: 12,
  },
})