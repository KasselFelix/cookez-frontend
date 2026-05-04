// SettingsScreen — refactored for Vague 2 + 3.
//
// Sections:
//   - Account             (Personal info, Security)
//   - Culinary profile    (Nutritional goal, Diets, Allergies, Household)
//   - App preferences     (Language, Theme, Location, Silence notifs)
//   - Social              (Invite friends)
//   - About               (Version)
//   - Danger              (Logout, Delete)
//
// Breaking change absorbed: `user.location` is now an object
// `{ coords, region, consent }` server-side. All reads here use
// `user.location?.region`.
//
// Diet read priority: `user.dietRestrictions[]` → fallback to legacy
// `user.settings.diet` (single string). Saving always writes the new
// `dietRestrictions` array via the new PUT /users/profile endpoint.

import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell,
  ChevronLeft,
  Flag,
  Flame,
  Globe,
  Info,
  Leaf,
  Lock,
  LogOut,
  MapPin,
  Palette,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import { setComments } from '../reducers/comment';
import { clearIngredients } from '../reducers/ingredient';
import { clearPicture } from '../reducers/picture';
import { clearRecipes } from '../reducers/recipe';
import { clearFollow } from '../reducers/follow';
import { clearNotifications } from '../reducers/notifications';
import { removeUserToStore, updateUserInStore } from '../reducers/user';
import DietMultiSelect, {
  readDietRestrictions,
} from '../components/profile/DietMultiSelect';
import LanguagePickerSheet from '../components/profile/LanguagePickerSheet';
import LocationToggle from '../components/profile/LocationToggle';
import NutritionalGoalPicker from '../components/profile/NutritionalGoalPicker';
import ProfileScreenContainer from '../components/profile/ProfileScreenContainer';
import SettingsRow from '../components/profile/SettingsRow';
import ThemePickerSheet from '../components/profile/ThemePickerSheet';
import { useTheme, useThemeControls } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';

const ICON_SIZE = 18;

