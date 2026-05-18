import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import addressIp from '../../modules/addressIp';
import { updateCommentVotes } from '../../reducers/recipe';
import { useAuthGate } from '../../contexts/AuthGateProvider';
import css from '../../styles/Global';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * CommentCard
 * Presentational social bubble — derives all vote state from props (Redux is the
 * source of truth). Owns ONE piece of local UI state (the auth-popover trigger).
 *
 * Props (shape from API/Redux comment object):
 *  _id, username, message, date, up[], down[], usersAlreadyUpVoted[], usersAlreadyDownVoted[]
 */
export default function CommentCard({
  _id,
  recipeId,
  username,
  message,
  date,
  up = [],
  down = [],
  usersAlreadyUpVoted = [],
  usersAlreadyDownVoted = [],
}) {
  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const { requireAuth } = useAuthGate();

  // Derived vote state — pure projection of props
  const alreadyUp = useMemo(
    () => usersAlreadyUpVoted.includes(user.username),
    [usersAlreadyUpVoted, user.username]
  );
  const alreadyDown = useMemo(
    () => usersAlreadyDownVoted.includes(user.username),
    [usersAlreadyDownVoted, user.username]
  );
  const score = (up?.length ?? 0) - (down?.length ?? 0);

  const relativeDate = useMemo(() => {
    if (!date) return '';
    try {
      return moment(date).fromNow();
    } catch {
      return '';
    }
  }, [date]);

  const initial = (username || '?').charAt(0).toUpperCase();

  // Spring scale on vote press
  const upScale = useSharedValue(1);
  const downScale = useSharedValue(1);
  const upStyle = useAnimatedStyle(() => ({ transform: [{ scale: upScale.value }] }));
  const downStyle = useAnimatedStyle(() => ({ transform: [{ scale: downScale.value }] }));

  const animatePress = (sv) => {
    sv.value = withSpring(0.9, css.animation.spring, () => {
      sv.value = withSpring(1, css.animation.spring);
    });
  };

  const syncVoteToRedux = (data) => {
    if (!recipeId || !data?.comment) return;
    dispatch(
      updateCommentVotes({
        recipeId,
        commentId: _id,
        up: data.comment.up,
        down: data.comment.down,
        usersAlreadyUpVoted: data.comment.usersAlreadyUpVoted,
        usersAlreadyDownVoted: data.comment.usersAlreadyDownVoted,
      })
    );
  };

  const handleUp = async () => {
    if (!requireAuth('comment_vote')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    animatePress(upScale);
    try {
      const res = await fetch(`${addressIp}/comments/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, _id }),
      });
      const data = await res.json();
      if (data.result === true) syncVoteToRedux(data);
    } catch (err) {
      console.error('Upvote failed', err);
    }
  };

  const handleDown = async () => {
    if (!requireAuth('comment_vote')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    animatePress(downScale);
    try {
      const res = await fetch(`${addressIp}/comments/downvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, _id }),
      });
      const data = await res.json();
      if (data.result === true) syncVoteToRedux(data);
    } catch (err) {
      console.error('Downvote failed', err);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username} numberOfLines={1}>
            @{username}
          </Text>
          <Text style={styles.date}>{relativeDate}</Text>
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.voteRow}>
        <AnimatedTouchable
          style={[styles.votePill, alreadyUp && styles.votePillActiveUp, upStyle]}
          onPress={handleUp}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Upvote comment, ${up?.length ?? 0} upvotes`}
          accessibilityState={{ selected: alreadyUp }}
        >
          <FontAwesome
            name="thumbs-up"
            size={14}
            color={alreadyUp ? css.palette.success : css.palette.neutral500}
          />
          <Text
            style={[
              styles.votePillText,
              alreadyUp && styles.votePillTextActiveUp,
            ]}
          >
            {up?.length ?? 0}
          </Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[styles.votePill, alreadyDown && styles.votePillActiveDown, downStyle]}
          onPress={handleDown}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Downvote comment, ${down?.length ?? 0} downvotes`}
          accessibilityState={{ selected: alreadyDown }}
        >
          <FontAwesome
            name="thumbs-down"
            size={14}
            color={alreadyDown ? css.palette.error : css.palette.neutral500}
          />
          <Text
            style={[
              styles.votePillText,
              alreadyDown && styles.votePillTextActiveDown,
            ]}
          >
            {down?.length ?? 0}
          </Text>
        </AnimatedTouchable>

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>
            {score >= 0 ? `+${score}` : score}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.lg,
    padding: css.spacing.md,
    marginBottom: css.spacing.sm,
    ...css.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: css.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.primary800,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: css.spacing.sm,
  },
  avatarText: {
    color: css.palette.white,
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h5Size,
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h5Size,
    color: css.palette.neutral900,
  },
  date: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.captionSize,
    color: css.palette.neutral500,
  },
  message: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    lineHeight: css.typography.bodyLine,
    color: css.palette.neutral900,
    marginBottom: css.spacing.sm,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: css.spacing.sm,
  },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: css.spacing.xs,
    paddingVertical: css.spacing.xs,
    paddingHorizontal: css.spacing.sm,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.neutral100,
    minHeight: 32,
    minWidth: 56,
    justifyContent: 'center',
  },
  votePillActiveUp: {
    backgroundColor: css.palette.successBg,
  },
  votePillActiveDown: {
    backgroundColor: css.palette.errorBg,
  },
  votePillText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.captionSize,
    color: css.palette.neutral700,
  },
  votePillTextActiveUp: {
    color: css.palette.success,
  },
  votePillTextActiveDown: {
    color: css.palette.error,
  },
  scorePill: {
    marginLeft: 'auto',
    paddingVertical: css.spacing.xs,
    paddingHorizontal: css.spacing.sm,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.secondary200,
  },
  scoreText: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.captionSize,
    color: css.palette.primary800,
  },
});
