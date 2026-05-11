// NotificationsScreen — chronological feed of in-app events.
//
// API contract (from plan 001 / Vague 2):
//   GET /notifications?limit=20&before=<isoDate>
//        Authorization: Bearer <token>
//        → { result, notifications: [...], unread }
//   PATCH /notifications/read
//        body { token, ids: [string] | 'all' }
//        → { result, unread }
//
// Behavior:
//   - Pull-to-refresh resets pagination (drops `before`).
//   - Infinite scroll fires when the last item enters the viewport.
//   - Tapping a notification navigates to the relevant target and
//     marks the row as read in a single round trip.
//   - The "mark all" header action sends 'all' to /read.
//
// Empty + error states are explicit; the FlatList is never silent.

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CheckCheck, ChevronLeft, ImageOff, Trash2 } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import { getAvatarSource } from '../modules/avatars';
import { navigateToProfile } from '../modules/profileNavigation';
import {
  appendNotifications,
  markAllRead,
  markRead,
  removeNotification,
  setNotifications,
  setUnread,
} from '../reducers/notifications';
import ProfileScreenContainer from '../components/profile/ProfileScreenContainer';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';

const PAGE_LIMIT = 20;

export default function NotificationsScreen({ navigation }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const { items, hasMore } = useSelector((state) => state.notifications.value);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(
    async ({ before, mode }) => {
      if (!user?.token) return;
      // Hermes' URL polyfill is incomplete; build the query string by hand.
      const params = [`limit=${PAGE_LIMIT}`];
      if (before) params.push(`before=${encodeURIComponent(before)}`);
      const url = `${addressIp}/notifications?${params.join('&')}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (!data.result) {
          setError(data.error || t('common.error'));
          return;
        }

        if (mode === 'append') {
          dispatch(
            appendNotifications({
              items: data.notifications || [],
              hasMore: (data.notifications || []).length >= PAGE_LIMIT,
            }),
          );
        } else {
          dispatch(
            setNotifications({
              items: data.notifications || [],
              unread: typeof data.unread === 'number' ? data.unread : undefined,
              hasMore: (data.notifications || []).length >= PAGE_LIMIT,
            }),
          );
        }
        setError(null);
      } catch {
        setError(t('common.networkError'));
      }
    },
    [user?.token, dispatch, t],
  );

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    if (!user?.token) return;
    setIsLoading(true);
    (async () => {
      await fetchPage({ mode: 'replace' });
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.token, fetchPage]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchPage({ mode: 'replace' });
    setIsRefreshing(false);
  };

  const onEndReached = async () => {
    if (isLoadingMore || !hasMore || items.length === 0) return;
    const oldest = items[items.length - 1]?.createdAt;
    if (!oldest) return;
    setIsLoadingMore(true);
    await fetchPage({ before: oldest, mode: 'append' });
    setIsLoadingMore(false);
  };

  const sendMarkRead = async (payload) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${addressIp}/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: user.token, ids: payload }),
      });
      const data = await res.json();
      if (data.result && typeof data.unread === 'number') {
        dispatch(setUnread(data.unread));
      }
    } catch {
      // Best-effort: optimistic redux update still stands.
    }
  };

  const handleMarkAll = async () => {
    dispatch(markAllRead());
    await sendMarkRead('all');
  };

  // Swipe-to-delete handler. Optimistic remove from Redux + DELETE request;
  // on failure we re-fetch the page so the row reappears (cheaper than
  // keeping a deep clone of the row around for a manual rollback).
  const handleDelete = async (notif) => {
    if (!notif?._id || !user?.token) return;
    dispatch(removeNotification(notif._id));
    try {
      const res = await fetch(`${addressIp}/notifications/${notif._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data?.result && typeof data.unread === 'number') {
        dispatch(setUnread(data.unread));
      } else if (!data?.result) {
        fetchPage({ mode: 'replace' });
      }
    } catch {
      fetchPage({ mode: 'replace' });
    }
  };

  // Right swipe action: a full-height red panel with a trash icon. Confirms
  // the delete on press rather than on full-swipe-release to avoid accidental
  // deletes while just exploring the gesture.
  const renderRightActions = (notif) => (
    <TouchableOpacity
      onPress={() => handleDelete(notif)}
      accessibilityRole="button"
      accessibilityLabel={t('notifications.deleteAction')}
      style={[
        styles.swipeAction,
        { backgroundColor: css.palette.error },
      ]}
    >
      <Trash2 size={22} color={css.palette.white} />
    </TouchableOpacity>
  );

  const handleTap = async (notif) => {
    if (!notif?._id) return;
    if (!notif.read) {
      dispatch(markRead([notif._id]));
      sendMarkRead([notif._id]);
    }
    if (notif.type === 'new_recipe' && notif.recipe) {
      navigation.navigate('Recipe', { recipe: notif.recipe });
      return;
    }
    if (notif.type === 'new_follower' && notif.actor?.username) {
      navigateToProfile(navigation, notif.actor.username, user?.username);
      return;
    }
    // Expiry warnings target the Inventory tab inside Profile. We deep-link
    // via the nested-navigator params shape so ProfileScreen can read
    // `route.params.initialTab` and switch its in-screen tab on mount.
    if (notif.type === 'expiry_warning') {
      navigation.navigate('TabNavigator', {
        screen: 'Profile',
        params: { initialTab: 'inventory' },
      });
    }
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
      friction={2}
    >
      <NotificationRow
        notif={item}
        onPress={() => handleTap(item)}
        css={css}
        t={t}
      />
    </Swipeable>
  );

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={css.palette.neutral900} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={{ color: css.palette.neutral700, marginBottom: css.spacing.md }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
            style={[
              styles.retryBtn,
              {
                backgroundColor: css.palette.neutral900,
                borderRadius: css.radius.pill,
              },
            ]}
          >
            <Text style={{ color: css.palette.white, fontWeight: '600' }}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.center,{ backgroundColor: css.palette.surface }]}>
        <Text style={{ color: css.palette.neutral500, textAlign: 'center' }}>
          {t('notifications.empty')}
        </Text>
      </View>
    );
  };

  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: css.spacing.md }}>
        <ActivityIndicator size="small" color={css.palette.neutral500} />
      </View>
    );
  };

  return (
    <ProfileScreenContainer
      scroll={false}
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
            style={styles.headerBtn}
          >
            <ChevronLeft size={22} color={css.palette.neutral900} />
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
            {t('notifications.title')}
          </Text>
          <TouchableOpacity
            onPress={handleMarkAll}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.markAllRead')}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <CheckCheck size={20} color={css.palette.neutral900} />
          </TouchableOpacity>
        </View>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(item, idx) => item?._id || `notif-${idx}`}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={css.palette.neutral500}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        contentContainerStyle={items.length === 0 ? styles.flexFill : null}
      />
    </ProfileScreenContainer>
  );
}

