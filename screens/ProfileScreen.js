import { AntDesign, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MyButton from '../components/MyButton';
import addressIp from '../modules/addressIp';
import { setComments } from '../reducers/comment';
import { clearIngredients } from '../reducers/ingredient';
import { clearPicture } from '../reducers/picture';
import { clearRecipes } from '../reducers/recipe';
import { removeUserToStore, updateUserInStore } from '../reducers/user';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';

const { width, height } = Dimensions.get('window');



export default function  ProfilScreen({navigation}){

  const dispatch = useDispatch();
  const user = useSelector((state)=>state.user.value);


  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(user.image);
  const animatedValue = new Animated.Value(0);
  const [editModalVisible, setEditModalVisible] = useState(false);

  
  //un seul état pour gérer tous les inputs de la modal du update:
  const [updatedUser, setUpdatedUser] = useState({  
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    age: user.age,
    allergy: user?.settings?.allergy.join(' ') || '',
    householdComposition: user?.settings?.householdComposition || 0
  });



  // Animation d'apparition avec interpolation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  
  // SI PLUS D'UTILISATEUR, ON NE REND RIEN (évite les crashs au moment du logout)
  if (!user || !user.token) {
    return null; 
  }

  

  const handleImageChange = (newImage) => {
    setProfileImage(newImage);
    setModalVisible(false);
    handleUpdate(newImage); 
  };

  const Genre = ['M','F'];

  // Interpolation de la valeur pour l'opacité et la translation
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0], // Déplacement vertical de 50 à 0
  });
  const opacity = animatedValue;

  const availableImages=[
    {nameFile: "default_M",path:require('../assets/profile/avatar_M.jpg')},
    {nameFile: "default_F",path:require('../assets/profile/avatar_F.jpg')},
    {nameFile: "default_M1",path:require('../assets/profile/avatar_M1.jpg')},
    {nameFile: "default_M2",path:require('../assets/profile/avatar_M2.jpg')},
    {nameFile: "avatar_M3",path:require('../assets/profile/avatar_M3.jpg')},
    {nameFile: "avatar_M4",path:require('../assets/profile/avatar_M4.jpg')},
    {nameFile: "avatar_F1",path:require('../assets/profile/avatar_F1.jpg')},
    {nameFile: "avatar_F2",path:require('../assets/profile/avatar_F2.jpg')},
    {nameFile: "avatar_F3",path:require('../assets/profile/avatar_F3.jpg')},
    {nameFile: "avatar_F4",path:require('../assets/profile/avatar_F4.jpg')},
  ]
  
