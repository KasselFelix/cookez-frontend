import { StyleSheet, Text, View, SafeAreaView, ScrollView, RefreshControl,  Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import css from '../styles/Global';
import { useSelector } from "react-redux";

import addressIp from '../modules/addressIp';
import buttonStyles from '../styles/Button';
import MySmallButton from '../components/MySmallButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Comment from '../components/Comments';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

export default function CommentScreen({ navigation }) {
    const [myComments, setMyComments] = useState([]);
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
      fetch(`http://${addressIp}:3000/comments/${user.username}`)
        .then((res) => res.json())
        .then(data => {
            if(data.result) {
                setMyComments(data.commentsByAuthor)
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

    const allComments = myComments.map((data, i) => {
        console.log('PROPS', data);
        return  <View key={i}>
            <Text style={{color:'#FFF',fontWeight:'bold',fontSize:18}}>{data.recipe.name} :</Text>
            <Comment {...data} update={update} />
            </View>
    })

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MySmallButton
                	dataFlow={()=> handleReturn()}
                  text={<FontAwesome name='angle-double-left' size={30} color={'white'}/>}
                  buttonType={buttonStyles.buttonSmall}
                />
                { myComments.length === 1 ? <Text style={styles.titlePage}> My comment 📝</Text> :  <Text style={styles.titlePage}>My comment 📝</Text>}
            </View>
            { myComments.length === 0 && <View style={styles.noCommentContainer}>
              <View style={styles.noFavorite}><Text>No comments in your list </Text><Text>at the moment 😔 ...</Text></View>
            </View> }
            <View style={styles.galleryContainer}>
              <ScrollView 
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
              {allComments}
              </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
      container: {
        width: width * 1,  
        height: height * 1, 
        alignItems: 'center',
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
        width: '70%',
        fontSize: css.fontSizeFive,
      },

      noCommentContainer: {
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
        flexDirection:'column',
        width:'100%',
        paddingHorizontal:'4%',
        height:'100%',
      },
})