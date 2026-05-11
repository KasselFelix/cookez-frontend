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
//
// Plan 002 / T2.3:
//   - 'activity' tab swapped for 'inventory' wired to the pantry slice.
//   - Inventory tab uses a FlatList layout so the screen header collapses
//     naturally as the user scrolls the item list. The other three tabs
//     keep the existing ScrollView container for a minimum diff.

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  Bell,
  Bookmark,
  Clock,
  LayoutGrid,
  Package,
  Settings as SettingsIcon,
  Share2,
  Star,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import { availableImages } from '../modules/avatars';
import {
  addPantryItem,
  getPantry,
  removePantryItem,
  updatePantryItem,
} from '../modules/pantryApi';
import {
  addItem,
  removeItem,
  setError,
  setLoading,
  setPantry,
  updateItem,
} from '../reducers/pantry';
import { updateUserInStore } from '../reducers/user';
import BadgeCircle from '../components/profile/BadgeCircle';
import ProfileIdentityBlock from '../components/profile/ProfileIdentityBlock';
import ProfileScreenContainer from '../components/profile/ProfileScreenContainer';
import ProfileStatsRow from '../components/profile/ProfileStatsRow';
import InventoryAddSheet from '../components/inventory/InventoryAddSheet';
import InventoryEmptyState from '../components/inventory/InventoryEmptyState';
import InventoryFilterChips from '../components/inventory/InventoryFilterChips';
import InventoryItemCard from '../components/inventory/InventoryItemCard';
import InventorySearchBar from '../components/inventory/InventorySearchBar';
import InventorySummaryRow from '../components/inventory/InventorySummaryRow';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';
import { useResponsive } from '../styles/responsive';

