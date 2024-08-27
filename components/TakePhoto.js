import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Unicons from '@iconscout/react-native-unicons';
import css from '../styles/Global';
import { addPictureToStore } from '../reducers/picture';
import { useDispatch } from 'react-redux';

export default function TakePhoto(props) {
    const dispatch=useDispatch();

    const takePhoto = async () => {
        if(props.name){
            // Demande de permission
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.granted === false) {
                alert("Permission to access camera is required!");
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            });

            console.log(result);

            if (!result.canceled) {
                console.log('START')
                dispatch(addPictureToStore(result.assets[0].uri))
            }
        }else{
            alert("fill the fields above before ✍️")
        }
    };

  return (
    <TouchableOpacity onPress={() =>takePhoto()}>
        <Unicons.UilCameraPlus size={60} color={css.inactiveButtonColor}/>
    </TouchableOpacity>      
  );
}
