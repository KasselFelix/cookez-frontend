// PublicProfileScreen — read-only view of another user's profile.
//
// Vague 2 contracts wired in:
//   - POST /users/follow/:username    (optimistic via redux follow slice)
//   - POST /users/unfollow/:username
//   - GET  /users/recipes/:username   (paginated, scroll-infinite)
//
// Self-detection: if the route param matches the logged-in username,
// the Follow button is replaced by an "Edit profile" CTA that pushes
// the Settings stack screen.
//
// Breaking-change absorption: the public profile may include the new
// `location: { region }` shape; we read `profile.location?.region`
// (string fallback for older payloads).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  ChevronLeft,
  Filter,
  Flame,
  Leaf,
  MoreHorizontal,
  Search,
  Star,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import {
  commitFollow,
  setFollowOptimistic,
} from '../reducers/follow';
import BadgeCircle from '../components/profile/BadgeCircle';
import PillChip from '../components/profile/PillChip';
import ProfileIdentityBlock from '../components/profile/ProfileIdentityBlock';
import ProfileScreenContainer from '../components/profile/ProfileScreenContainer';
import ProfileStatsRow from '../components/profile/ProfileStatsRow';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';
import { useResponsive } from '../styles/responsive';

const TAGS = ['Pasta', 'Quick', 'Veggie', '+ tag'];
const PAGE_LIMIT = 20;

const BADGE_KEYS = [
  { key: 'top-chef', Icon: Award, labelKey: 'profile.badges.top_chef' },
  { key: '50-recipes', Icon: Flame, labelKey: 'profile.badges.fifty_recipes' },
  { key: 'seasonal', Icon: Leaf, labelKey: 'profile.badges.seasonal' },
  { key: 'rating', Icon: Star, labelKey: 'profile.badges.rated' },
];

// Public profile uses a denser grid than ProfileScreen.
function publicGridColumnsFor(width) {
  return width >= 768 ? 4 : 3;
}

function HeaderIconButton({ label, onPress, children }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.headerBtn}
    >
      {children}
    </TouchableOpacity>
  );
}

function PublicHeader({ navigation, title, t, css }) {
  return (
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
      <HeaderIconButton
        label={t('publicProfile.headerBack')}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeft size={22} color={css.palette.neutral900} />
      </HeaderIconButton>
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
        numberOfLines={1}
      >
        {title}
      </Text>
      <HeaderIconButton
        label={t('publicProfile.headerMore')}
        onPress={() => Alert.alert(t('common.comingSoon'))}
      >
        <MoreHorizontal size={20} color={css.palette.neutral900} />
      </HeaderIconButton>
    </View>
  );
}

function RecipeGridItem({ item, css }) {
  const imageSource =
    typeof item?.image === 'string' && item.image.startsWith('http')
      ? { uri: item.image }
      : null;
  return (
    <View style={[styles.gridItem, { marginHorizontal: css.spacing.xs }]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.gridItemImage,
            { borderRadius: css.radius.sm, backgroundColor: css.palette.neutral200 },
          ]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel={item?.title || 'Recipe image'}
        />
      ) : (
        <View
          style={[
            styles.gridItemPlaceholder,
            { borderRadius: css.radius.sm, backgroundColor: css.palette.neutral200 },
          ]}
          accessibilityRole="image"
          accessibilityLabel={item?.title || 'Recipe placeholder'}
        />
      )}
    </View>
  );
}

