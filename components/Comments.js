import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Popover from "react-native-popover-view";
import moment from 'moment';
import { useSelector } from "react-redux";

export default function Comments({ username, date, message, up, down, handleUpComment, handleDownComment, _id }) {

    const user = useSelector((state)=>state.user.value);
    const [showPopover, setShowPopover]=useState(false);
    const dateFormated = moment(date).format('HH:MM DD-MM-YYYY');

    useEffect(() => {
      setTimeout(() => setShowPopover(false), 5500);
    }, [])

    const handleUpDown=()=>{
      if (user.token) {
        setShowPopover(false)
      } else {
        setShowPopover(true)
      }
    }

    const upDownDisplay = () => {
      if ((up.length - down.length) > 0) {
        return <Text>({up.length - down.length})</Text>
      } else {
        return <Text>(0)</Text>
      }
    };

    const handleLogged = (
      user.token  ?
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.voteButton} activeOpacity={0.4} onPress={() => handleUpComment({username, _id})}>
                      <FontAwesome name="thumbs-up" size={20} color={up.length === 0 ? "grey" : "green"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.voteButton} activeOpacity={0.4} onPress={() => handleDownComment({username, _id})}>
                      <FontAwesome name="thumbs-down" size={20} color={down.length === 0 ? "grey" : "red"}/>
                    </TouchableOpacity>
                    <View>
                      <Text>{upDownDisplay()}</Text>
                    </View>
                  </View>
          :
            <View style={styles.footer}>
                <Popover 
                placement="floating"
                backgroundStyle={styles.popoverBackground}
                isVisible={showPopover}
                onRequestClose={()=> setShowPopover(false)}
                from={(
                  <TouchableOpacity style={styles.upDown} activeOpacity={0.4} onPress={() => handleUpDown()}>
                    <FontAwesome name="thumbs-up" size={20} color={"grey"}/>
                    <FontAwesome name="thumbs-down" size={20} color={"grey"}/>
                  </TouchableOpacity>
                )}>
                <View style={styles.popoverContainer}>
                  <Text>You can unlock this feature by Signing in ❤️</Text>
                </View>
              </Popover> 
              </View>
      
    )

      return (
        <View style={styles.commentContainer}>
            <View style={styles.header}>
              <Text style={styles.author}>@{username}</Text>
              <Text style={styles.date}>{dateFormated}</Text>
            </View>
            <View style={styles.messageContainer}>
              <Text style={styles.content}>{message}</Text>
            </View>
              {handleLogged}
          </View>
        );
      };
    
    // return (
    //   <View style={styles.commentContainer}>
    //       <View style={styles.header}>
    //         <Text style={styles.author}>@{username}</Text>
    //         <Text style={styles.date}>{dateFormated}</Text>
    //       </View>
    //       <View style={styles.messageContainer}>
    //         <Text style={styles.content}>{message}</Text>
    //       </View>
    //       <View style={styles.footer}>
            // <TouchableOpacity style={styles.voteButton} activeOpacity={0.4} onPress={() => handleUpComment({username, _id})}>
            //   <FontAwesome name="thumbs-up" size={20} color={up.length === 0 ? "grey" : "green"} />
            // </TouchableOpacity>
            // <TouchableOpacity style={styles.voteButton} activeOpacity={0.4} onPress={() => handleDownComment({username, _id})}>
            //   <FontAwesome name="thumbs-down" size={20} color={down.length === 0 ? "grey" : "red"}/>
            // </TouchableOpacity>
    //         <View>
    //           <Text>{upDownDisplay()}</Text>
    //         </View>
    //       </View>
    //     </View>
    //   );
    // };
    
    const styles = StyleSheet.create({
      commentContainer: {
        backgroundColor: 'white',
        padding: 10,
        marginLeft: '0.5%',
        marginVertical: 5,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        width: 350,
      },

      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
      },

      author: {
        fontWeight: 'bold',
        fontSize: 14,
      },

      date: {
        fontSize: 12,
        color: 'gray',
      },

      messageContainer: {
        paddingBottom: 10,
        borderWidth: 2,
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255, 0.4)',
      },

      content: {
        fontSize: 14,
        marginBottom: 10,
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

      upDown: {
        flex: 0, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 65,
        paddingRight: "5%",
      },

      footer: {
        marginTop: '2%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      },

      voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
      },

      voteCount: {
        marginLeft: 5,
        fontSize: 14,
      },
    });