import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector } from "react-redux";
import Popover from "react-native-popover-view";
import moment from 'moment';
// MODULES
import addressIp from '../modules/addressIp';
import css from '../styles/Global';

export default function Comments( { upDownCountInitial, alreadyUp, alreadyDown, username, date, message, _id, update}) {
    const user = useSelector((state)=>state.user.value);
    const dateFormated = moment(date).format('HH:MM DD-MM-YYYY');
    const [showPopover, setShowPopover]=useState(false);
    const [up, setUp] = useState([]);
    const [down, setDown]= useState([]);
    const [upDownCountCurrent, setUpDownCountCurrent] = useState((0));
    const [upVote, setUpVote] = useState(false);
    const [downVote, setDownVote] = useState(false);
    const [inputMessage,setInputMessage]=useState('');
    const [modalVisible, setModalVisible] = useState(false);
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

    const handleAddComment = async () => {
      try {
        const response = await fetch(`http://${addressIp}:3000/comments/add`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            token: user.token,
            message: inputMessage,
            recipe: recipe,
          })
        });
        const data =  await response.json();
        if (data.result) {
          console.log('DATA',data)
          console.log('Comment added successfully:', data.comment);
          setModalVisible(false);
          setInputMessage('');
          update()
        } else {
          alert('Failed to add comment');
        }
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    }

    const handleDeleteComment = async () => {
      if(user.username===username){
        try {
          const response = await fetch(`http://${addressIp}:3000/comments/delete`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              _id,
              username,
            })
          });
          const data =  await response.json();
          if (data.result) {
            console.log('DATA',data)
            console.log('Comment added successfully:', data.comment);
            setModalVisible(false);
            setInputMessage('');
            update()
          } else {
            alert('Seems the server has a problem try another time');
          }
        } catch (error) {
          console.error('There has been a problem with your fetch operation:', error);
        }
      }
    }

    const handleUpdateComment = async () => {
      if(user.username===username){
        console.log('INFO',recipe)
        try {
          const response = await fetch(`http://${addressIp}:3000/comments/update`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              _id,
              username,
              message:inputMessage,
            })
          });
          const data =  await response.json();
          if (data.result) {
            console.log('DATA',data)
            alert('Comment updated successfully:');
            setModalVisible(false);
            setInputMessage('');
            update()
          } else {
            alert('Seems the server has a problem try another time');
          }
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
     }
    }

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
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                      <FontAwesome name="comments" size={20} color={css.backgroundColorTwo}/>
                    </TouchableOpacity>
                    <View style={styles.icone}>
                      <TouchableOpacity style={styles.upButton} activeOpacity={0.4} onPress={() => handleUpComment(user.username, _id)}>
                        <FontAwesome name="thumbs-up" size={20} color={ upVote ? "green" : "grey" } />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.downButton} activeOpacity={0.4} onPress={() => handleDownComment(user.username, _id)}>
                        <FontAwesome name="thumbs-down" size={20} color={ downVote ?  "red" : "grey" }/>
                      </TouchableOpacity>
                      <View>
                      {trigger ? <Text>({upDownCountCurrent})</Text> : <Text>{upDownDisplay()}</Text>}
                      </View>
                    </View>
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={modalVisible}
                      onRequestClose={() => setModalVisible(false)} // Ferme la modal sur back press Android
                    >
                      <View style={styles.modalContainer}>
                        <View style={styles.modalView}>
                          {user.username===username?
                            <Text style={styles.modalTitle}>Update your Comment</Text>:
                            <Text style={styles.modalTitle}>Add a Comment</Text>
                          }
                          <TextInput
                            style={styles.input}
                            placeholder="Type your comment..."
                            value={inputMessage}
                            onChangeText={(text) => {
                              if (text.length <= 250) {
                                setInputMessage(text);
                              }
                            }}
                            multiline={true}
                            numberOfLines={4}
                            maxLength={250} // Empêche la saisie au-delà de la limite
                          />
                          <Text style={styles.charCount}>
                            {inputMessage.length}/250
                          </Text>
                          <View style={styles.buttonContainer}>
                          {username===user.username&& 
                            <TouchableOpacity 
                            style={[styles.button, styles.buttonCancel]} 
                            onPress={() => {handleDeleteComment()}}
                          >
                            <Text style={styles.textStyle}>Delete</Text>
                          </TouchableOpacity>
                          }
                              
                            <TouchableOpacity 
                              style={[styles.button, styles.buttonCancel]} 
                              onPress={() => {
                                setModalVisible(false)
                              }}
                            >
                              <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.button, styles.buttonAdd]} 
                              onPress={()=>{username===user.username ? handleUpdateComment():handleAddComment()}}
                            >
                              {username===user.username ?
                              <Text style={styles.textStyle}>Update</Text>: 
                              <Text style={styles.textStyle}>Add</Text>}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                </View>
          :
            <View style={styles.footer}>
                <Popover 
                placement="floating"
                backgroundStyle={styles.popoverBackground}
                isVisible={showPopover}
                onRequestClose={()=> setShowPopover(false)}
                from={(
                  <TouchableOpacity style={styles.footerNoLogged} activeOpacity={0.4} onPress={() => handleUpDownNoLogged()}>
                    <View >
                      <FontAwesome name="comments" size={20} color={"grey"}/>
                    </View>
                    <View style={styles.upDownButton}>
                      <View style={styles.upButton}>
                        <FontAwesome name="thumbs-up" size={20} color={"grey"}/>
                      </View>
                      <View style={styles.downButton} activeOpacity={0.4}>
                        <FontAwesome name="thumbs-down" size={20} color={"grey"}/>
                      </View>
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

      icone: {
        flexDirection:'row'
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

      footerNoLogged: {
        flex: 0, 
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },

      footer: {
        marginTop: '2%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },

      upDownButton: {
        flexDirection: 'row',
        alignItems: 'center',
      },

      upButton: {
        marginRight: 15,
      },

      downButton: {
        marginRight: 15,
      },

      comment: {
        marginLeft: 5,
        fontSize: 14,
      },

      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0)',
      },

      modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },

      modalTitle: {
        fontSize: 18,
        marginBottom: 15,
      },

      input: {
        width: '100%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
      },

      charCount: {
        alignSelf: 'flex-end',
        marginBottom: 10,
        color: '#888',
      },

      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },

      button: {
        borderRadius: 5,
        padding: 10,
        elevation: 2,
      },


      buttonCancel: {
        backgroundColor: '#f44336',
      },

      buttonAdd: {
        backgroundColor: '#4CAF50',
      },

      textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    });