export default function SettingsScreen({ navigation }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const localeMode = useSelector(
    (state) => state?.locale?.value?.lang ?? 'system',
  );
  const { themeKey } = useThemeControls();

  const [modalKind, setModalKind] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Pickers / sheets visibility.
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [dietPickerVisible, setDietPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);

  if (!user || !user.token) {
    return null;
  }

  const closeModal = () => {
    setModalKind(null);
    setDraft({});
  };

  // Use the new partial-update endpoint. The legacy alias /users/update
  // still exists for backwards-compat; new code targets /users/profile.
  const putUpdate = async (overrides) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${addressIp}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: user.token, ...overrides }),
      });
      const data = await res.json();
      if (data.result) {
        dispatch(updateUserInStore(data.updatedUser || overrides));
        closeModal();
      } else {
        Alert.alert(t('common.error'), data.error || t('common.networkError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      dispatch(removeUserToStore());
      dispatch(clearIngredients());
      dispatch(clearRecipes());
      dispatch(setComments([]));
      dispatch(clearPicture());
      dispatch(clearFollow());
      dispatch(clearNotifications());
      navigation.navigate('Home');
    } catch {
      Alert.alert(t('common.error'), 'Could not complete logout.');
    }
  };

  const openModal = (kind) => {
    switch (kind) {
      case 'personal':
        setDraft({
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email || '',
          age: String(user.age ?? ''),
          bio: user.bio || '',
          // Breaking-change absorption: read from the new object shape.
          region: user.location?.region || '',
          cuisineSpecialty: user.cuisineSpecialty || '',
        });
        break;
      case 'household':
        setDraft({ householdComposition: String(user.settings?.householdComposition ?? 0) });
        break;
      case 'allergies':
        setDraft({ allergy: (user.settings?.allergy || []).join(', ') });
        break;
      default:
        return;
    }
    setModalKind(kind);
  };

  const saveModal = () => {
    switch (modalKind) {
      case 'personal':
        return putUpdate({
          firstname: draft.firstname,
          lastname: draft.lastname,
          email: draft.email,
          age: Number(draft.age) || 0,
          bio: draft.bio,
          // Region is the only field we update inside the location object.
          // Coords + consent are owned by LocationToggle.
          location: { region: draft.region },
          cuisineSpecialty: draft.cuisineSpecialty,
        });
      case 'household':
        return putUpdate({
          settings: {
            householdComposition: Number(draft.householdComposition) || 0,
          },
        });
      case 'allergies': {
        const list = (draft.allergy || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return putUpdate({ settings: { allergy: list } });
      }
      default:
        return undefined;
    }
  };

  const confirmLogout = () =>
    Alert.alert(t('common.logoutTitle'), t('common.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logoutTitle'), style: 'destructive', onPress: handleLogout },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('common.deleteTitle'), t('common.deleteMessage'), [{ text: t('common.ok') }]);

  const handleInvite = async () => {
    try {
      await Share.share({ message: t('settings.socialSection.shareLink') });
    } catch {
      // Cancel is silent.
    }
  };

  const householdValue = user.settings?.householdComposition || 0;
  const dietRestrictions = useMemo(() => readDietRestrictions(user), [user]);
  const allergyCount = user.settings?.allergy?.length || 0;
  const goalLabelKey = user?.nutritionalGoal
    ? `settings.nutritionalGoals.${user.nutritionalGoal}`
    : 'settings.nutritionalGoals.none';

  const dietSummary =
    dietRestrictions.length === 0
      ? t('settings.diets.noneSelected')
      : dietRestrictions
          .map((k) => t(`settings.diets.${k}`, { defaultValue: k }))
          .join(', ');

  const languageLabel =
    localeMode === 'fr'
      ? t('settings.language.french')
      : localeMode === 'en'
      ? t('settings.language.english')
      : t('settings.language.system');

  const themeLabel = t(`settings.theme.${themeKey}`, { defaultValue: themeKey });

  const locationConsent = !!user.location?.consent;

  const iconColor = css.palette.neutral900;
  const dangerIconColor = css.palette.error;

  return (
    <ProfileScreenContainer
      header={
        <View
          style={[
            styles.header,
            {
              backgroundColor: css.palette.surfaceCard,
              borderBottomColor: css.palette.neutral200,
              paddingVertical: css.spacing.cardGap,
              paddingHorizontal: css.spacing.cardGap,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={iconColor} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h4Size,
                lineHeight: css.typography.h4Line,
                color: css.palette.neutral900,
              },
            ]}
          >
            {t('settings.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      }
    >
      <SectionHeader css={css}>{t('settings.sections.account')}</SectionHeader>
      <SettingsRow
        icon={<UserIcon size={ICON_SIZE} color={iconColor} />}
        label={t('settings.account.personal')}
        onPress={() => openModal('personal')}
      />
      <SettingsRow
        icon={<Lock size={ICON_SIZE} color={iconColor} />}
        label={t('settings.account.security')}
        value={t('common.comingSoon')}
        onPress={() => Alert.alert(t('common.comingSoon'))}
      />

      <SectionHeader css={css}>{t('settings.sections.culinary')}</SectionHeader>
      <SettingsRow
        icon={<Flame size={ICON_SIZE} color={iconColor} />}
        label={t('settings.culinary.nutritionalGoal')}
        value={t(goalLabelKey)}
        onPress={() => setGoalPickerVisible(true)}
      />
      <SettingsRow
        icon={<Leaf size={ICON_SIZE} color={iconColor} />}
        label={t('settings.culinary.diets')}
        value={dietSummary}
        onPress={() => setDietPickerVisible(true)}
      />
      <SettingsRow
        icon={<Flag size={ICON_SIZE} color={iconColor} />}
        label={t('settings.culinary.allergies')}
        value={String(allergyCount)}
        onPress={() => openModal('allergies')}
      />
      <SettingsRow
        icon={<Users size={ICON_SIZE} color={iconColor} />}
        label={t('settings.culinary.household')}
        value={`${householdValue}`}
        onPress={() => openModal('household')}
      />

      <SectionHeader css={css}>{t('settings.sections.appPreferences')}</SectionHeader>
      <SettingsRow
        icon={<Globe size={ICON_SIZE} color={iconColor} />}
        label={t('settings.appPrefs.language')}
        value={languageLabel}
        onPress={() => setLanguageSheetVisible(true)}
      />
      <SettingsRow
        icon={<Palette size={ICON_SIZE} color={iconColor} />}
        label={t('settings.appPrefs.theme')}
        value={themeLabel}
        onPress={() => setThemeSheetVisible(true)}
      />
      <View
        style={[
          styles.toggleRow,
          {
            backgroundColor: css.palette.surfaceCard,
            borderBottomColor: css.palette.neutral200,
            paddingVertical: 14,
            paddingHorizontal: 16,
          },
        ]}
      >
        <View style={styles.toggleIcon}>
          <MapPin size={ICON_SIZE} color={iconColor} />
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.bodySmSize,
            color: css.palette.neutral900,
          }}
        >
          {t('settings.appPrefs.location')}
        </Text>
        <Text
          style={{
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.h6Size,
            color: css.palette.neutral500,
            marginRight: 8,
          }}
        >
          {locationConsent
            ? t('settings.appPrefs.locationOn')
            : t('settings.appPrefs.locationOff')}
        </Text>
        <LocationToggle />
      </View>
      <SettingsRow
        icon={<Bell size={ICON_SIZE} color={iconColor} />}
        label={t('settings.appPrefs.notifications')}
        value={t('common.comingSoon')}
        onPress={() => Alert.alert(t('common.comingSoon'))}
      />

      <SectionHeader css={css}>{t('settings.sections.social')}</SectionHeader>
      <SettingsRow
        icon={<Users size={ICON_SIZE} color={iconColor} />}
        label={t('settings.socialSection.invite')}
        onPress={handleInvite}
      />

      <SectionHeader css={css}>{t('settings.sections.about')}</SectionHeader>
      <SettingsRow
        icon={<Info size={ICON_SIZE} color={iconColor} />}
        label={t('settings.about.version')}
        value={t('settings.about.appVersion')}
        onPress={() => Alert.alert(t('common.comingSoon'))}
      />

      <SectionHeader css={css}>{t('settings.sections.danger')}</SectionHeader>
      <SettingsRow
        icon={<LogOut size={ICON_SIZE} color={dangerIconColor} />}
        label={t('settings.danger.logout')}
        danger
        onPress={confirmLogout}
      />
      <SettingsRow
        icon={<Trash2 size={ICON_SIZE} color={dangerIconColor} />}
        label={t('settings.danger.delete')}
        danger
        onPress={confirmDelete}
      />

      <View style={[styles.bottomPadding, { height: css.spacing.lg }]} />

      {modalKind ? (
        <EditModal
          schemaKind={modalKind}
          draft={draft}
          setDraft={setDraft}
          isSaving={isSaving}
          onSave={saveModal}
          onClose={closeModal}
          css={css}
          t={t}
        />
      ) : null}

      <ThemePickerSheet
        visible={themeSheetVisible}
        onClose={() => setThemeSheetVisible(false)}
      />
      <LanguagePickerSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
      />
      <DietMultiSelect
        visible={dietPickerVisible}
        onClose={() => setDietPickerVisible(false)}
      />
      <NutritionalGoalPicker
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
      />
    </ProfileScreenContainer>
  );
}

function SectionHeader({ children, css }) {
  return (
    <Text
      style={[
        styles.sectionHeader,
        {
          fontFamily: css.typography.fontUI,
          fontSize: css.typography.h6Size,
          lineHeight: css.typography.h6Line,
          color: css.palette.primary800,
          paddingTop: css.spacing.lg,
          paddingBottom: css.spacing.sm,
          paddingHorizontal: css.spacing.md,
          backgroundColor: css.palette.surface,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function EditModal({ schemaKind, draft, setDraft, isSaving, onSave, onClose, css, t }) {
  const schema = useMemo(() => buildSchema(schemaKind, t), [schemaKind, t]);
  if (!schema) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.modalOverlay, { backgroundColor: css.palette.overlayDark }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: css.palette.surfaceCard,
              borderRadius: css.radius.lg,
              padding: css.spacing.md,
              ...css.shadow.card,
            },
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              {
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h4Size,
                lineHeight: css.typography.h4Line,
                color: css.palette.neutral900,
                marginBottom: css.spacing.sm,
              },
            ]}
          >
            {schema.title}
          </Text>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={[styles.modalScrollContent, { paddingBottom: css.spacing.sm }]}
            keyboardShouldPersistTaps="handled"
          >
            {schema.fields.map(({ key, label, multiline, ...rest }) => (
              <View key={key} style={[styles.fieldWrap, { marginBottom: css.spacing.cardGap }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      fontFamily: css.typography.fontUI,
                      fontSize: css.typography.h6Size,
                      lineHeight: css.typography.h6Line,
                      color: css.palette.neutral700,
                      marginBottom: css.spacing.xs,
                    },
                  ]}
                >
                  {label}
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      borderColor: css.palette.neutral300,
                      borderRadius: css.radius.sm,
                      paddingVertical: css.spacing.sm,
                      paddingHorizontal: css.spacing.cardGap,
                      fontFamily: css.typography.fontBody,
                      fontSize: css.typography.bodySmSize,
                      lineHeight: css.typography.bodySmLine,
                      color: css.palette.neutral900,
                      backgroundColor: css.palette.surface,
                    },
                    multiline && styles.fieldInputMultiline,
                  ]}
                  placeholderTextColor={css.input.placeholderColor}
                  multiline={multiline}
                  accessibilityLabel={label}
                  value={draft[key]}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                  {...rest}
                />
              </View>
            ))}
          </ScrollView>
          <View style={[styles.modalActions, { marginTop: css.spacing.sm }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalBtn,
                {
                  borderRadius: css.radius.pill,
                  paddingHorizontal: css.spacing.lg,
                  paddingVertical: css.spacing.sm,
                  borderColor: css.palette.neutral300,
                  borderWidth: 1,
                  marginLeft: css.spacing.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text
                style={{
                  fontFamily: css.typography.fontUI,
                  color: css.palette.neutral900,
                  fontWeight: '500',
                }}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving}
              style={[
                styles.modalBtn,
                {
                  borderRadius: css.radius.pill,
                  paddingHorizontal: css.spacing.lg,
                  paddingVertical: css.spacing.sm,
                  backgroundColor: css.palette.neutral900,
                  marginLeft: css.spacing.sm,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
            >
              <Text
                style={{
                  fontFamily: css.typography.fontUI,
                  color: css.palette.white,
                  fontWeight: '600',
                }}
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Schema factory keeps i18n keys close to the modal definitions.
function buildSchema(kind, t) {
  switch (kind) {
    case 'personal':
      return {
        title: t('settings.modals.personalTitle'),
        fields: [
          { key: 'firstname', label: t('settings.modals.fields.firstname') },
          { key: 'lastname', label: t('settings.modals.fields.lastname') },
          { key: 'email', label: t('settings.modals.fields.email'), keyboardType: 'email-address', autoCapitalize: 'none' },
          { key: 'age', label: t('settings.modals.fields.age'), keyboardType: 'numeric' },
          { key: 'bio', label: t('settings.modals.fields.bio'), multiline: true },
          { key: 'region', label: t('settings.modals.fields.region') },
          { key: 'cuisineSpecialty', label: t('settings.modals.fields.cuisineSpecialty') },
        ],
      };
    case 'household':
      return {
        title: t('settings.modals.householdTitle'),
        fields: [
          { key: 'householdComposition', label: t('settings.modals.householdLabel'), keyboardType: 'numeric' },
        ],
      };
    case 'allergies':
      return {
        title: t('settings.modals.allergiesTitle'),
        fields: [
          {
            key: 'allergy',
            label: t('settings.modals.allergiesLabel'),
            placeholder: t('settings.modals.allergiesPlaceholder'),
          },
        ],
      };
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerSpacer: { width: 44 },

  sectionHeader: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
  },
  toggleIcon: {
    marginRight: 14,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomPadding: {},

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '85%',
  },
  modalTitle: { fontWeight: '600' },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: {},
  fieldWrap: {},
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
  },
  fieldInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
