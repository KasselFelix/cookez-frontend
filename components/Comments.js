import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector } from "react-redux";
import Popover from "react-native-popover-view";
import moment from 'moment';
// MODULES
import addressIp from '../modules/addressIp';

export default function Comments( { upDownCountInitial, alreadyUp, alreadyDown, username, date, message, _id, update}) {
    const user = useSelector((state)=>state.user.value);
    const dateFormated = moment(date).format('HH:MM DD-MM-YYYY');
    const [showPopover, setShowPopover]=useState(false);
    const [up, setUp] = useState([]);
    const [down, setDown]= useState([]);
    const [upDownCountCurrent, setUpDownCountCurrent] = useState((0));
    const [upVote, setUpVote] = useState(false);
    const [downVote, setDownVote] = useState(false);
    const [trigger, setTrigger] = useState(false);


    //HANDLE UP/DOWN COLOR IF USER HAS ALREADY VOTED AT INITIALIZATION OF RECIPE SCREEN 
    useEffect(() => {
      if (alreadyUp) {
        setUpVote(true);
      } else if (alreadyDown) {
        setDownVote(true);
      }
    }, [alreadyUp, alreadyDown]);

    //HANDLE TOTAL UP/DOWN COUNT AT INITIALIZATION OF RECIPE SCREEN 1/2
    useEffect(() => {
      if (upDownCountInitial > 0) {
        setUpDownCountCurrent(upDownCountInitial)
        setTrigger(true)
      } 
    }, [upDownCountInitial])

    // 2/2
    const upDownDisplay = () => {
      if ((up?.length - down?.length) > 0) {
        return <Text>({(up.length - down.length)})</Text>
      } else {
        return <Text>(0)</Text>
      }
    };

    // HANDLE UP BY CLICK
    const handleUpComment = async (username, _id) => {
      try {
        const response = await fetch(`http://${addressIp}:3000/comments/upvote`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            username: username,
            _id: _id
          })
        });
        const data =  await response.json();
          if (data.result) {
            setUp(data.up)
            setDown(data.down)
            setUpVote(data.upVote)
            setDownVote(data.downVote)
            setTrigger(false)
          }
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
      update()
    };

    // HANDLE DOWN BY CLICK
    const handleDownComment = async (username, _id) => {
      try {
        const response = await fetch(`http://${addressIp}:3000/comments/downvote`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            username: username,
            _id: _id
          })
        });
        const data =  await response.json();
        if (data.result) {
          setUp(data.up)
          setDown(data.down)
          setUpVote(data.upVote)
          setDownVote(data.downVote)
          setTrigger(false)
        }
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
      update()
    };

    // HANDLE THE POSSIBILITY OF INTERACTING WITH COMMENTS 1/3
    useEffect(() => {
      setTimeout(() => setShowPopover(false), 5500);
    }, [])

    // 2/3
    const handleUpDownNoLogged=()=>{
      if (user.token) {
        setShowPopover(false)
      } else {
        setShowPopover(true)
      }
    }

    // 3/3
    const handleLogged = (
      user.token  ?
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.upDownButton} activeOpacity={0.4} onPress={() => handleUpComment(user.username, _id)/*,handleUpCommentRecipeScreen(user.username, _id)*/}>
                      <FontAwesome name="thumbs-up" size={20} color={ upVote ? "green" : "grey" } />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.upDownButton} activeOpacity={0.4} onPress={() => handleDownComment(user.username, _id)}>
                      <FontAwesome name="thumbs-down" size={20} color={ downVote ?  "red" : "grey" }/>
                    </TouchableOpacity>
                    <View>
                    {trigger ? <Text>({upDownCountCurrent})</Text> : <Text>{upDownDisplay()}</Text>}
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
                  <TouchableOpacity style={styles.upDownNoLogged} activeOpacity={0.4} onPress={() => handleUpDownNoLogged()}>
                    <TouchableOpacity style={styles.upDownButton} activeOpacity={0.4} onPress={() => handleUpComment(user.username, _id)/*,handleUpCommentRecipeScreen(user.username, _id)*/}>
                      <FontAwesome name="thumbs-up" size={20} color={"grey"}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.upDownButton} activeOpacity={0.4} onPress={() => handleDownComment(user.username, _id)}>
                      <FontAwesome name="thumbs-down" size={20} color={"grey"}/>
                    </TouchableOpacity>
                    <View>
                      <Text>({upDownCountCurrent})</Text> 
                    </View>
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

      upDownNoLogged: {
        flex: 0, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },

      footer: {
        marginTop: '2%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      },

      upDownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
      },

      voteCount: {
        marginLeft: 5,
        fontSize: 14,
      },
    });