// FONCTION POUR HANDLE L'UPDATE DES INFOS USER
const handleUpdate = (imageToSave = profileImage) => {
  const bodyToSend = {
    token: user.token,
    firstname: updatedUser.firstname,
    lastname: updatedUser.lastname,
    email: updatedUser.email,
    age: updatedUser.age,
    allergy: updatedUser.allergy || "", 
    householdComposition: updatedUser.householdComposition || 0
  };

  fetch(`${addressIp}/users/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyToSend),
  })
  .then(res => res.json())
  .then(data => {
    if (data.result) {
      dispatch(updateUserInStore(data.updatedUser));
      setEditModalVisible(false);
    } else {
      alert('Error: ' + data.error);
    }
  })
  .catch(error => console.log(error));
};

  
  
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <FontAwesome name={"edit"} size={30} color={css.palette.primary800} style={styles.iconEdit}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => {
          try {
            // 1. Nettoyage du stockage physique
            await AsyncStorage.removeItem('userToken');
            // 2. Nettoyage du Store Redux
            dispatch(removeUserToStore());
            dispatch(clearIngredients());
            dispatch(clearRecipes());
            dispatch(setComments([]));
            dispatch(clearPicture());
            // 3. Redirection vers l'accueil ou le login
            navigation.navigate("Home");
          } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
          }
        }}>
          <AntDesign name={"logout"} size={25} color={css.palette.primary800} style={styles.iconEdit}/>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.profileHeader,
          {
            opacity: opacity,
            transform: [{ translateY: translateY }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => setModalVisible(true)} >
          <Image source={availableImages.find(e => e.nameFile === profileImage)?.path || availableImages[0].path} style={styles.profileImage} alt="profil icon" />
        </TouchableOpacity>
        <Text  style={styles.profileName}>
          {user?.firstname} {user?.lastname}
        </Text>
        <Text style={styles.profileUsername}>@{user?.username}</Text>
      </Animated.View>
     
      <View style={styles.profileInfo}>
        <ScrollView style={{overflow:'hidden'}} >
          <Text style={styles.infoTitle}>Email:</Text>
          <Text style={styles.infoText}>{user?.email}</Text>

          <Text style={styles.infoTitle}>Ages:</Text>
          <Text style={styles.infoText}>{user?.age} year</Text>

          <Text style={styles.infoTitle}>Genre:</Text>
          <Text style={styles.infoText}>{user?.settings?.gender ?? "none"}</Text>

          <Text style={styles.infoTitle}>Allergy:</Text>
          <Text style={styles.infoText}>
            {user?.settings?.allergy?.length > 0
              ? user.settings.allergy.join(', ')
              : 'Aucune'}
          </Text>

          <Text style={styles.infoTitle}>House hold composition:</Text>
          <Text style={styles.infoText}>
            {user?.settings?.householdComposition ?? 0}
          </Text>

          <Text style={styles.infoTitle}>Favorites recipes:</Text>
          <Text style={styles.infoText}>{user?.favorites?.length || 0}</Text>

          <Text style={styles.infoTitle}>Published recipes:</Text>
          <Text style={styles.infoText}>{user?.recipes?.length || 0}</Text>

          <Text style={styles.infoTitle}>Comments:</Text>
          <Text style={styles.infoText}>{user?.comments?.length || 0}</Text>
        </ScrollView >
      </View>

      {/* <View>
      <MyButton
            dataFlow={() => {
              navigation.navigate("Home");
              dispatch( removeUserToStore());
              dispatch(clearIngredients());
              dispatch(clearRecipes());
              dispatch(setComments([]));
              dispatch(clearPicture())}}
            text={"LOG OUT"}
            buttonType={buttonStyles.buttonOne}
          />
      </View> */}

      {/* Modal pour sélectionner l'image */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your Avatar !</Text>
            <ScrollView contentContainerStyle={styles.imageOptions}>
              {availableImages.map((image, index) => index>1 && (
                <TouchableOpacity
                  key={index}
                  onPress={() => {handleImageChange(image.nameFile)}}
                >
                  <Image source={image.path} style={styles.optionImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>
        </View>
      </Modal>

      {/* MODAL POUR UPDATE USER INFO */}
      <Modal 
      transparent={true} 
      visible={editModalVisible} 
      onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalEditContainer}>
          <KeyboardAvoidingView style={styles.modalEditContent}> 
          <ScrollView  contentContainerStyle={styles.scrollModalEdit} >
            <Text style={styles.modalTitle}>Update your profile</Text>
            <TextInput 
            placeholder='firstname' 
            placeholderTextColor={'grey'}  
            style={styles.input} 
            value={updatedUser.firstname} //utilisation de la valeur d'état unique 'updatedUser' pour chaque input 
            onChangeText={(text) => setUpdatedUser({ ...updatedUser, firstname: text })} //pareil pour le setter unique
            />
            <TextInput  
            placeholder='lastname' 
            placeholderTextColor={'grey'}  
            style={styles.input} 
            value={updatedUser.lastname}
            onChangeText={(text) => setUpdatedUser({ ...updatedUser, lastname: text })}
            />
            {/* <TextInput  
            placeholder='username' 
            placeholderTextColor={'grey'}  
            style={styles.input} 
            value={updatedUser.username} 
            onChangeText={(text) => setUpdatedUser({ ...updatedUser, username: text })}
            /> */}
            <TextInput 
            placeholder='email' 
            placeholderTextColor={'grey'}  
            KeyboardType={'email-address'} 
            InputModeOptions={'email'} 
            textContentType={'emailAddress'} 
            autoCapitalize={'email'}  
            style={styles.input} 
            value={updatedUser.email} 
            onChangeText={(text) => setUpdatedUser({ ...updatedUser, email: text })}
            />
            <TextInput 
            placeholder='age' 
            placeholderTextColor={'grey'}
            keyboardType="numeric" 
            style={styles.input} 
            value={updatedUser.age.toString()} 
            onChangeText={(text) => setUpdatedUser({ ...updatedUser, age: Number(text) })}
            />
            <TextInput
             placeholder='allergy' 
             placeholderTextColor={'grey'}  
             style={styles.input} 
             value={updatedUser.allergy} 
             onChangeText={(text)=> setUpdatedUser({ ...updatedUser,allergy: text})}
             />
            <TextInput
              placeholder='household composition' 
              placeholderTextColor={'grey'}
              keyboardType="numeric" 
              style={styles.input} 
              value={updatedUser.householdComposition} 
              onChangeText={(text)=> setUpdatedUser({ ...updatedUser,householdComposition:text})}/>
           
              <MyButton 
              dataFlow={() => handleUpdate()}
              text="Update"
              buttonType={buttonStyles.buttonThree}/>

              <MyButton
              dataFlow={() => setEditModalVisible(false)}
              text="Cancel"
              buttonType={buttonStyles.buttonThree}/>
              </ScrollView>
           </KeyboardAvoidingView> 
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    //flex:1,
    width: width * 1,  
    height: height * 1, 
    paddingVertical: '20%',
    //justifyContent:'space-between',
    backgroundColor: css.palette.secondary500,
    alignItems: 'center',
    paddingTop: '10%',
    backgroundColor: css.palette.secondary500
  }, 

  header: {
    flex: 0,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconEdit:{
    justifyContent: 'flex-end',
    padding: 10,
  },

  profileHeader: {
    alignItems: 'center',
    height: height * 0.20,
    width: width * 0.9,
    marginBottom: '5%',
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: css.palette.accent500,
    marginBottom: '1%',
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },

  profileUsername: {
    fontSize: 18,
    color: css.palette.accent500,
  },

  profileInfo: {
    height: height*0.5,
    width: width* 0.8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: '6%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom:'20%',
    //marginBottom:'4%',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: css.palette.primary800,
    marginTop: 10,
  },

  infoText: {
    fontSize: 16,
    color: 'black',
  },

  logoutSection: {
    height:height*0.1,
  },

  modalContainer: {
    width: width * 1,  
    height: height * 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    width: '85%',
    height: '40%',
    padding: '2.5%',
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    flexWrap:'wrap',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: '2%',
  },

  imageOptions: {
    height:'100%',
    width: '100%',
    flexDirection: 'row',
    flexWrap : 'wrap',
    justifyContent: 'space-around',
  },
  optionImage: {
    width: 80,
    height: 80,
    margin: '1%',
    borderRadius: 10,
    marginBottom:'15%',
  },
   modalEditContainer:{
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalEditContent:{
    width: '90%',
    height:'60%',
    marginTop:'20%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  scrollModalEdit: {
    alignItems: "center",
    justifyContent:"center",
    width: "100%"
  },

  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    width: '80%',
  },
 
});






// const ProfilScreen = () => {
//   const user =useSelector((state)=>state.user.value);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [profileImage, setProfileImage] = useState(user?.image);
//   const [email, setEmail] = useState(user?.email);
//   const [age, setAge] = useState(user?.age?.toString());
//   const [householdComposition, setHouseholdComposition] = useState(
//     user?.settings?.householdComposition?.toString()
//   );
//   const [allergy, setAllergy] = useState(user?.settings?.allergy || []);
//   const [newAllergy, setNewAllergy] = useState('');
//   const animatedValue = new Animated.Value(0);


//   // Images disponibles dans le répertoire assets


//   React.useEffect(() => {
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const translateY = animatedValue.interpolate({
//     inputRange: [0, 1],
//     outputRange: [50, 0],
//   });

//   const opacity = animatedValue;

//   const handleImageChange = (newImage) => {
//     setProfileImage(newImage);
//     setModalVisible(false); // Ferme la modal après la sélection
//   };

//   const handleAddAllergy = () => {
//     if (newAllergy.trim() !== '' && !allergy.includes(newAllergy)) {
//       setAllergy([...allergy, newAllergy]);
//       setNewAllergy('');
//     }
//   };

//   const handleRemoveAllergy = (allergy) => {
//     setAllergy(allergy.filter((item) => item !== allergy));
//   };

//   const handleSave = () => {
//     // Validation de l'email
//     if (!email.includes('@')) {
//       Alert.alert('Erreur', "Veuillez entrer un email valide.");
//       return;
//     }

//     // Validation de l'âge
//     const ageNumber = parseInt(age, 10);
//     if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 130) {
//       Alert.alert('Erreur', "Veuillez entrer un âge valide (1-130).");
//       return;
//     }

//     // Validation de la composition du foyer
//     const householdNumber = parseInt(householdComposition, 10);
//     if (isNaN(householdNumber) || householdNumber < 1) {
//       Alert.alert('Erreur', "Veuillez entrer une composition du foyer valide.");
//       return;
//     }

//     // Simuler la sauvegarde des données ici
//     Alert.alert('Succès', "Les modifications ont été enregistrées.");
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Animated.View
//         style={[
//           styles.profileHeader,
//           {
//             opacity: opacity,
//             transform: [{ translateY: translateY }],
//           },
//         ]}
//       >
//         <TouchableOpacity onPress={() => setModalVisible(true)}>
        
//         </TouchableOpacity>
//         <Text style={styles.profileName}>
//           {user?.firstname} {user?.lastname}
//         </Text>
//         <Text style={styles.profileUsername}>@{user?.username}</Text>
//       </Animated.View>

//       <View style={styles.profileInfo}>
//         <Text style={styles.infoTitle}>Email:</Text>
//         <TextInput
//           style={styles.input}
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//         />

//         <Text style={styles.infoTitle}>Âge:</Text>
//         <TextInput
//           style={styles.input}
//           value={age}
//           onChangeText={setAge}
//           keyboardType="numeric"
//         />

//         <Text style={styles.infoTitle}>Composition du foyer:</Text>
//         <TextInput
//           style={styles.input}
//           value={householdComposition}
//           onChangeText={setHouseholdComposition}
//           keyboardType="numeric"
//         />

//         <Text style={styles.infoTitle}>Allergy:</Text>
//         <View style={styles.allergyList}>
//           {allergy.map((allergy, index) => (
//             <View key={index} style={styles.allergyItem}>
//               <Text style={styles.allergyText}>{allergy}</Text>
//               <TouchableOpacity
//                 style={styles.removeButton}
//                 onPress={() => handleRemoveAllergy(allergy)}
//               >
//                 <Text style={styles.removeButtonText}>X</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>

//         <TextInput
//           style={styles.input}
//           value={newAllergy}
//           onChangeText={setNewAllergy}
//           placeholder="Ajouter une allergie"
//         />
//         <Button title="Ajouter" onPress={handleAddAllergy} />
//       </View>

//       <Button title="Sauvegarder" onPress={handleSave} />

//       {/* Modal pour sélectionner l'image */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Sélectionnez une image</Text>
//             <View style={styles.imageOptions}>
             
//             </View>
//             <Button title="Fermer" onPress={() => setModalVisible(false)} />
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: '#f0f4f8',
//     alignItems: 'center',
//   },
//   profileHeader: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   profileImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 2,
//     borderColor: '#ddd',
//     marginBottom: 10,
//   },
//   profileName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   profileUsername: {
//     fontSize: 18,
//     color: '#777',
//   },
//   profileInfo: {
//     width: '100%',
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   infoTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 10,
//   },
//   input: {
//     fontSize: 16,
//     color: '#666',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//     marginBottom: 10,
//     paddingVertical: 5,
//   },
//   allergyList: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 10,
//   },
//   allergyItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e0e0e0',
//     borderRadius: 15,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     margin: 5,
//   },
//   allergyText: {
//     marginRight: 10,
//     color: '#333',
//   },
//   removeButton: {
//     backgroundColor: '#ff5252',
//     borderRadius: 10,
//     padding: 2,
//   },
//   removeButtonText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     width: 300,
//     padding: 20,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   imageOptions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 20,
//   },
//   optionImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 10,
//   },
// });