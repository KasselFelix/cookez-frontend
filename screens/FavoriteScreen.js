import { StyleSheet, Text, View, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import css from '../styles/Global';
import { useSelector } from "react-redux";

import addressIp from '../modules/addressIp';
import buttonStyles from '../styles/Button';
import MySmallButton from '../components/MySmallButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import Recipe from '../components/Recipe';

export default function FavoriteScreen({ navigation }) {
    const [myFavorites, setMyFavorites] = useState([]);
    const [refreshing, setRefreshing] = React.useState(false);

    const user = useSelector((state) => state.user.value);

    const onRefresh = React.useCallback(() => {
      console.log('REFRESH')
      setRefreshing(true);
      handleFetch();
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }, []);

    const handleReturn = () => {
        navigation.goBack()
    }

    const handleFetch =()=>{
      fetch(`https://cookez-backend.vercel.app/recipes/${user.username}`)
        .then((res) => res.json())
        .then(data => {
            if(data.result) {
                setMyFavorites(data.favoritesByAuthors)
            } 
        })
    }
    
    useEffect (()  => {
      console.log('MOUNT')
      handleFetch();
    },[]);

    function update(){
      console.log('UPDATE')
      handleFetch();
    }

    const allFavorites = myFavorites.map((data, i) => {
        return  <Recipe key={i} {...data} navigation={navigation} update={update} />
    })

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <MySmallButton
                	dataFlow={()=> handleReturn()}
                  text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
                  buttonType={buttonStyles.buttonSmall}
                />
                { myFavorites.length === 1 ? <Text style={styles.titlePage}> My favorite ❤️</Text> :  <Text style={styles.titlePage}>My favorites ❤️</Text>}
            </View>
            { myFavorites.length === 0 && <View style={styles.noFavoriteContainer}>
              <View style={styles.noFavorite}><Text>No favorites in your list </Text><Text>at the moment 😔 ...</Text></View>
            </View> }

            <ScrollView contentContainerStyle={styles.galleryContainer} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
            {allFavorites}
            </ScrollView>
        </SafeAreaView>
    )
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
        justifyContent: 'space-between'
      },
    
      titlePage: {
        width: '70%',
        fontSize: css.fontSizeFive,
      },

      noFavoriteContainer: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '50%',
      },

      noFavorite: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
      },

      galleryContainer: {
        marginHorizontal: '7%',
      },
})