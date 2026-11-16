import { useState, useEffect, useRef, useCallback } from "react";
import { ActivityIndicator, Animated, StyleSheet, TouchableOpacity, ScrollView, View, Image, Text, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { addIngredient, removeIngredient, syncIngredientsWithPantry } from "../reducers/ingredient";
import { setPantry, setLoading as setPantryLoading, setError as setPantryError } from "../reducers/pantry";
import { getPantry } from "../modules/pantryApi";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";

import addressIp from "../modules/addressIp";
import { scanPhoto } from "../modules/scanPhoto";
import { pickPictureSize } from "../modules/pictureSize";
import { enterApp, exitToHome } from "../modules/sessionNavigation";
import { clearSearchRequest, removeScanPhoto, removeUnmatched } from "../reducers/scan";
import { useAuthGate } from "../contexts/AuthGateProvider";
import UnmatchedChips from "../components/kickoff/UnmatchedChips";
import ConfirmPill from "../components/kickoff/ConfirmPill";
import RemoveBadge from "../components/kickoff/RemoveBadge";
import ListIngredients from "../components/ListIngredients";
import SearchIngredients from "../components/SearchIngredients";
import MyButton from '../components/MyButton';
import InventoryGrid from "../components/kickoff/InventoryGrid";
import PantryHero from "../components/kickoff/PantryHero";
import SelectedChips from "../components/kickoff/SelectedChips";
import buttonStyles from '../styles/Button';
import { useTheme } from "../contexts/ThemeProvider";
import useT from "../i18n/useT";
import useIngredientPhotos from "../hooks/useIngredientPhotos";
import * as Animatable from 'react-native-animatable';

const SEARCH_DEBOUNCE_MS = 250;

export default function KickoffScreen({navigation}) {
	//camera
  	const [hasPermission, setHasPermission] = useState(false);
	const [type, setType] = useState('back'); // 'back' ou 'front'
	const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', 'auto', ou 'torch'
	// About 1024 px on the long side (plan 015): the vision model shrinks a
	// larger photo anyway. Undefined keeps the camera's default size.
	const [pictureSize, setPictureSize] = useState(undefined);

	// Photos being analysed, shared with Recap (reducers/scan.js).
	const scanPhotos = useSelector((state) => state.scan.value.photos);
	const unmatched = useSelector((state) => state.scan.value.unmatched);
	const pendingSearch = useSelector((state) => state.scan.value.pendingSearch);
	const { requireAuth } = useAuthGate();
  	const [modalVisible, setModalVisible] = useState(false);
	const [searchInput, setSearchInput] = useState('');
	const [clicked, setClicked] = useState(false);
	const [dataListIngredient, setDataListIngredient] = useState([]);
	const [validatedIngredient, setValidatedIngredient] = useState([]);
	
	const ingredients = useSelector((state) => state.ingredient.value)
	useIngredientPhotos();
	// Plan 003 D.2 — gate the inventory grid behind (logged-in) && (pantry non-empty).
	// `state.pantry.value.items` is the canonical array; `.value` itself is the
	// envelope `{ items, loading, error }` from Plan 002's slice.
	const user = useSelector((state) => state.user.value);
	const pantryItems = useSelector((state) => state.pantry?.value?.items || []);
	const showGrid = !!user?.token && pantryItems.length > 0;
	const css = useTheme();
	const styles = makeStyles(css);
	const t = useT();

  	const dispatch = useDispatch();
  	const isFocused = useIsFocused();
	const insets = useSafeAreaInsets();
  	const cameraRef = useRef(null);
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
	// rien). Un ingrédient dont le pantry item a été supprimé repart de la
	// quantité de référence du catalogue (reducers/ingredient.js).
	useFocusEffect(
		useCallback(() => {
			dispatch(syncIngredientsWithPantry(pantryItems));
		}, [dispatch, pantryItems])
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

	// Recap asks for a search of a name the analysis did not recognize.
	useEffect(() => {
		if (!isFocused || !pendingSearch) return;
		openSearch(pendingSearch);
		dispatch(clearSearchRequest());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFocused, pendingSearch]);

	function openSearch(name = '') {
		setSearchInput(name);
		setModalVisible(true);
	}

	function searchUnmatched(name) {
		dispatch(removeUnmatched(name));
		openSearch(name);
	}



	
	// The server ranks the list (exact name first, plan 013): keep its order.
	// Only the latest query may fill the list, so a slow answer to "ga" never
	// replaces the answer to "garlic".
	const handleFetchIngredients = async (query, signal) => {
		const response = await fetch(`${addressIp}/ingredients/${encodeURIComponent(query)}`, { signal });
		const data =  await response.json();
		if (signal.aborted) return;
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
		const query = searchInput.trim();
		if (query.length === 0) {
			// The list shows the server's results as they are: clear them
			// with the text, so an old answer never stays on screen.
			setDataListIngredient([]);
			return undefined;
		}
		const controller = new AbortController();
		const timer = setTimeout(() => {
			handleFetchIngredients(query, controller.signal).catch((error) => {
				if (error?.name !== 'AbortError') console.error('Ingredient search failed:', error?.message);
			});
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [searchInput]);

	


	// Next never waits: Recap shows the analyses still running.
	function handleBtn () {
		navigation.navigate('Recap')
	};

	const handleCameraReady = async () => {
		try {
			const sizes = await cameraRef.current?.getAvailablePictureSizesAsync();
			setPictureSize(pickPictureSize(sizes));
		} catch {
			setPictureSize(undefined);
		}
	};

	// Each photo is analysed as soon as it is taken, in the background (plan 015).
	const takePicture = async () => {
		if (!requireAuth('scan')) return;
		let photo = null;
		try {
			// exif: false, the app never reads it; the backend strips the file metadata (B15).
			photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, exif: false });
		} catch {
			// Camera busy, unmounted or permission revoked: same message as a failed shot.
		}
		if (photo?.uri) {
			dispatch(scanPhoto({ uri: photo.uri, token: user.token }));
		} else {
			alert('Your photo was not taken well, Try to retake it pls 👏')
		}
	};

	const scanStatusText = (status) => t(`kickoff.scan.${status === 'pending' ? 'analyzing' : status}`);

		//CAMERA
	if (!permission || !permission.granted || !isFocused) {
		return (
		  <View style={styles.container}>
			<View style={styles.cameraContainer}>
                
			</View>
		  </View>
		)
	}
	

	// Unified slot model — `camera` slots are photos still in the scan slice
	// (being analysed, or failed), `search` slots are ingredients of the
	// ingredient slice, from the search, the pantry or a finished analysis.
	const slots = [
		...scanPhotos.map((photo, index) => ({ kind: 'camera', photo, index, uri: photo.uri, key: `cam-${photo.id}` })),
		...ingredients.map((ing) => ({
			kind: 'search',
			ing,
			uri: ing.photo,
			name: ing?.data?.display_name,
			toConfirm: Boolean(ing?.data?.toConfirm),
			key: `ing-${ing?.data?._id || ing?.data?.display_name}`,
		})),
	];

	const renderFilledSlot = (slot) => {
		const isSearch = slot.kind === 'search';
		const removeLabel = isSearch
			? t('kickoff.removeIngredientA11y', { name: slot.name || '' })
			: t('kickoff.removePhotoA11y');
		const status = isSearch ? null : slot.photo.status;

		return (
			<View key={slot.key} style={styles.photoShadowWrap}>
			<View style={styles.photoContainer}>
				<RemoveBadge
					onPress={() => {
						if (isSearch) {
							dispatch(removeIngredient(slot.ing));
						} else {
							dispatch(removeScanPhoto(slot.photo.id));
						}
					}}
					accessibilityLabel={removeLabel}
					style={styles.deleteIcon}
				/>
				<Image
					source={{ uri: slot.uri }}
					style={styles.photo}
					accessibilityLabel={
						isSearch
							? slot.name || t('kickoff.slot.imageA11y')
							: t('kickoff.scan.photoA11y', { index: slot.index + 1, status: scanStatusText(status) })
					}
				/>
				{!isSearch && (
					<View style={[styles.scanBand, { backgroundColor: css.palette.overlayDark }]} pointerEvents="none">
						{status === 'pending' && <ActivityIndicator size="small" color={css.palette.white} />}
						<Text style={[styles.nameBandText, { color: css.palette.white, fontFamily: css.typography.fontUI }]} numberOfLines={2}>
							{scanStatusText(status)}
						</Text>
					</View>
				)}
				{isSearch && slot.toConfirm && (
					<View style={styles.confirmSlot}>
						<ConfirmPill name={slot.name} />
					</View>
				)}
				{isSearch && !!slot.name && (
					<View style={styles.nameBand} pointerEvents="none">
						<Text
							style={[styles.nameBandText, { color: css.palette.white }]}
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
		// Pad with empty placeholders up to 5 frames: a photo holds 1 to 5
		// foods, more remain possible.
		for (let i = slots.length; i < 5; i++) {
			rendered.push(
				<View key={`ph-${i}`} style={styles.addPicturesContainer}>
					<FontAwesome name="camera-retro" size={70} color={css.flow.placeholder} />
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
		const initialQty = pantryMatch ? pantryMatch.quantity : data.g_per_serving;
		const initialUnit = pantryMatch?.unit || baseUnit;
		dispatch(addIngredient({photo: data.photo, data: {_id: data.id, display_name: data.name, g_per_serving: initialQty, defaultUnit: baseUnit, unit: initialUnit, referenceQuantity: data.g_per_serving, fromPantry: Boolean(pantryMatch), nutrition: data.nutrition }}))
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

	const totalSlots = scanPhotos.length + ingredients.length;
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
		  <View testID="kickoff-screen" style={[styles.container, { paddingBottom: bottomPadding }]} >
			<TouchableOpacity
				onPress={() =>
					user?.token
						? enterApp(navigation)
						: exitToHome(navigation)
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
										testID="kickoff-modal-close"
										text={t('kickoff.modal.close')}
										textColor={css.flow.actionIcon}
										buttonType={[buttonStyles.buttonFour, { backgroundColor: css.flow.actionBg }]}
									/>
								</View>
							</View>
       		 		    </Animatable.View>
       		 		</View>
				</KeyboardAvoidingView>
       		</Modal>
			<View style={[styles.cameraContainer, showGrid && styles.cameraContainerCompact]}>
				<CameraView
					facing={type}
					flash={flashMode}
					ref={cameraRef}
					pictureSize={pictureSize}
					onCameraReady={handleCameraReady}
					style={StyleSheet.absoluteFillObject}
				/>
				<View style={styles.buttonsCameraContainer}>
					<TouchableOpacity onPress={() => setType(type === 'back' ? 'front' : 'back')} style={styles.buttonsCamera}>	
						<FontAwesome name="rotate-right" size={25} color={css.palette.white} />
					</TouchableOpacity>

					<TouchableOpacity onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')} style={styles.buttonsCamera}>
						<FontAwesome name="flash" size={25} color={flashMode === 'off' ? css.palette.white : "#e8be4b"} />
					</TouchableOpacity>
				</View>
			</View>
			<UnmatchedChips
				names={unmatched}
				onSearch={searchUnmatched}
				onDismiss={(name) => dispatch(removeUnmatched(name))}
			/>

			{showGrid && (
				<>
					<SelectedChips
						ingredients={ingredients}
						photos={scanPhotos}
						statusText={scanStatusText}
						onAdd={() => setModalVisible(true)}
						onRemoveIngredient={(data) => onItemRemove(data)}
						onRemovePhoto={(id) => dispatch(removeScanPhoto(id))}
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
						testID="kickoff-add-ingredient"
						icon={{ name: 'plus', size: 24, color: css.flow.actionIcon }}
						accessibilityLabel={t('kickoff.addIngredient')}
						buttonType={[buttonStyles.buttonFour, styles.actionShadow, { backgroundColor: css.flow.actionBg }]}
					/>
				</View>

				<View style={styles.buttonNext}>
					<MyButton
						dataFlow={()=>handleBtn()}
						testID="kickoff-next"
						text={nextText}
						textColor={css.flow.actionText}
						icon={{ name: 'angle-double-right', size: 24, position: 'right', color: css.flow.actionIcon }}
						accessibilityLabel={nextA11y}
        				buttonType={[buttonStyles.buttonFour, styles.actionShadow, { backgroundColor: css.flow.actionBg }]}
					/>
				</View>
			</View>

			<View style={styles.snapContainer}>
				<TouchableOpacity
					onPress={takePicture}
					testID="kickoff-snap"
					accessibilityRole="button"
					accessibilityLabel={t('kickoff.scan.snapA11y')}
				>
					<FontAwesome name="circle-thin" size={95} color={css.flow.shutterRing} />
				</TouchableOpacity>
			</View>
		</View>
   )
}

// Built from the active theme (useTheme) in the component.
const makeStyles = (css) => StyleSheet.create({
	container:{
		flex: 1,
		alignContent: 'center',
		alignItems:'center',
		width: '100%',
		height: '100%',
		backgroundColor: css.flow.background,
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
		backgroundColor: css.flow.modalBg,
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
		// The camera gives way when the scan tip and the unmatched names need
		// room, so the photo slots never slide under the bottom buttons.
		flexShrink: 1,
		minHeight: 200,
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
		position: 'absolute',
		top: css.spacing.sm,
		right: css.spacing.sm,
		zIndex: 4,
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

	// Analysis state of a photo slot: full-width band, spinner while pending.
	scanBand: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 6,
		zIndex: 1,
	},

	confirmSlot: {
		position: 'absolute',
		top: 8,
		left: 8,
		zIndex: 2,
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
		borderColor: css.flow.placeholder,
		zIndex: 3,
	},

	text: {
		color: css.flow.placeholder,
	},

	containerButtonBottom: {
		flex: 0,
		marginTop: css.spacing.sm,
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

	// A little relief under the shutter, + and » (Android elevation; the
	// buttons clip their own iOS shadow with overflow hidden).
	actionShadow: {
		...css.shadow.md,
	},

	snapContainer: {
		flex: 0,
		alignItems: "center",
		justifyContent: "flex-end",
		backgroundColor: css.flow.shutterBg,
		...css.shadow.md,
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