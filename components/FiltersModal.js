import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, SlidersHorizontal, X } from "lucide-react-native";

const DRAG_DISMISS_THRESHOLD = 100;
const DRAG_VELOCITY_THRESHOLD = 0.5;

import useT from "../i18n/useT";
import { TAG_VOCABULARY, getTagLabel } from "../modules/tagVocabulary";
import { useTheme } from "../contexts/ThemeProvider";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// 3-state cycle: Neutral → Required → Excluded → Neutral
function cycleFilter(item, required, excluded, setRequired, setExcluded) {
  if (required.includes(item)) {
    setRequired((arr) => arr.filter((x) => x !== item));
    setExcluded((arr) => [...arr, item]);
  } else if (excluded.includes(item)) {
    setExcluded((arr) => arr.filter((x) => x !== item));
  } else {
    setRequired((arr) => [...arr, item]);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function TriStateChip({ css, label, state, onPress, accessibilityLabel }) {
  const isRequired = state === "required";
  const isExcluded = state === "excluded";
  const isNeutral = !isRequired && !isExcluded;

  const containerStyle = [
    chipStyles(css).base,
    isNeutral && chipStyles(css).neutral,
    isRequired && chipStyles(css).required,
    isExcluded && chipStyles(css).excluded,
  ];

  const textStyle = [
    chipStyles(css).text,
    isNeutral && chipStyles(css).textNeutral,
    (isRequired || isExcluded) && chipStyles(css).textActive,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !isNeutral }}
    >
      {isRequired && (
        <Check size={12} color={css.palette.white} strokeWidth={3} />
      )}
      {isExcluded && (
        <X size={12} color={css.palette.white} strokeWidth={3} />
      )}
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = (css) =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      gap: css.spacing.xs,
      paddingVertical: css.spacing.sm,
      paddingHorizontal: css.spacing.md,
      borderRadius: css.radius.pill,
      borderWidth: 1,
      marginRight: css.spacing.sm,
      marginBottom: css.spacing.sm,
    },
    neutral: {
      backgroundColor: css.palette.surfaceCard,
      borderColor: css.palette.neutral300,
    },
    required: {
      backgroundColor: css.palette.primary800,
      borderColor: css.palette.primary800,
    },
    excluded: {
      backgroundColor: css.palette.error,
      borderColor: css.palette.error,
    },
    text: {
      fontFamily: css.typography.fontUI,
      fontSize: css.typography.h5Size,
      fontWeight: "500",
    },
    textNeutral: {
      color: css.palette.neutral800 ?? css.palette.neutral900,
    },
    textActive: {
      color: css.palette.white,
    },
  });