export default function PublicProfileScreen({ navigation, route }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.value);
  const followingMap = useSelector((state) => state.follow?.value?.followingByUsername || {});
  const username = route?.params?.username || currentUser?.username;
  const { width } = useResponsive();
  const gridColumns = publicGridColumnsFor(width);

  const isSelf = !!(username && currentUser?.username && username === currentUser.username);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Pasta');

  // Recipes pagination state.
  const [recipes, setRecipes] = useState([]);
  const [recipesHasMore, setRecipesHasMore] = useState(true);
  const [recipesLoadingMore, setRecipesLoadingMore] = useState(false);

  const isFollowing = !!followingMap[username];

  const fetchProfile = useCallback(async () => {
    if (!username) {
      setError('No username provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${addressIp}/users/public/${username}`);
      const data = await res.json();
      if (data.result && data.user) {
        setProfile(data.user);
      } else {
        setError(data.error || 'Profile not found.');
      }
    } catch {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  }, [username, t]);

  // Paginated recipes feed (skip/limit). The /users/public route exposes
  // `recipes` inline but we use the dedicated endpoint to keep the lists
  // independently scrollable + cacheable.
  const fetchRecipes = useCallback(
    async ({ skip = 0, mode }) => {
      if (!username) return;
      try {
        // Hermes' URL polyfill is incomplete; build the query string by hand.
        const url = `${addressIp}/users/recipes/${encodeURIComponent(username)}?limit=${PAGE_LIMIT}&skip=${skip}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.result) return;
        const next = data.recipes || [];
        if (mode === 'append') {
          setRecipes((prev) => [...prev, ...next]);
        } else {
          setRecipes(next);
        }
        const more =
          typeof data.hasMore === 'boolean' ? data.hasMore : next.length >= PAGE_LIMIT;
        setRecipesHasMore(more);
      } catch {
        // Soft failure: keep whatever recipes we already had.
      }
    },
    [username],
  );

  useEffect(() => {
    fetchProfile();
    fetchRecipes({ skip: 0, mode: 'replace' });
  }, [fetchProfile, fetchRecipes]);

  const handleFollow = async () => {
    if (!currentUser?.token || !username || isSelf) return;
    const next = !isFollowing;
    dispatch(setFollowOptimistic({ username, value: next }));
    try {
      const path = next ? 'follow' : 'unfollow';
      const res = await fetch(`${addressIp}/users/${path}/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentUser.token }),
      });
      const data = await res.json();
      const ok = !!data.result;
      dispatch(commitFollow({ username, ok, value: next }));
      if (ok && profile) {
        // Reflect the latest counters from the server when present.
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followersCount:
                  typeof data.followersCount === 'number'
                    ? data.followersCount
                    : prev.followersCount,
                followingCount:
                  typeof data.followingCount === 'number'
                    ? data.followingCount
                    : prev.followingCount,
              }
            : prev,
        );
      }
    } catch {
      dispatch(commitFollow({ username, ok: false, value: next }));
      Alert.alert(t('common.error'), t('common.networkError'));
    }
  };

  const onEndReached = async () => {
    if (recipesLoadingMore || !recipesHasMore) return;
    setRecipesLoadingMore(true);
    await fetchRecipes({ skip: recipes.length, mode: 'append' });
    setRecipesLoadingMore(false);
  };

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => (r.title || '').toLowerCase().includes(q));
  }, [recipes, query]);

  if (loading) {
    return (
      <ProfileScreenContainer
        scroll={false}
        header={<PublicHeader navigation={navigation} title="@…" t={t} css={css} />}
      >
        <View style={[styles.centered, { padding: css.spacing.lg }]}>
          <ActivityIndicator size="large" color={css.palette.neutral900} />
        </View>
      </ProfileScreenContainer>
    );
  }

  if (error || !profile) {
    return (
      <ProfileScreenContainer
        scroll={false}
        header={
          <PublicHeader
            navigation={navigation}
            title={`@${username || ''}`}
            t={t}
            css={css}
          />
        }
      >
        <View style={[styles.centered, { padding: css.spacing.lg }]}>
          <Text
            style={{
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.bodySmSize,
              lineHeight: css.typography.bodySmLine,
              color: css.palette.neutral700,
              textAlign: 'center',
              marginBottom: css.spacing.md,
            }}
          >
            {error || t('common.error')}
          </Text>
          <TouchableOpacity
            onPress={fetchProfile}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
            style={[
              styles.retryBtn,
              {
                backgroundColor: css.palette.neutral900,
                borderRadius: css.radius.pill,
                paddingHorizontal: css.spacing.lg,
                paddingVertical: css.spacing.sm,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                color: css.palette.white,
                fontWeight: '600',
              }}
            >
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </ProfileScreenContainer>
    );
  }

  const region = profile.location?.region || (typeof profile.location === 'string' ? profile.location : '');
  const subtitle =
    profile.cuisineSpecialty || region
      ? `${profile.cuisineSpecialty || 'Home cook'}${region ? ` · ${region}` : ''}`
      : 'Cookez chef';

  // Stats: server may already expose enriched counters; fallback to
  // array lengths when they're missing.
  const followersCount =
    typeof profile.followersCount === 'number'
      ? profile.followersCount
      : profile.followers?.length || 0;
  const followingCount =
    typeof profile.followingCount === 'number'
      ? profile.followingCount
      : profile.following?.length || 0;

  const stats = [
    { value: recipes.length || profile.recipes?.length || 0, label: t('publicProfile.stats.recipes') },
    { value: followersCount, label: t('publicProfile.stats.followers') },
    { value: followingCount, label: t('publicProfile.stats.following') },
  ];

  return (
    <ProfileScreenContainer
      header={
        <PublicHeader
          navigation={navigation}
          title={t('publicProfile.title', { username: profile.username })}
          t={t}
          css={css}
        />
      }
    >
      <View
        style={[
          styles.identityWrap,
          {
            backgroundColor: css.palette.surfaceCard,
            paddingBottom: css.spacing.md,
          },
        ]}
      >
        <ProfileIdentityBlock
          user={profile}
          editable={false}
          centered
          subtitleOverride={subtitle}
          showChips={false}
        />
        {isSelf ? (
          <TouchableOpacity
            style={[
              styles.followBtn,
              {
                backgroundColor: css.palette.neutral900,
                borderRadius: css.radius.pill,
                marginTop: css.spacing.cardGap,
                paddingHorizontal: css.spacing.xl,
                paddingVertical: css.spacing.sm,
              },
            ]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel={t('publicProfile.editProfile')}
          >
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                color: css.palette.white,
                fontWeight: '600',
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
              }}
            >
              {t('publicProfile.editProfile')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.followBtn,
              {
                backgroundColor: isFollowing ? 'transparent' : css.palette.neutral900,
                borderRadius: css.radius.pill,
                marginTop: css.spacing.cardGap,
                paddingHorizontal: css.spacing.xl,
                paddingVertical: css.spacing.sm,
                borderWidth: isFollowing ? 1.5 : 0,
                borderColor: css.palette.neutral900,
              },
            ]}
            onPress={handleFollow}
            accessibilityRole="button"
            accessibilityState={{ selected: isFollowing }}
            accessibilityLabel={
              isFollowing ? t('publicProfile.unfollow') : t('publicProfile.follow')
            }
          >
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                color: isFollowing ? css.palette.neutral900 : css.palette.white,
                fontWeight: '600',
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
              }}
            >
              {isFollowing ? t('publicProfile.unfollow') : t('publicProfile.follow')}
            </Text>
          </TouchableOpacity>
        )}

        <Text
          style={[
            styles.bio,
            {
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.h6Size,
              lineHeight: css.typography.h6Line,
              color: css.palette.neutral700,
              marginTop: css.spacing.cardGap,
              paddingHorizontal: css.spacing.md,
            },
          ]}
          numberOfLines={3}
        >
          {profile.bio || t('publicProfile.bioFallback')}
        </Text>
      </View>

      <View
        style={[
          styles.badgesRow,
          {
            backgroundColor: css.palette.surfaceCard,
            paddingVertical: css.spacing.md,
            paddingHorizontal: css.spacing.cardGap,
            borderTopColor: css.palette.neutral200,
          },
        ]}
      >
        {BADGE_KEYS.map(({ key, Icon, labelKey }) => (
          <BadgeCircle
            key={key}
            icon={<Icon size={18} color={css.palette.neutral900} />}
            label={t(labelKey)}
          />
        ))}
      </View>

      <ProfileStatsRow stats={stats} />

      <View style={[styles.searchRow, { paddingHorizontal: css.spacing.md, paddingTop: css.spacing.md }]}>
        <View
          style={[
            styles.searchInputWrap,
            {
              backgroundColor: css.palette.surfaceCard,
              borderRadius: css.radius.pill,
              paddingHorizontal: css.spacing.cardGap,
              paddingVertical: css.spacing.sm,
              borderColor: css.palette.neutral200,
            },
          ]}
        >
          <Search size={14} color={css.palette.neutral500} />
          <TextInput
            style={[
              styles.searchInput,
              {
                marginLeft: css.spacing.sm,
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral900,
              },
            ]}
            placeholder={t('publicProfile.search')}
            placeholderTextColor={css.palette.neutral500}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel={t('publicProfile.search')}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert(t('common.comingSoon'))}
          style={[
            styles.filterBtn,
            { backgroundColor: css.palette.neutral900, borderRadius: css.radius.pill, marginLeft: css.spacing.sm },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('publicProfile.filters')}
        >
          <Filter size={16} color={css.palette.white} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.tagRow,
          { paddingHorizontal: css.spacing.md, paddingTop: css.spacing.cardGap, paddingBottom: css.spacing.xs },
        ]}
      >
        {TAGS.map((tag) => {
          const isActive = tag === activeTag;
          const label = isActive && tag !== '+ tag' ? `${tag} ×` : tag;
          return (
            <View
              key={tag}
              style={[styles.tagSpacer, { marginRight: css.spacing.sm, marginBottom: css.spacing.sm }]}
            >
              <PillChip
                active={isActive}
                onPress={() => setActiveTag(isActive ? null : tag)}
              >
                {label}
              </PillChip>
            </View>
          );
        })}
      </View>

      <View style={[styles.gridWrap, { paddingHorizontal: css.spacing.md, paddingTop: css.spacing.sm }]}>
        {filteredRecipes.length === 0 ? (
          <View style={[styles.gridEmpty, { paddingVertical: css.spacing.xl }]}>
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
              }}
            >
              {query ? t('publicProfile.emptyMatch') : t('publicProfile.empty')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            numColumns={gridColumns}
            key={`pub-grid-${gridColumns}`}
            keyExtractor={(item, idx) => item?._id || `pr-${idx}`}
            renderItem={({ item }) => <RecipeGridItem item={item} css={css} />}
            columnWrapperStyle={[styles.gridRow, { marginBottom: css.spacing.xs }]}
            scrollEnabled={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
          />
        )}
        {recipesLoadingMore ? (
          <View style={{ paddingVertical: css.spacing.md }}>
            <ActivityIndicator size="small" color={css.palette.neutral500} />
          </View>
        ) : null}
      </View>
    </ProfileScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerBtn: {
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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityWrap: {
    alignItems: 'center',
  },
  followBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: {
    textAlign: 'center',
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagSpacer: {},

  gridWrap: {},
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  gridItemImage: {
    width: '100%',
    height: 104,
  },
  gridItemPlaceholder: {
    width: '100%',
    height: 104,
  },
  gridEmpty: {
    alignItems: 'center',
  },
});