const TAB_KEYS = ['recipes', 'favorites', 'inventory', 'badges'];
const TAB_ICONS = {
  recipes: LayoutGrid,
  favorites: Bookmark,
  inventory: Package,
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
  const pantryItems = useSelector((s) => s.pantry.value.items);
  // eslint-disable-next-line no-unused-vars
  const pantryLoading = useSelector((s) => s.pantry.value.loading);
  const { gridColumns } = useResponsive();

  const [activeTab, setActiveTab] = useState('recipes');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [badges, setBadges] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Inventory tab state — kept here (rather than inside a child) because
  // we mount the bottom-sheet at the screen root so it survives tab swaps.
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [editing, setEditing] = useState(null);
  const addSheetRef = useRef(null);

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

  // Pantry fetch — runs once per token. The slice keeps its own loading
  // flag so other screens (Result, Recipe) can react to the boot state.
  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    (async () => {
      dispatch(setLoading(true));
      const { ok, data, error } = await getPantry(user.token);
      if (cancelled) return;
      if (ok) dispatch(setPantry(data?.items ?? []));
      else dispatch(setError(error));
      dispatch(setLoading(false));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.token, dispatch]);

  // Debounce the search input by 250 ms so the filter memo doesn't
  // rerun on every keystroke. The trim+lowercase is performed once here
  // rather than inside the filter so each item only does an .includes.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(id);
  }, [search]);

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

  // --- Inventory derived data ----------------------------------------------

  const filteredItems = useMemo(() => {
    return pantryItems.filter((it) => {
      if (categoryFilter && it.storageLocation !== categoryFilter) return false;
      if (
        debouncedSearch &&
        !it.ingredient?.name?.toLowerCase().includes(debouncedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [pantryItems, debouncedSearch, categoryFilter]);

  // Low-stock heuristic: an item is "low" when its remaining qty is at or
  // below 20% of the ingredient's reference quantity. The ref qty lives on
  // the Ingredient master doc, not the PantryItem, so we read through.
  const summary = useMemo(() => {
    let total = pantryItems.length;
    let expiringSoon = 0;
    let expired = 0;
    let lowStock = 0;
    for (const it of pantryItems) {
      const d = it.daysUntilExpiry;
      if (typeof d === 'number') {
        if (d < 0) expired += 1;
        else if (d <= 2) expiringSoon += 1;
      }
      const refQty = it.ingredient?.quantity;
      if (refQty && it.quantity > 0 && it.quantity <= refQty * 0.2) lowStock += 1;
    }
    return { total, expiringSoon, expired, lowStock };
  }, [pantryItems]);

  const categories = useMemo(
    () => [
      { key: 'fridge', label: t('profile.inventory.filters.fridge') },
      { key: 'freezer', label: t('profile.inventory.filters.freezer') },
      { key: 'pantry', label: t('profile.inventory.filters.pantry') },
      { key: 'spices', label: t('profile.inventory.filters.spices') },
      { key: 'other', label: t('profile.inventory.filters.other') },
    ],
    [t],
  );

  // --- Inventory handlers --------------------------------------------------

  const openAdd = () => {
    setEditing(null);
    addSheetRef.current?.expand();
  };

  const openEdit = (item) => {
    setEditing(item);
    addSheetRef.current?.expand();
  };

  // Optimistic remove for zero-latency feel; rollback on failure so the
  // UI never lies about server state. The previous record is captured
  // before dispatch so we can re-insert it identically on rollback.
  const handleDelete = async (id) => {
    const previous = pantryItems.find((p) => p._id === id);
    dispatch(removeItem(id));
    const { ok, error } = await removePantryItem(user.token, id);
    if (!ok) {
      if (previous) dispatch(addItem(previous));
      Alert.alert(t('profile.inventory.errors.delete_failed'), error || '');
    }
  };

  const handleSubmit = async (payload) => {
    addSheetRef.current?.close();
    if (editing) {
      const { _id } = editing;
      const { ok, data, error } = await updatePantryItem(user.token, _id, payload);
      if (ok && data?.item) dispatch(updateItem({ _id, patch: data.item }));
      else Alert.alert(t('profile.inventory.errors.update_failed'), error || '');
    } else {
      const { ok, data, error } = await addPantryItem(user.token, payload);
      if (ok && data?.item) dispatch(addItem(data.item));
      else Alert.alert(t('profile.inventory.errors.add_failed'), error || '');
    }
    setEditing(null);
  };

  // --- Render tab content (non-inventory paths only) -----------------------

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

  const recipeCount = user?.recipes?.length || 0;
  const favoriteCount = user?.favorites?.length || 0;
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

  // Early return must come AFTER hooks (hook ordering safety).
  if (!user || !user.token) {
    return null;
  }

  // ---- Shared header JSX (used by both branches) --------------------------

  const headerBar = (
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
        <TopBarButton label={t('profile.topBarShare')} onPress={handleShare} css={css}>
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
  );

  const identityBlock = (
    <ProfileIdentityBlock
      user={user}
      editable
      onAvatarPress={() => setAvatarModalVisible(true)}
      subtitleOverride={subtitleOverride}
    />
  );

  const statsRow = <ProfileStatsRow stats={stats} style={css} />;

  const tabBar = (
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
  );

  const avatarModal = (
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
  );

  const addSheet = (
    <InventoryAddSheet
      bottomSheetRef={addSheetRef}
      initial={editing}
      onSubmit={handleSubmit}
    />
  );

  // ---- Branch A: inventory tab → FlatList layout --------------------------

  if (activeTab === 'inventory') {
    return (
      <SafeAreaView
        style={[styles.flatContainer, { backgroundColor: css.palette.surfaceCard }]}
        edges={['top']}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <InventoryItemCard
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: css.spacing.sm }} />}
          ListHeaderComponent={
            <View>
              {headerBar}
              {identityBlock}
              {statsRow}
              {tabBar}
              <View style={{ paddingTop: css.spacing.md }}>
                <InventorySummaryRow summary={summary} />
                <View style={{ height: css.spacing.sm }} />
                <InventorySearchBar
                  value={search}
                  onChange={setSearch}
                  onFilterPress={() => {
                    // Filter sheet is a future hook; chips below already
                    // cover single-axis filtering. Tapping does nothing
                    // for now rather than throwing.
                  }}
                />
                <View style={{ height: css.spacing.xs }} />
                <InventoryFilterChips
                  active={categoryFilter}
                  onChange={setCategoryFilter}
                  categories={categories}
                />
              </View>
            </View>
          }
          ListEmptyComponent={<InventoryEmptyState onAdd={openAdd} />}
          contentContainerStyle={{ paddingBottom: css.spacing.xxl }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          windowSize={7}
          initialNumToRender={8}
        />
        {avatarModal}
        {addSheet}
      </SafeAreaView>
    );
  }

  // ---- Branch B: recipes / favorites / badges → original layout -----------

  return (
    <ProfileScreenContainer header={headerBar}>
      {identityBlock}

      {statsRow}

      {/* <ProfileImpactStats /> */}

      {tabBar}

      <View
        style={[
          styles.tabContent,
          { backgroundColor: css.palette.surface, paddingTop: css.spacing.md },
        ]}
      >
        {renderTabContent()}
      </View>

      {avatarModal}
      {addSheet}
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
  flatContainer: {
    flex: 1,
  },
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
