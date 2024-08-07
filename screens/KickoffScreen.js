import { StyleSheet, Text, View } from 'react-native'
import { Camera, CameraType, FlashMode,TouchableOpacity } from "expo-camera/legacy";
import { useEffect, useState, useRef } from 'react';
import React from 'react'

export default function KickoffScreen() {
  	const [hasPermission, setHasPermission] = useState(false);
	const [type, setType] = useState(CameraType.back);
	const [flashMode, setFlashMode] = useState(FlashMode.off);

	let cameraRef= useRef(null);

  return (
    <View>
      <Text>KickoffScreen</Text>
      {/* <Camera type={type} flashMode={flashMode} ref={(ref) => (cameraRef = ref)} style={styles.camera}>
			  <View style={styles.buttonsContainer}>
				  <TouchableOpacity onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)} style={styles.button}>
					  <FontAwesome name="rotate-right" size={25} color="#ffffff" />
				  </TouchableOpacity>

				  <TouchableOpacity onPress={() => setFlashMode(flashMode === FlashMode.off ? FlashMode.torch : FlashMode.off)} style={styles.button}>
					  <FontAwesome name="flash" size={25} color={flashMode === FlashMode.off ? "#ffffff" : "#e8be4b"} />
				  </TouchableOpacity>
			  </View>

			  <View style={styles.snapContainer}>
				  <TouchableOpacity onPress={() => cameraRef && takePicture()}>
					  <FontAwesome name="circle-thin" size={95} color="#ffffff" />
				  </TouchableOpacity>
			  </View>
		  </Camera> */}
    </View>
  )
}

const styles = StyleSheet.create({
  camera: {
		flex: 1,
	},
	buttonsContainer: {
		flex: 0.1,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingTop: 20,
		paddingLeft: 20,
		paddingRight: 20,
	},
	button: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		borderRadius: 50,
	},
	snapContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: 25,
	},
})