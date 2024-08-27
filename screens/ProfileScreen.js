import React, { useEffect ,useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, StyleSheet, Image, ScrollView, Animated, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import MyButton from '../components/MyButton';
import buttonStyles from '../styles/Button';
import css from '../styles/Global';
import { removeUserToStore, updateUserInStore} from '../reducers/user';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "react-native-vector-icons/AntDesign";
import addressIp from '../modules/addressIp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { removeAllIngredientToStore } from '../reducers/ingredient';
import { removeAllRecipeToStore } from '../reducers/recipe';
import { removeCommentToStore } from '../reducers/comment';
import { removePictureToStore } from '../reducers/picture';



const ProfilScreen = ({navigation}) => {

  const dispatch = useDispatch();
  const user = useSelector((state)=>state.user.value);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(user.image);
  const animatedValue = new Animated.Value(0);
  const [editModalVisible, setEditModalVisible] = useState(false);

  //Etats pour les inputs de la modal :
  // const [email, setEmail]=useState('');          ___
  // const [firstname, setFirstname]=useState('');     |
  // const [lastname, setLastname]=useState('');        } Finalement je ne les ai pas utilisé 
  // const [username, setUsername]=useState('');       |   mais j'ai fait un seul état pour tous 
  // const [age, setAge]=useState(0);                __|    ces inputs-là (voir plus bas)
  //const [allergy, setAllergy]=useState(''); 
  //const [householdComposition, setHouseholdComposition]=useState('');

  //On peut faire un seul état pour gérer tous les inputs de la modal du update:
  const [updatedUser, setUpdatedUser] = useState({ email: user.email, firstname: user.firstname, lastname: user.lastname, username: user.username, age: user.age,allergy: user.settings.allergy.join(' '),householdComposition: user?.householdComposition });



  // Animation d'apparition avec interpolation
  useEffect(() => {
    console.log();
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(()=>{
    handleUpdate()
  },[profileImage])


  const handleImageChange = (newImage) => {
    console.log('before',newImage)
    setUpdatedUser({ ...updatedUser, image: newImage})
    setProfileImage(newImage);
    setModalVisible(false);
  };

  const Genre = ['M','F'];

  // Interpolation de la valeur pour l'opacité et la translation
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0], // Déplacement vertical de 50 à 0
  });
  const opacity = animatedValue;

  availableImages=[
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
const handleUpdate = () => {
  fetch( `http://${addressIp}:3000/users/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({...updatedUser, token: user.token}),
  })
  .then(res => res.json())
  .then(data => {
    if (data.result) {
      dispatch(updateUserInStore(data.updatedUser));
      setEditModalVisible(false);
      console.log(data);
    } else {
      alert(data.error);
    }
  })
  .catch(error => alert('Error updating user info'));
};

  
  
  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <FontAwesome name={"edit"} size={30} color={css.inactiveButtonColor} style={styles.iconEdit}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
              navigation.navigate("Home");
              dispatch( removeUserToStore());
              dispatch( removeAllIngredientToStore());
              dispatch( removeAllRecipeToStore());
              dispatch(removeCommentToStore());
              dispatch(removePictureToStore())}}>
          <AntDesign name={"logout"} size={25} color={css.inactiveButtonColor} style={styles.iconEdit}/>
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
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={availableImages.find(e=> e.nameFile==profileImage).path} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {user?.firstname} {user?.lastname}
        </Text>
        <Text style={styles.profileUsername}>@{user?.username}</Text>
      </Animated.View>
      <ScrollView>
        
      </ScrollView>
      <View style={styles.profileInfo}>
        <Text style={styles.infoTitle}>Email:</Text>
        <Text style={styles.infoText}>{user?.email}</Text>

        <Text style={styles.infoTitle}>Ages:</Text>
        <Text style={styles.infoText}>{user?.age} year</Text>

        {/* <Text style={styles.infoTitle}>Genre:</Text> */}
        {/* <Text style={styles.infoText}>{user?.settings?.gender}</Text> */}

        <Text style={styles.infoTitle}>Allergy:</Text>
        <Text style={styles.infoText}>
          {user?.settings?.allergy?.length > 0
            ? user.settings.allergy.join(', ')
            : 'Aucune'}
        </Text>

        <Text style={styles.infoTitle}>House hold composition:</Text>
        <Text style={styles.infoText}>
          {user?.settings?.householdComposition}
        </Text>

        <Text style={styles.infoTitle}>Favorites recipes:</Text>
        <Text style={styles.infoText}>{user?.favorites.length}</Text>

        <Text style={styles.infoTitle}>Published recipes:</Text>
        <Text style={styles.infoText}>{user?.recipes.length}</Text>

        <Text style={styles.infoTitle}>Comments:</Text>
        <Text style={styles.infoText}>{user?.comments.length}</Text>
      </View>

      {/* <View>
      <MyButton
            dataFlow={() => {
              navigation.navigate("Home");
              dispatch( removeUserToStore());
              dispatch( removeAllIngredientToStore());
              dispatch( removeAllRecipeToStore());
              dispatch(removeCommentToStore());
              dispatch(removePictureToStore())}}
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
            <View style={styles.imageOptions}>
              {availableImages.map((image, index) => index>1 && (
                <TouchableOpacity
                  key={index}
                  onPress={() => {handleImageChange(image.nameFile)}}
                >
                  <Image source={image.path} style={styles.optionImage} />
                </TouchableOpacity>
              ))}
            </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '10%',
    backgroundColor: css.backgroundColorTwo
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
    marginBottom: '5%',
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: css.backgroundColorOne,
    marginBottom: '1%',
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },

  profileUsername: {
    fontSize: 18,
    color: css.backgroundColorOne,
  },

  profileInfo: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: '6%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom:'20%',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: css.inactiveButtonColor,
    marginTop: 10,
  },

  infoText: {
    fontSize: 16,
    color: 'black',
  },

  modalContainer: {
    flex: 1,
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
    height:'85%',
    width: '100%',
    flexDirection: 'row',
    flexWrap : 'wrap',
    justifyContent: 'space-around',
    overflow:'scroll',
  },
  optionImage: {
    width: 80,
    height: 80,
    margin: '1%',
    borderRadius: 10,
    marginBottom:'15%'
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

export default ProfilScreen;




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