function NotificationRow({ notif, onPress, css, t }) {
  const username = notif.actor?.username || '';
  const recipeTitle = notif.recipe?.title || '';

  // Expiry warnings render an ingredient photo (Pexels) in the avatar
  // slot rather than the actor avatar — there is no actor for cron-issued
  // notifications. Pre-compute everything once so the JSX stays flat.
  const isExpiry = notif.type === 'expiry_warning';
  const photoUrl = isExpiry ? notif.ingredient?.photoUrl : null;
  const ingredientName =
    notif.ingredient?.name || t('notifications.expiryWarningFallbackName');
  const days =
    isExpiry && notif.expiryDate
      ? Math.max(0, Math.ceil((new Date(notif.expiryDate) - Date.now()) / 86400000))
      : 0;

  // Explicit if/else replaces the previous binary ternary that defaulted
  // to `newFollower` for any non-`new_recipe` type — that fallback would
  // wrongly label `expiry_warning` rows as follow events.
  let message;
  if (isExpiry) {
    message = t('notifications.expiryWarning', { ingredient: ingredientName, days });
  } else if (notif.type === 'new_recipe') {
    message = t('notifications.newRecipe', { username, title: recipeTitle });
  } else {
    message = t('notifications.newFollower', { username });
  }

  const recipeImage =
    typeof notif.recipe?.image === 'string' && notif.recipe.image.startsWith('http')
      ? { uri: notif.recipe.image }
      : null;
  const avatarSource = getAvatarSource(notif.actor?.image);
  const hasIngredientPhoto =
    typeof photoUrl === 'string' && photoUrl.startsWith('http');

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={message}
      style={[
        styles.row,
        {
          backgroundColor: notif.read ? css.palette.surfaceCard : css.palette.surface,
          borderBottomColor: css.palette.neutral200,
          paddingVertical: css.spacing.md,
          paddingHorizontal: css.spacing.md,
        },
      ]}
    >
      {isExpiry ? (
        hasIngredientPhoto ? (
          <Image
            source={{ uri: photoUrl }}
            style={[
              styles.avatar,
              { backgroundColor: css.palette.neutral200, borderRadius: 22 },
            ]}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: css.palette.neutral200,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <ImageOff size={20} color={css.palette.neutral500} />
          </View>
        )
      ) : (
        <Image
          source={avatarSource}
          style={[
            styles.avatar,
            {
              backgroundColor: css.palette.neutral200,
              borderRadius: 22,
            },
          ]}
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={styles.rowBody}>
        <Text
          style={{
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.bodySmSize,
            lineHeight: css.typography.bodySmLine,
            color: css.palette.neutral900,
            fontWeight: notif.read ? '400' : '600',
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
      {!isExpiry && recipeImage ? (
        <Image
          source={recipeImage}
          style={[
            styles.thumb,
            {
              backgroundColor: css.palette.neutral200,
              borderRadius: css.radius.sm,
            },
          ]}
          accessibilityIgnoresInvertColors
          accessibilityLabel={recipeTitle || 'Recipe'}
        />
      ) : null}
      {!notif.read ? (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: css.palette.primary500 },
          ]}
        />
      ) : null}
    </TouchableOpacity>
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    paddingRight: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    right: 12,
  },

  flexFill: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeAction: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
