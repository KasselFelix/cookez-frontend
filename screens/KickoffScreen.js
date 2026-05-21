import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, StyleSheet, TouchableOpacity, ScrollView, View, Image, Text, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { addIngredient, removeIngredient, updateIngredientQuantity, updateIngredientUnit } from "../reducers/ingredient";
import { setPantry, setLoading as setPantryLoading, setError as setPantryError } from "../reducers/pantry";
import { getPantry } from "../modules/pantryApi";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";

import addressIp from "../modules/addressIp";
import { FOODVISOR_API_KEY } from '../modules/apiKeys';
import ListIngredients from "../components/ListIngredients";
import SearchIngredients from "../components/SearchIngredients";
import MyButton from '../components/MyButton';
import InventoryGrid from "../components/kickoff/InventoryGrid";
import PantryHero from "../components/kickoff/PantryHero";
import SelectedChips from "../components/kickoff/SelectedChips";
import buttonStyles from '../styles/Button';
import css from "../styles/Global";
import { useTheme } from "../contexts/ThemeProvider";
import useT from "../i18n/useT";
import * as Animatable from 'react-native-animatable';

export default function KickoffScreen({navigation}) {
  	const saveMoney=false;


	//camera
  	const [hasPermission, setHasPermission] = useState(false);
	const [type, setType] = useState('back'); // 'back' ou 'front'
	const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', 'auto', ou 'torch'


  	const [pictures, setPictures] = useState([]);
  	const [modalVisible, setModalVisible] = useState(false);
	const [searchInput, setSearchInput] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListIngredient, setDataListIngredient] = useState([]);
	const [validatedIngredient, setValidatedIngredient] = useState([]);
	
	const ingredients = useSelector((state) => state.ingredient.value)
	// Plan 003 D.2 — gate the inventory grid behind (logged-in) && (pantry non-empty).
	// `state.pantry.value.items` is the canonical array; `.value` itself is the
	// envelope `{ items, loading, error }` from Plan 002's slice.
	const user = useSelector((state) => state.user.value);
	const pantryItems = useSelector((state) => state.pantry?.value?.items || []);
	const showGrid = !!user?.token && pantryItems.length > 0;
	const theme = useTheme();
	const t = useT();

  	const dispatch = useDispatch();
  	const isFocused = useIsFocused();
	const insets = useSafeAreaInsets();
	const [imageUrl, setImageUrl] = useState(null);
  	let cameraRef = useRef(null);
	const modalRef = useRef(null);
	// Dim backdrop for the search modal — fades in/out independently from
	// the Animatable slide-in/out so the visual feel matches the Tags &
	// Origin pickers (425ms ease).
	const backdropOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (modalVisible) {
			backdropOpacity.setValue(0);
			Animated.timing(backdropOpacity, {
				toValue: 1,
				duration: 425,
				useNativeDriver: true,
			}).start();
		}
	}, [modalVisible, backdropOpacity]);

	const fadeOutBackdrop = () => {
		Animated.timing(backdropOpacity, {
			toValue: 0,
			duration: 425,
			useNativeDriver: true,
		}).start();
	};

	const [permission, requestPermission] = useCameraPermissions();
	useEffect(() => {
		if (!permission || permission.status !== 'granted') {
			requestPermission();
		}
	}, [permission]);

	// Hydratation du pantry au mount. Sans ce fetch, la grille
	// "Cook from your pantry" reste invisible tant que l'utilisateur n'a
	// pas visité ProfileScreen (seul autre site qui appelle getPantry).
	// Idempotent : skip si items déjà présents (cas où on arrive depuis
	// Profile). Erreur silencieuse → grid simplement cachée, pas de crash.
	useEffect(() => {
		if (!user?.token) return;
		if (pantryItems.length > 0) return;
		let cancelled = false;
		(async () => {
			dispatch(setPantryLoading(true));
			const { ok, data, error } = await getPantry(user.token);
			if (cancelled) return;
			if (ok) dispatch(setPantry(data?.items ?? []));
			else dispatch(setPantryError(error));
			dispatch(setPantryLoading(false));
		})();
		return () => { cancelled = true; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.token]);

	// Sync au focus : les ingrédients sélectionnés sont snapshotés au moment
	// du toggle (g_per_serving = pantry.quantity à cet instant). Si l'user
	// edit la quantité d'un pantry item dans Profile puis revient sur
	// Kickoff, l'entrée Redux `state.ingredient.value` reste stale → Recap
	// initialise avec l'ancienne valeur. On re-sync au focus de Kickoff.
	// Le sync s'arrête à Kickoff : ça ne pollue PAS les overrides manuels
	// que l'user pourrait faire sur RecapScreen (le focus n'y déclenche
	// rien).
	useFocusEffect(
		useCallback(() => {
			ingredients.forEach((ing) => {
				const id = ing?.data?._id;
				if (!id) return;
				const pantryItem = pantryItems.find((p) => {
					const pid = p?.ingredient?._id || p?.ingredient;
					return pid && String(pid) === String(id);
				});
				if (!pantryItem) return;
				if (ing.data.g_per_serving !== pantryItem.quantity) {
					dispatch(updateIngredientQuantity({
						display_name: ing.data.display_name,
						quantity: pantryItem.quantity,
					}));
				}
				const freshUnit = pantryItem.unit || pantryItem.ingredient?.defaultUnit;
				if (freshUnit && ing.data.unit !== freshUnit) {
					dispatch(updateIngredientUnit({
						display_name: ing.data.display_name,
						unit: freshUnit,
					}));
				}
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [pantryItems])
	);

	// synchronise la sélection
	useEffect(() => {
    	if (modalVisible) {
        	// `itemData.id` in ListIngredients is `_id || display_name`, so we
        	// must mirror that fallback here. Mapping to display_name only
        	// caused a race: on first tap the id was appended locally, then
        	// Redux changed and this effect overwrote the entry with the
        	// name — wiping the just-set id and dropping the check + color.
        	const alreadySelectedIds = ingredients.map(
        	    ing => ing.data._id || ing.data.display_name
        	);
        	setValidatedIngredient(alreadySelectedIds);
    	}
	}, [modalVisible, ingredients]); // Se déclenche à l'ouverture de la modal ou si Redux change



	
	const handleFetchIngredients = async () => {
		const response = await fetch(`${addressIp}/ingredients/${searchInput}`);
		const data =  await response.json();
		if (data.result) {
			//console.log('search',data);
			// filtre les doublons basés sur le nom
        	const uniqueIngredients = data.ingredients.filter((value, index, self) =>
           		 index === self.findIndex((t) => t.name === value.name)
        	);
			setDataListIngredient( uniqueIngredients.map((e) => {return {id: e._id || e.name, name: e.name, display_name: e.name, photo: e.image, g_per_serving: e.quantity, defaultUnit: e.defaultUnit || 'g', nutrition: e.nutrition }}));
			//console.log('datalist: ', dataListIngredient)
		} else {
			setDataListIngredient(data.error);
		}
	}

	useEffect(() => {
		if (searchInput.length > 0) {
			handleFetchIngredients()
		}
	}, [searchInput]);

	


	function handleBtn () {
		if(!saveMoney){
			for (let imagePath of pictures){
				const handleFetch = async (cpt=0)=>{
					try{						
						//Create FormData	
						const formData = new FormData();
						formData.append('image', {
							uri: imagePath,
							type: 'image/jpeg',
							name: `image${cpt++}.jpg`,
						});
							const response= await fetch("https://vision.foodvisor.io/api/1.0/en/analysis", {
										method: 'POST',
										headers: {
										'Authorization': `Api-Key ${FOODVISOR_API_KEY}`,
										'Content-Type': 'multipart/form-data',
										},
										body: formData});
							if (response.ok) {
								const data = await response.json();
								if(data){
									if (data.items && data.items.length > 0 && data.items[0].food.length > 0) {
										// console.log('NOW: ', data.items[0].food[0]);
										dispatch(addIngredient({photo:imagePath, data:data.items[0].food[0].food_info}))
									}
								}else{
									// console.log('no data')
								}

							  } else {
								throw new Error(`HTTP status ${response.status}`);
							  }						
					}catch(error){
						console.error('Something bad happened:', error);
					}
				}
				handleFetch();	 
			}
		}
		navigation.navigate('Recap')
	};

	const takePicture = async () => {
		const photo = await cameraRef.takePictureAsync({ quality: 0.3 });
		if (photo) {
			setPictures([...pictures, photo.uri])
		}else{
			alert('Your photo was not taken well, Try to retake it pls 👏')
		}

	};

	
	//CAMERA
	if (!permission || !permission.granted || !isFocused) {
		return (
		  <View style={styles.container}>
			<View style={styles.cameraContainer}>
                
			</View>
		  </View>
		)
	}
	

	// Unified slot model — `camera` slots are URIs from the camera (no name yet,
	// Foodvisor runs on Next), `search` slots come from Redux ingredients added
	// via the Search modal (have photo + display_name immediately).
	const slots = [
		...pictures.map((uri) => ({ kind: 'camera', uri, key: `cam-${uri}` })),
		...ingredients.map((ing) => ({
			kind: 'search',
			ing,
			uri: ing.photo,
			name: ing?.data?.display_name,
			key: `ing-${ing?.data?._id || ing?.data?.display_name}`,
		})),
	];

	const renderFilledSlot = (slot) => {
		const isSearch = slot.kind === 'search';
		const removeLabel = isSearch
			? t('kickoff.removeIngredientA11y', { name: slot.name || '' })
			: t('kickoff.removePhotoA11y');

		return (
			<View key={slot.key} style={styles.photoShadowWrap}>
			<View style={styles.photoContainer}>
				<View style={styles.deleteIcon}>
					<TouchableOpacity
						onPress={() => {
							if (isSearch) {
								dispatch(removeIngredient(slot.ing));
							} else {
								setPictures(pictures.filter((e) => e !== slot.uri));
							}
						}}
						accessibilityRole="button"
						accessibilityLabel={removeLabel}
						hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
					>
						<FontAwesome name="times" size={20} color={css.palette.error} />
					</TouchableOpacity>
				</View>
				<Image
					source={{ uri: slot.uri }}
					style={styles.photo}
					accessibilityLabel={isSearch && slot.name ? slot.name : t('kickoff.slot.imageA11y')}
				/>
				{isSearch && !!slot.name && (
					<View style={styles.nameBand} pointerEvents="none">
						<Text
							style={[styles.nameBandText, { color: theme.palette.white }]}
							numberOfLines={1}
						>
							{slot.name}
						</Text>
					</View>
				)}
				{/* Dashed border rendered as an absolute overlay so it sits
				    on top of the Image (and nameBand) instead of being
				    clipped/hidden by the parent's overflow:'hidden'. */}
				<View style={styles.slotBorderOverlay} pointerEvents="none" />
			</View>
			</View>
		);
	};

	const renderSlots = () => {
		const rendered = slots.map(renderFilledSlot);
		// Pad with empty placeholders so a minimum of 3 slot frames are visible.
		for (let i = slots.length; i < 3; i++) {
			rendered.push(
				<View key={`ph-${i}`} style={styles.addPicturesContainer}>
					<FontAwesome name="camera-retro" size={70} color="rgba(255,255,255, 0.4)" />
					<Text style={styles.text}>{t('kickoff.slot.placeholder')}</Text>
					{/* Dashed border via absolute overlay — Android rendering
					    of borderStyle:'dashed' + borderRadius on the same
					    View is unreliable (fabric/new arch quirks). Layering
					    the border on an absolute child decouples the two and
					    gives a consistent dashed look across iOS + Android. */}
					<View style={styles.placeholderBorderOverlay} pointerEvents="none" />
				</View>
			);
		}
		return rendered;
	};



	function onItemPress(data){
		setValidatedIngredient([...validatedIngredient,data.id])
		const baseUnit = data.defaultUnit || 'g';
		// Si l'ingrédient cherché est aussi dans le pantry de l'utilisateur,
		// pré-remplir avec la quantité user (ce qu'il possède réellement)
		// plutôt qu'avec la quantité de référence BDD. Symétrie avec le
		// tap pantry direct via InventoryGrid : peu importe le chemin
		// d'ajout, la quantité initiale reflète l'inventaire user.
		const pantryMatch = pantryItems.find((p) => {
			const pid = p?.ingredient?._id || p?.ingredient;
			return pid && String(pid) === String(data.id);
		});
		const initialQty = pantryMatch?.quantity ?? data.g_per_serving;
		const initialUnit = pantryMatch?.unit || baseUnit;
		dispatch(addIngredient({photo: data.photo, data: {_id: data.id, display_name: data.name, g_per_serving: initialQty, defaultUnit: baseUnit, unit: initialUnit, nutrition: data.nutrition }}))
	}

	function onItemRemove(data) {
		// On cherche l'ingrédient dans le store par son nom pour le supprimer
		const ingredientToDelete = ingredients.find(ing => ing.data.display_name === data.name);
		if (ingredientToDelete) {
			dispatch(removeIngredient(ingredientToDelete));
		}
	}

	const handleCloseModal = () => {
		setSearchInput("");
		fadeOutBackdrop();
		if(modalRef.current){
			// fadeOutDown = downward slide + opacity fade, matching the
			// backdrop's 425ms feel. Smoother dismiss than the prior
			// slideOutUp (which moved against the user's instinct).
			modalRef.current.animate('fadeOutDown', 425).then(() => {
			setModalVisible(false);
			setDataListIngredient([]);
		  	})
		}
	}

	const totalSlots = pictures.length + ingredients.length;
	// Count-only label ("2") next to the chevron icon; empty when 0.
	// The chevron itself ("»") communicates "next" universally, so the
	// "Next"/"Suivant" word is dropped from the visible label.
	const nextText = totalSlots > 0 ? String(totalSlots) : '';
	const nextA11y = totalSlots > 0
		? t('kickoff.nextWithCount', { count: totalSlots })
		: t('kickoff.next');

	// Safe-area-aware bottom padding so the shutter button never sits flush
	// with the home indicator / nav bar on tall devices (Pro Max, tablets).
	// `Math.max` guarantees a minimum gap on devices without a bottom inset.
	const bottomPadding = Math.max(insets.bottom, css.spacing.md) + css.spacing.lg;

  	return (
		  <View style={[styles.container, { paddingBottom: bottomPadding }]} >
			<TouchableOpacity
				onPress={() =>
					user?.token
						? navigation.navigate('TabNavigator', { screen: 'UserDashboard' })
						: navigation.navigate('Home')
				}
				accessibilityRole="button"
				accessibilityLabel={t('common.home')}
				hitSlop={10}
				style={styles.backButton}
			>
				<FontAwesome name="home" size={22} color={css.palette.black} />
			</TouchableOpacity>
			<Modal
				visible={modalVisible}
				animationType="none"
				transparent
				statusBarTranslucent
				navigationBarTranslucent
			>
				{/* Backdrop layer — opacity is driven by the Animated value so
				    the dim fades in/out smoothly. pointerEvents="none" lets
				    touches pass through to the KeyboardAvoidingView below
				    (which keeps catching keyboard adjustments). */}
				<Animated.View
					style={[
						StyleSheet.absoluteFillObject,
						styles.modalBackdrop,
						{ opacity: backdropOpacity },
					]}
					pointerEvents="none"
				/>
				<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.key}>

       		 		<View style={styles.modal}>
       		 		    <Animatable.View
						ref={modalRef}
						animation="slideInUp"
						duration={700}   
						style={styles.modalBackgound}>
							<View style={styles.modalContainer}>

								<SearchIngredients
									searchInput={searchInput}
									setSearchInput={setSearchInput}
									setDataListIngredient={setDataListIngredient}
									clicked={clicked}
									setClicked={setClicked}
								/>
								
								<ListIngredients
								searchInput={searchInput}
								data={dataListIngredient}
								setClicked={setClicked}
								validatedIngredient={validatedIngredient}
								setValidatedIngredient={setValidatedIngredient}
								onItemPress={onItemPress}
								onItemRemove={onItemRemove}
								/>
							</View>
									
							<View style={styles.modalButtons}>
								<View style={styles.validButton}>
									<MyButton
										dataFlow={()=> {handleCloseModal()}}
										text={t('kickoff.modal.close')}
										buttonType={buttonStyles.buttonFour}
									/>
								</View>
							</View>
       		 		    </Animatable.View>
       		 		</View>
				</KeyboardAvoidingView>
       		</Modal>
			<View style={[styles.cameraContainer, showGrid && styles.cameraContainerCompact]}>
				<CameraView facing={type} flash={flashMode} ref={(ref) => (cameraRef = ref)} style={StyleSheet.absoluteFillObject} />
				<View style={styles.buttonsCameraContainer}>
					<TouchableOpacity onPress={() => setType(type === 'back' ? 'front' : 'back')} style={styles.buttonsCamera}>	
						<FontAwesome name="rotate-right" size={25} color={css.palette.white} />
					</TouchableOpacity>

					<TouchableOpacity onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')} style={styles.buttonsCamera}>
						<FontAwesome name="flash" size={25} color={flashMode === 'off' ? css.palette.white : "#e8be4b"} />
					</TouchableOpacity>
				</View>
			</View>
			

			{showGrid && (
				<>
					<SelectedChips
						ingredients={ingredients}
						pictures={pictures}
						onAdd={() => setModalVisible(true)}
						onRemoveIngredient={(data) => onItemRemove(data)}
						onRemovePhoto={(uri) => setPictures(pictures.filter((p) => p !== uri))}
					/>
					<PantryHero count={pantryItems.length} />
					<ScrollView
						style={styles.gridScroll}
						contentContainerStyle={styles.gridScrollContent}
						showsVerticalScrollIndicator={false}
					>
						<InventoryGrid />
					</ScrollView>
				</>
			)}

			{/* Guest / pantry vide : ancien row de slots dashed (inchangé) */}
			{!showGrid && (
				<ScrollView
					horizontal
					contentContainerStyle={styles.galleryContainer}
					// Layout strategy : marginTop + marginBottom auto centre la
					// row verticalement entre la caméra et les boutons en mode
					// guest. Sur petits écrans, les autos collapsent à 0.
					style={[
						{ flexGrow: 0, maxHeight: 170 },
						{ marginTop: 'auto', marginBottom: 'auto' },
					]}
					showsHorizontalScrollIndicator={false}
				>
					{renderSlots()}
				</ScrollView>
			)}

			<View style={[styles.containerButtonBottom, showGrid && { marginTop: 'auto' }]}>

				<View style={styles.buttonSearch}>
					<MyButton
						dataFlow={() => setModalVisible(true)}
						icon={{ name: 'plus', size: 24 }}
						accessibilityLabel={t('kickoff.addIngredient')}
						buttonType={buttonStyles.buttonFour}
					/>
				</View>

				<View style={styles.buttonNext}>
					<MyButton
						dataFlow={()=>handleBtn()}
						text={nextText}
						textColor={css.palette.white}
						icon={{ name: 'angle-double-right', size: 24, position: 'right' }}
						accessibilityLabel={nextA11y}
        				buttonType={buttonStyles.buttonFour}
					/>
				</View>
			</View>

			<View style={styles.snapContainer}>
				<TouchableOpacity onPress={() => cameraRef && takePicture()}>
					<FontAwesome name="circle-thin" size={95} color={css.palette.white} />
				</TouchableOpacity>
			</View>
		</View>
   )
}

const styles = StyleSheet.create({
	container:{
		flex: 1,
		alignContent: 'center',
		alignItems:'center',
		width: '100%',
		height: '100%',
		backgroundColor:css.palette.secondary500,
		paddingTop: css.layout.paddingTop,
	},

	modalBackgound: {
		flex: 0,
		paddingTop:'30%',
		justifyContent: 'flex-start',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},

	modal: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},

	key: {
		flex: 1,
		width: '100%',
		alignContent: 'center',
		alignItems:'center',
		// No backgroundColor here — the dim is rendered by `modalBackdrop`
		// behind so it can fade independently from this layer.
	},

	modalBackdrop: {
		backgroundColor: 'rgba(0,0,0,0.5)',
	},

	modalContainer: {
		flex: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: css.palette.accent500,
		borderRadius: css.radius.card,
		height: 310,
		width:350,
		// iOS shadow only — the Animatable.View parent is the one being
		// animated (fadeOutDown), and Android's `elevation` shadow is
		// rendered out-of-band by the system. It doesn't follow the
		// transform/opacity smoothly, producing a "lingering" shadow ghost
		// during close. Dropping elevation removes that artifact; the iOS
		// shadow still animates in-band with the view.
		shadowColor: css.palette.black,
		shadowOffset: {
		  width: 0,
		  height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		marginBottom: 15,
	},

	// Sized to match `modalContainer` (350) and centered via `alignSelf`
	// so the Close button sits visually under the card regardless of the
	// outer KeyboardAvoidingView's own layout quirks. Using `width: '100%'`
	// here previously made the row span the full screen, which combined
	// with the modal's nested flex parents (KeyboardAvoidingView → modal
	// → animated container) produced an off-center single child.
	modalButtons: {
		flex: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 350,
	},

	validButton: {
		marginBottom: 20,
	},

	searchInput: {
	flex: 0,
	alignItems: 'center',
	marginBottom: 20,
	width: '80%',
	borderWidth: 1,
	borderColor: css.palette.neutral300,
	backgroundColor: 'rgba(255,255,255, 0.6)',
	},

	cameraContainer: {
		backgroundColor: css.palette.black,
		borderRadius: css.radius.camera,
		overflow: 'hidden',
		height:'50%',
		width:'90%',
		marginBottom:10,
	},

	// Logged-in mode + pantry items : reduce camera to ~33% to leave room
	// for the PantryHero, InventoryGrid, and SelectedChips below without
	// overflow on tall screens (and to fit on iPhone SE-class devices).
	cameraContainerCompact: {
		height: '33%',
	},

	styleCamera:{
		height:350,
		width:350,
		marginBottom:10,
		borderRadius: css.radius.camera,
		overflow: "hidden",
	},

	camera: {
		height:'100%',
		width:'100%',
	},

	buttonsCameraContainer: {
		flex: 0.1,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		// cameraContainer has a pill borderRadius (99) + overflow: hidden,
		// so the top corners clip anything placed too close to the edges.
		// These paddings push the buttons inside the visible inner area.
		paddingTop: 40,
		paddingLeft: 40,
		paddingRight: 40,
	},

	buttonsCamera: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		borderRadius: css.radius.pill,
	},

	// Floating back button — sits above the camera view, top-left, with a
	// translucent dark pill backdrop so the white chevron stays readable
	// against any camera background.
	backButton: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 78 : 52,
		left: 12,
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: css.palette.white,
		borderRadius: css.radius.pill,
		zIndex: 10,
	},

	galleryContainer: {
		flexWrap: 'wrap',
		alignItems:'center',
	},

	// Slot rempli : coins arrondis (cohérence avec cameraContainer/backButton)
	// + bordure solide blanche fine pour encadrer la photo et unifier la
	// grille avec les placeholders dashed sans brouiller la sémantique
	// (dashed = vide à remplir, solid = rempli).
	// Outer wrapper carries the shadow. iOS clips shadows when
	// `overflow:'hidden'` is set on the same View (UIView's
	// `masksToBounds = true` applies to shadow too), so the shadow
	// MUST live on a parent without overflow/radius. Android's
	// `elevation` survives but is also bumped for visual parity.
	photoShadowWrap: {
		margin: 5,
		borderRadius: css.radius.lg,
		backgroundColor: 'transparent',
		...css.shadow.heavy,
	},

	photoContainer: {
		width: 150,
		height: 150,
		position: 'relative',
		overflow: 'hidden',
		borderRadius: css.radius.lg,
	},

	// Dashed border for filled slots — rendered on top of the photo so
	// the strokes are visible (not clipped by overflow:'hidden').
	slotBorderOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: css.radius.lg,
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: css.palette.white,
		zIndex: 3,
	},

	deleteIcon: {
        width: '95%',
        alignItems: 'flex-end',
        position: 'absolute',
        zIndex: 2,
        paddingTop: '3%',
      },

	// La photo remplit le conteneur ; le borderRadius du parent + overflow
	// hidden suffisent à clipper les coins. Pas besoin de borderRadius ici.
	photo: {
		width: '100%',
		height: '100%',
	},

	nameBand: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingVertical: 4,
		paddingHorizontal: 6,
		backgroundColor: 'rgba(0,0,0,0.55)',
		zIndex: 1,
	},

	nameBandText: {
		fontSize: 12,
		textAlign: 'center',
	},

	addPicturesContainer: {
		flex: 0,
		justifyContent: 'center',
		alignItems: 'center',
		width: 150,
		height: 150,
		margin: 5,
		paddingBottom: 10,
		position: 'relative',
		borderRadius: css.radius.lg,
		overflow: 'hidden',
	},

	// Same pattern as `slotBorderOverlay` but with a translucent stroke
	// to differentiate empty placeholders from filled slots.
	placeholderBorderOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: css.radius.lg,
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: 'rgba(255,255,255, 0.4)',
		zIndex: 3,
	},

	text: {
		color: 'rgba(255,255,255, 0.4)',
	},

	containerButtonBottom: {
		flex: 0,
		flexDirection: 'row',
		justifyContent:'space-around',
		width: '100%',
		height: 50,
	},

	buttonSearch: {
		paddingRight:10,
		alignItems: 'center',
		justifyContent: 'center',
	},

	buttonNext: {
		paddingLeft: 10,
	},

	snapContainer: {
		flex: 0,
		alignItems: "center",
		justifyContent: "flex-end",
		backgroundColor: css.palette.primary800,
		width: 100,
		borderRadius: css.radius.pill,
		marginTop: 10,
		// Bottom spacing is owned by the container's safe-area-aware
		// paddingBottom (see render). Keeping a marginBottom here would
		// double the gap on devices with a home indicator.
	},

	// Plan 003 D.2 — inventory grid for logged-in users with pantry data.
	// The maxHeight cap is critical: this screen has no master scroll, so
	// without a height ceiling a large pantry would push the bottom action
	// row (Search / Next / shutter) off-screen on smaller devices.
	gridHeader: {
		marginTop: 16,
		marginBottom: 8,
		paddingHorizontal: 16,
		alignSelf: 'stretch',
	},
	gridScroll: {
		flexGrow: 0,
		maxHeight: 280,
		width: '100%',
	},
	gridScrollContent: {
		paddingHorizontal: 4,
	},
	gridDivider: {
		marginTop: 12,
		marginBottom: 8,
		paddingHorizontal: 16,
		textAlign: 'center',
		fontSize: 13,
		alignSelf: 'stretch',
	},
})