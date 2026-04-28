import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import addressIp from '../../modules/addressIp';
import { addCommentToRecipe } from '../../reducers/recipe';
import css from '../../styles/Global';

const MAX_LENGTH = 250;

/**
 * CommentComposer
 * BottomSheet content — input + char count + submit. On success dispatches
 * `addCommentToRecipe` with the populated comment shape from the backend.
 *
 * @param {string} recipeId
 * @param {() => void} onClose
 */
export default function CommentComposer({ recipeId, onClose }) {
  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!user.token) {
      setError('You must be signed in to comment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${addressIp}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: user.token,
          message: trimmed,
          recipe: recipeId,
        }),
      });
      const data = await response.json();
      if (data.result && data.comment) {
        dispatch(addCommentToRecipe({ recipeId, comment: data.comment }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {}
        );
        setMessage('');
        onClose?.();
      } else {
        setError(data.error || 'Failed to post comment.');
      }
    } catch (err) {
      console.error('Add comment failed', err);
      setError('Network error — please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheetView style={styles.container}>
      <Text style={styles.title}>Add a comment</Text>

      <BottomSheetTextInput
        style={styles.input}
        placeholder="Share your thoughts on this recipe..."
        placeholderTextColor={css.palette.neutral500}
        value={message}
        onChangeText={(text) => {
          if (text.length <= MAX_LENGTH) setMessage(text);
        }}
        multiline
        maxLength={MAX_LENGTH}
        accessibilityLabel="Comment text input"
        editable={!submitting}
      />

      <View style={styles.metaRow}>
        <Text style={styles.charCount}>
          {message.length}/{MAX_LENGTH}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel comment"
          activeOpacity={0.7}
          disabled={submitting}
        >
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            !canSubmit && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          accessibilityState={{ disabled: !canSubmit }}
          activeOpacity={0.7}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={css.palette.white} />
          ) : (
            <Text style={styles.buttonPrimaryText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: css.spacing.lg,
    paddingTop: css.spacing.sm,
    paddingBottom: css.spacing.xl,
  },
  title: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
    marginBottom: css.spacing.md,
  },
  input: {
    minHeight: 120,
    backgroundColor: css.input.bg,
    borderColor: css.input.borderColor,
    borderWidth: css.input.borderWidth,
    borderRadius: css.input.borderRadius,
    paddingVertical: css.input.paddingV,
    paddingHorizontal: css.input.paddingH,
    fontSize: css.input.fontSize,
    fontFamily: css.input.fontFamily,
    color: css.input.textColor,
    textAlignVertical: 'top',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: css.spacing.xs,
    marginBottom: css.spacing.md,
  },
  charCount: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.captionSize,
    color: css.palette.neutral500,
  },
  error: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.captionSize,
    color: css.palette.error,
    flexShrink: 1,
    marginLeft: css.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: css.spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 44,
    paddingVertical: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    borderRadius: css.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: css.palette.primary800,
  },
  buttonPrimaryText: {
    color: css.palette.white,
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: css.palette.neutral100,
  },
  buttonSecondaryText: {
    color: css.palette.neutral700,
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
  },
  buttonDisabled: {
    backgroundColor: css.palette.neutral200,
  },
});
