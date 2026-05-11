// ProfileScreen — own-profile entry point.
//
// Vague 2 + 3 additions on top of the Vague 1 refactor:
//   - Bell button → Notifications stack screen, with an unread badge.
//   - Share button → native Share API with the public profile URL.
//   - Badges tab fetches /users/badges/:token (6 entries, only
//     `first_recipe` is real for now; others render dimmed).
//   - ProfileImpactStats card under stats (placeholder + (beta) label).
//   - All copy goes through `useT`; tokens come from `useTheme()` so
//     the screen reacts to theme switches.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Award,
  Bell,
  Bookmark,
  Clock,
  LayoutGrid,
  MessageCircle,
  Settings as SettingsIcon,
  Share2,
  Star,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import { availableImages } from '../modules/avatars';
import reducer, { updateUserInStore } from '../reducers/user';
import BadgeCircle from '../components/profile/BadgeCircle';
import ProfileIdentityBlock from '../components/profile/ProfileIdentityBlock';
import ProfileImpactStats from '../components/profile/ProfileImpactStats';
import ProfileScreenContainer from '../components/profile/ProfileScreenContainer';
import ProfileStatsRow from '../components/profile/ProfileStatsRow';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';
import { useResponsive } from '../styles/responsive';
import { css } from 'react-native-reanimated';

const TAB_KEYS = ['recipes', 'favorites', 'activity', 'badges'];
const TAB_ICONS = {
  recipes: LayoutGrid,
  favorites: Bookmark,
  activity: MessageCircle,
  badges: Award,
};

// ---- Recipe tile -----------------------------------------------------------

function RecipeTile({ item, css, navigation }) {
  const imageSource =
    typeof item?.picture === 'string' 
    ? { uri: `https://res.cloudinary.com/dnym6kt4p/image/upload/${item.picture}.jpg?_a=BAMAGSWO0` }
    : null;
      

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: css.palette.surfaceCard,
          borderRadius: css.radius.md,
          borderColor: css.palette.neutral200,
          marginHorizontal: css.spacing.xs,
        },
      ]}
      onPress={() => {
        navigation.navigate('Recipe', {
          recipe: {
            _id: item._id,
            name: item.name,
            description: item.description,
            ingredients: item.ingredients,
            steps: item.steps,
            votes: item.votes,
            origin: item.origin,
            picture: item.picture,
            date: item.date,
            preparationTime: item.preparationTime,
            difficulty: item.difficulty,
          },
        });
      }}
    > 
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.tileImage, { backgroundColor: css.palette.neutral200 }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel={item?.name || 'Recipe image'}
        />
      ) : (
        <View
          style={[styles.tileImagePlaceholder, { backgroundColor: css.palette.neutral200 }]}
          accessibilityRole="image"
          accessibilityLabel="Recipe placeholder"
        />
      )}
      <View style={[styles.tileBody, { padding: css.spacing.sm }]}>
        <Text
          style={[
            styles.tileTitle,
            {
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.h6Size,
              lineHeight: css.typography.h6Line,
              color: css.palette.neutral900,
            },
          ]}
          numberOfLines={2}
        >
          {item?.name || 'Untitled'}
        </Text>
        <View style={styles.tileMetaRow}>
          <Clock size={12} color={css.palette.neutral500} />
          <Text
            style={[
              styles.tileMeta,
              {
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
                marginLeft: css.spacing.xs,
              },
            ]}
          >
            {item?.preparationTime ? `${item.preparationTime} min` : '25 min'}
          </Text>
          <Star
            size={12}
            color={css.palette.neutral500}
            style={{ marginLeft: css.spacing.sm }}
          />
          <Text
            style={[
              styles.tileMeta,
              {
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
                marginLeft: css.spacing.xs,
              },
            ]}
          >
            {(item?.votes.reduce((som, vote) => som + vote.note, 0)/item?.votes.length).toFixed(1) || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RecipeGrid({ data, prefix, emptyLabel, columns, css, navigation }) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.tabEmpty, { paddingVertical: css.spacing.xl }]}>
        <Text
          style={{
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.h6Size,
            lineHeight: css.typography.h6Line,
            color: css.palette.neutral500,
          }}
        >
          {emptyLabel}
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      data={data}
      numColumns={columns}
      key={`grid-${columns}`}
      keyExtractor={(item, idx) => item?._id || `${prefix}-${idx}`}
      renderItem={({ item }) => <RecipeTile item={item} css={css} navigation={navigation} />}
      columnWrapperStyle={[styles.gridRow, { marginBottom: css.spacing.sm }]}
      contentContainerStyle={[styles.gridContainer, { paddingBottom: css.spacing.md }]}
      scrollEnabled={false}
    />
  );
}