export default function FiltersModal({
  visible,
  onClose,
  requiredTags,
  excludedTags,
  setRequiredTags,
  setExcludedTags,
  requiredOrigins,
  excludedOrigins,
  setRequiredOrigins,
  setExcludedOrigins,
  availableOrigins,
}) {
  const css = useTheme();
  const t = useT();
  const styles = makeStyles(css);

  // `visible` is the parent's intent. `rendered` keeps the Modal mounted
  // while the closing animation plays — without it the Modal would unmount
  // instantly on visible=false and the slide-down would never appear.
  const [rendered, setRendered] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      // Separate animations: backdrop fades in via opacity; sheet springs
      // up from off-screen. Both use the native driver.
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 425,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 425,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, rendered, backdropOpacity, sheetTranslateY]);

  // Drag-to-close: pattern inspired by `OriginPicker.js`. The PanResponder
  // is attached to the drag handle zone only — the sheet's content keeps
  // its own touch handling (taps on chips, scroll, etc.).
  //
  // - `onStartShouldSetPanResponder: () => true` — claim the touch on start
  //   (the zone holds nothing tappable, so capturing every touch is safe).
  // - `onPanResponderGrant` stops any in-flight animation and snapshots the
  //   current Y so the drag continues smoothly even mid-spring.
  const dragStartY = useRef(0);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation((value) => {
            dragStartY.current = value;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.max(0, dragStartY.current + g.dy);
          sheetTranslateY.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const total = dragStartY.current + g.dy;
          if (total > DRAG_DISMISS_THRESHOLD || g.vy > DRAG_VELOCITY_THRESHOLD) {
            onClose();
          } else {
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              friction: 9,
              tension: 60,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 9,
            tension: 60,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, sheetTranslateY]
  );

  const handleClearAll = () => {
    setRequiredTags([]);
    setExcludedTags([]);
    setRequiredOrigins([]);
    setExcludedOrigins([]);
  };

  const tagState = (tag) => {
    if (requiredTags.includes(tag)) return "required";
    if (excludedTags.includes(tag)) return "excluded";
    return "neutral";
  };

  const originState = (origin) => {
    if (requiredOrigins.includes(origin)) return "required";
    if (excludedOrigins.includes(origin)) return "excluded";
    return "neutral";
  };

  const stateLabel = (state) =>
    t(`userDashboard.filtersModal.state${capitalize(state)}`);

  return (
    <Modal
      visible={rendered}
      animationType="none"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modal,
          {
            backgroundColor: css.palette.overlayDark,
            opacity: backdropOpacity,
          },
        ]}
      >
        {/* Tap-outside-to-close: Pressable on the dim area dispatches
            onClose; the sheet wraps in its own Animated.View with
            onStartShouldSetResponder so taps INSIDE the sheet are absorbed
            (don't bubble up and close it). */}
        <Pressable
          onPress={onClose}
          style={styles.backdropTouchable}
          accessibilityRole="button"
          accessibilityLabel={t("userDashboard.filtersModal.closeA11y")}
        />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View
            {...panResponder.panHandlers}
            style={styles.dragHandleArea}
            accessibilityRole="adjustable"
            accessibilityLabel={t("userDashboard.filtersModal.closeA11y")}
            accessibilityHint="Drag down to close"
          >
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <SlidersHorizontal
                size={18}
                color={css.palette.primary800}
              />
              <Text style={styles.title}>
                {t("userDashboard.filtersModal.title")}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Tags ─── */}
            <Text style={styles.sectionTitle}>
              {t("userDashboard.filtersModal.sectionTags")}
            </Text>
            <View style={styles.chipGrid}>
              {TAG_VOCABULARY.map((tag) => {
                const state = tagState(tag);
                const label = getTagLabel(t, tag);
                return (
                  <TriStateChip
                    key={tag}
                    css={css}
                    label={label}
                    state={state}
                    onPress={() =>
                      cycleFilter(
                        tag,
                        requiredTags,
                        excludedTags,
                        setRequiredTags,
                        setExcludedTags
                      )
                    }
                    accessibilityLabel={t(
                      "userDashboard.filtersModal.tagA11y",
                      { name: label, state: stateLabel(state) }
                    )}
                  />
                );
              })}
            </View>

            {/* ─── Origins ─── */}
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              {t("userDashboard.filtersModal.sectionOrigins")}
            </Text>
            {availableOrigins.length === 0 ? (
              <Text style={styles.emptyOrigins}>
                {t("userDashboard.filtersModal.emptyOrigins")}
              </Text>
            ) : (
              <View style={styles.chipGrid}>
                {availableOrigins.map((origin) => {
                  const state = originState(origin);
                  return (
                    <TriStateChip
                      key={origin}
                      css={css}
                      label={origin}
                      state={state}
                      onPress={() =>
                        cycleFilter(
                          origin,
                          requiredOrigins,
                          excludedOrigins,
                          setRequiredOrigins,
                          setExcludedOrigins
                        )
                      }
                      accessibilityLabel={t(
                        "userDashboard.filtersModal.originA11y",
                        { name: origin, state: stateLabel(state) }
                      )}
                    />
                  );
                })}
              </View>
            )}

            {/* ─── Clear all ─── */}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel={t("userDashboard.filtersModal.clearAll")}
            >
              <Text style={styles.clearAllText}>
                {t("userDashboard.filtersModal.clearAll")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (css) =>
  StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdropTouchable: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: css.palette.surface,
      borderTopLeftRadius: css.radius.xl,
      borderTopRightRadius: css.radius.xl,
      paddingHorizontal: css.spacing.md,
      paddingBottom: css.spacing.xl,
      maxHeight: "85%",
      ...css.shadow.lg,
    },
    dragHandleArea: {
      alignSelf: "stretch",
      alignItems: "center",
      paddingVertical: css.spacing.sm,
      marginBottom: css.spacing.sm,
    },
    dragHandle: {
      width: 44,
      height: 5,
      borderRadius: css.radius.pill,
      backgroundColor: css.palette.neutral300,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: css.spacing.md,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: css.spacing.sm,
    },
    title: {
      fontFamily: css.typography.fontHeading,
      fontSize: css.typography.h3Size,
      color: css.palette.neutral900,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: css.spacing.md,
    },
    sectionTitle: {
      fontFamily: css.typography.fontHeading,
      fontSize: css.typography.h5Size,
      color: css.palette.neutral700,
      textTransform: "uppercase",
      letterSpacing: css.typography.overlineSpacing,
      marginBottom: css.spacing.sm,
    },
    sectionTitleSpaced: {
      marginTop: css.spacing.md,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyOrigins: {
      fontFamily: css.typography.fontBody,
      fontSize: css.typography.bodySize,
      color: css.palette.neutral500,
      fontStyle: "italic",
      paddingVertical: css.spacing.sm,
    },
    clearAllButton: {
      alignSelf: "center",
      marginTop: css.spacing.lg,
      paddingVertical: css.spacing.sm,
      paddingHorizontal: css.spacing.lg,
    },
    clearAllText: {
      fontFamily: css.typography.fontUI,
      fontSize: css.typography.bodySize,
      fontWeight: "600",
      color: css.palette.primary800,
      textDecorationLine: "underline",
    },
  });