function TopBarButton({ label, onPress, badge, children, css }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.topBarBtn,
        {
          paddingHorizontal: css.spacing.sm,
          paddingVertical: css.spacing.xs,
        },
      ]}
    >
      {children}
      {badge ? (
        <View
          style={[
            styles.badgeDot,
            { backgroundColor: css.palette.error, borderColor: css.palette.surfaceCard },
          ]}
          accessibilityLabel={`${badge}`}
        >
          <Text
            style={{
              color: css.palette.white,
              fontSize: 10,
              fontFamily: css.typography.fontUI,
              fontWeight: '700',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ---- Screen ----------------------------------------------------------------

export default function ProfileScreen({ navigation }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const unread = useSelector((state) => state.notifications?.value?.unread || 0);
  const { gridColumns } = useResponsive();

  const [activeTab, setActiveTab] = useState('recipes');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Badges fetch — only when user is logged in. The 6 stub badges live
  // server-side; we just mirror their unlocked state here.
  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    setBadgesLoading(true);
    (async () => {
      try {
        const res = await fetch(`${addressIp}/users/badges/${user.token}`);
        const data = await res.json();
        if (!cancelled && data.result) {
          setBadges(data.badges || []);
        }
      } catch {
        // Silent: tab will fall back to a generic 3-stub display.
      } finally {
        if (!cancelled) setBadgesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  if (!user || !user.token) {
    return null;
  }

  const handleImageChange = async (newImage) => {
    setAvatarModalVisible(false);
    try {
      const res = await fetch(`${addressIp}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: user.token, image: newImage }),
      });
      const data = await res.json();
      if (data.result) {
        dispatch(updateUserInStore(data.updatedUser || { image: newImage }));
      } else {
        Alert.alert(t('common.error'), data.error || t('common.networkError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('common.networkError'));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('profile.shareMessage', { username: user.username }),
      });
    } catch {
      // User-cancelled share is not an error worth surfacing.
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'recipes':
        return (
          <RecipeGrid
            data={user.recipes}
            prefix="r"
            emptyLabel={t('profile.empty.recipes')}
            columns={gridColumns}
            css={css}
          />
        );
      case 'favorites':
        return (
          <RecipeGrid
            data={user.favorites}
            prefix="f"
            emptyLabel={t('profile.empty.favorites')}
            columns={gridColumns}
            css={css}
            navigation={navigation}
          />
        );
      case 'activity':
        return (
          <View
            style={[
              styles.activityCard,
              {
                backgroundColor: css.palette.surfaceCard,
                borderRadius: css.radius.md,
                paddingVertical: css.spacing.xl,
                paddingHorizontal: css.spacing.md,
                borderColor: css.palette.neutral200,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
              }}
            >
              {t('profile.empty.activity')}
            </Text>
          </View>
        );
      case 'badges':
      default:
        return (
          <View
            style={[
              styles.badgesRow,
              {
                paddingVertical: css.spacing.md,
              },
            ]}
          >
            {(badges.length ? badges : DEFAULT_BADGES).map((badge) => (
              <View
                key={badge.key}
                style={{ opacity: badge.unlocked ? 1 : 0.4, alignItems: 'center' }}
                accessibilityLabel={badge.label}
              >
                <BadgeCircle
                  icon={<Award size={20} color={css.palette.neutral900} />}
                  label={t(`profile.badges.${badge.key}`, { defaultValue: badge.label })}
                />
              </View>
            ))}
          </View>
        );
    }
  };

  const recipeCount = user.recipes?.length || 0;
  const favoriteCount = user.favorites?.length || 0;
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const stats = useMemo(
    () => [
      { value: recipeCount, label: t('profile.stats.recipes') },
      { value: favoriteCount, label: t('profile.stats.favorites') },
      { value: '0', label: t('profile.stats.cooked') },
      { value: unlockedBadgesCount, label: t('profile.stats.badges') },
    ],
    [recipeCount, favoriteCount, unlockedBadgesCount, t],
  );

  // Goal-aware identity subtitle. Falls back to default subtitle inside
  // ProfileIdentityBlock if no goal is set.
  const goalKey = user?.nutritionalGoal;
  const subtitleOverride = goalKey
    ? t(`profile.subtitle.${goalKey}`, { defaultValue: undefined })
    : undefined;

  return (
    <ProfileScreenContainer
      header={
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: css.palette.surfaceCard,
              borderBottomColor: css.palette.neutral200,
              paddingVertical: css.spacing.cardGap,
              paddingHorizontal: css.spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.topBarUsername,
              {
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
              },
            ]}
            numberOfLines={1}
          >
            @{user.username}
          </Text>
          <View style={styles.topBarActions}>
            <TopBarButton
              label={t('profile.topBarShare')}
              onPress={handleShare}
              css={css}
            >
              <Share2 size={25} color={css.palette.neutral900} />
            </TopBarButton>
            <TopBarButton
              label={t('profile.topBarNotifications')}
              onPress={() => navigation.navigate('Notifications')}
              badge={unread}
              css={css}
            >
              <Bell size={25} color={css.palette.neutral900} />
            </TopBarButton>
            <TopBarButton
              label={t('profile.topBarSettings')}
              onPress={() => navigation.navigate('Settings')}
              css={css}
            >
              <SettingsIcon size={25} color={css.palette.neutral900} />
            </TopBarButton>
          </View>
        </View>
      }
    >
      <ProfileIdentityBlock
        user={user}
        editable
        onAvatarPress={() => setAvatarModalVisible(true)}
        subtitleOverride={subtitleOverride}
      />

      <ProfileStatsRow stats={stats} style={css} />

      {/* <ProfileImpactStats /> */}

      <View
        style={[
          styles.tabsRow,
          {
            backgroundColor: css.palette.surfaceCard,
            paddingTop: css.spacing.cardGap,
          },
        ]}
      >
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          const isActive = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(`profile.tabs.${key}`)}
              hitSlop={4}
              style={styles.tab}
            >
              <View
                style={[
                  styles.tabInner,
                  {
                    paddingHorizontal: css.spacing.xs,
                    paddingBottom: css.spacing.sm,
                  },
                  !isActive && styles.tabInnerInactive,
                ]}
              >
                <Icon size={16} color={css.palette.neutral900} />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      fontFamily: css.typography.fontUI,
                      fontSize: css.typography.h6Size,
                      lineHeight: css.typography.h6Line,
                      color: css.palette.neutral900,
                      marginTop: css.spacing.xs,
                    },
                    isActive && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {t(`profile.tabs.${key}`)}
                </Text>
              </View>
              <View
                style={[
                  styles.tabUnderline,
                  isActive && { backgroundColor: css.palette.neutral900 },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.tabContent,
          { backgroundColor: css.palette.surface , paddingTop: css.spacing.md },
        ]}
      >
        {renderTabContent()}
      </View>

      <Modal
        transparent
        visible={avatarModalVisible}
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: css.palette.overlayDark }]}
          onPress={() => setAvatarModalVisible(false)}
          accessibilityLabel={t('profile.avatarModalDismiss')}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: css.palette.surfaceCard,
                borderRadius: css.radius.lg,
                padding: css.spacing.md,
                ...css.shadow.card,
              },
            ]}
            onPress={() => {}}
          >
            <Text
              style={{
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h4Size,
                lineHeight: css.typography.h4Line,
                color: css.palette.neutral900,
                fontWeight: '600',
                marginBottom: css.spacing.md,
              }}
            >
              {t('profile.avatarModalTitle')}
            </Text>
            <ScrollView contentContainerStyle={styles.avatarGrid}>
              {availableImages.slice(2).map((image) => (
                <TouchableOpacity
                  key={image.nameFile}
                  onPress={() => handleImageChange(image.nameFile)}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.avatarChoose', { name: image.nameFile })}
                  style={styles.avatarOptionWrap}
                >
                  <Image
                    source={image.path}
                    style={[
                      styles.avatarOption,
                      {
                        borderRadius: css.radius.md,
                        backgroundColor: css.palette.neutral200,
                      },
                    ]}
                    accessibilityIgnoresInvertColors
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ProfileScreenContainer>
  );
}

// Fallback when /users/badges/:token is unreachable: render the same
// 6 keys the backend exposes so the UX shape is stable.
const DEFAULT_BADGES = [
  { key: 'first_recipe', label: 'First recipe', unlocked: false },
  { key: 'ten_cooked', label: '10 cooked', unlocked: false },
  { key: 'seasonal', label: 'Seasonal', unlocked: false },
  { key: 'top_chef', label: 'Top chef', unlocked: false },
  { key: 'fifty_recipes', label: '50 recipes', unlocked: false },
  { key: 'rated', label: 'Top rated', unlocked: false },
];

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  topBarUsername: {
    flexShrink: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabInnerInactive: { opacity: 0.5 },
  tabLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  tabLabelActive: { fontWeight: '600' },
  tabUnderline: {
    height: 2,
    width: '60%',
    backgroundColor: 'transparent',
  },

  tabContent: {
    height: '100%',
  },

  gridContainer: {},
  gridRow: {
    justifyContent: 'space-between',
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: 90,
  },
  tileImagePlaceholder: {
    width: '100%',
    height: 90,
  },
  tileBody: {},
  tileTitle: {
    fontWeight: '600',
  },
  tileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tileMeta: {},

  tabEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 16,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOptionWrap: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  avatarOption: {
    width: '100%',
    height: '100%',
  },
});
