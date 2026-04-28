import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    value: [],
};

export const recipeSlice = createSlice({
    name: 'recipe',
    initialState,
    reducers: {
        addRecipe: (state, action) => {
            // Skip if a recipe with this _id is already in the slice — prevents
            // duplicate-key React errors when the same payload is dispatched twice
            // (e.g. fast double-tap on Add Recipe).
            const incoming = action.payload;
            if (!incoming?._id) {
                state.value.push(incoming);
                return;
            }
            const exists = state.value.some((r) => r._id === incoming._id);
            if (!exists) state.value.push(incoming);
        },
        setRecipes: (state, action) => {
            // Defensive dedup on hydration — guarantees no two recipes with the
            // same _id even if the server payload contains duplicates from a
            // join or aggregation quirk.
            const incoming = Array.isArray(action.payload) ? action.payload : [];
            const seen = new Set();
            state.value = incoming.filter((r) => {
                if (!r?._id) return true;
                const id = String(r._id);
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        },
        removeRecipe: (state, action) => {
            state.value = state.value.filter((e) => e._id !== action.payload._id);
        },
        clearRecipes: (state) => {
            state.value = [];
        },
        // updateRecipeVote: (state, action) => {
        //     const recipe = state.value.find((r) => r._id === action.payload._id);
        //     if (recipe) {
        //         recipe.votes = action.payload.votes;
        //     }
        // },
        updateRecipeVote: (state, action) => {
            state.value = state.value.map((r) => {
                if (r._id === action.payload._id) {
                    // On retourne une COPIE de la recette avec les nouveaux votes
                    return { ...r, votes: action.payload.votes };
                }
                return r;
            });
        },
        addCommentToRecipe: (state, action) => {
            const { recipeId, comment } = action.payload;
            // Defensive empty-array init — guarantees no undefined errors in UI
            const safeComment = {
                ...comment,
                up: comment.up ?? [],
                down: comment.down ?? [],
                usersAlreadyUpVoted: comment.usersAlreadyUpVoted ?? [],
                usersAlreadyDownVoted: comment.usersAlreadyDownVoted ?? [],
            };
            state.value = state.value.map((r) => {
                if (r._id !== recipeId) return r;
                // Dedup by _id: if a comment with this _id already exists, skip the push.
                // Prevents duplicate-key React errors when the same payload is dispatched twice
                // (e.g. fast double-tap on Post, or stale composer state across navigation).
                const existing = (r.comments || []).some(
                    (c) => c._id && safeComment._id && c._id === safeComment._id
                );
                if (existing) return r;
                return { ...r, comments: [...(r.comments || []), safeComment] };
            });
        },
        updateCommentVotes: (state, action) => {
            const {
                recipeId,
                commentId,
                up,
                down,
                usersAlreadyUpVoted,
                usersAlreadyDownVoted,
            } = action.payload;

            state.value = state.value.map((recipe) => {
                if (recipe._id !== recipeId) return recipe;
                const updatedComments = (recipe.comments || []).map((comment) => {
                    if (comment._id !== commentId) return comment;
                    return {
                        ...comment,
                        up: up ?? [],
                        down: down ?? [],
                        usersAlreadyUpVoted: usersAlreadyUpVoted ?? [],
                        usersAlreadyDownVoted: usersAlreadyDownVoted ?? [],
                    };
                });
                return { ...recipe, comments: updatedComments };
            });
        },
        // Removes a comment by _id. recipeId is optional — when missing, scans
        // every recipe (the comment may have been hydrated from
        // GET /comments/:username, which doesn't carry the parent recipe's full
        // payload through the slice).
        deleteComment: (state, action) => {
            const { recipeId, commentId } = action.payload;
            if (!commentId) return;
            state.value = state.value.map((r) => {
                if (recipeId && r._id !== recipeId) return r;
                const filtered = (r.comments || []).filter((c) => c._id !== commentId);
                if (filtered.length === (r.comments || []).length) return r;
                return { ...r, comments: filtered };
            });
        },
        // Updates only the `message` field of a single comment, immutably.
        // recipeId optional — same scan-all fallback as deleteComment.
        updateCommentMessage: (state, action) => {
            const { recipeId, commentId, message } = action.payload;
            if (!commentId) return;
            state.value = state.value.map((r) => {
                if (recipeId && r._id !== recipeId) return r;
                const comments = r.comments || [];
                let touched = false;
                const updated = comments.map((c) => {
                    if (c._id !== commentId) return c;
                    touched = true;
                    return { ...c, message };
                });
                if (!touched) return r;
                return { ...r, comments: updated };
            });
        },
    }
});

export const {
    addRecipe,
    setRecipes,
    removeRecipe,
    clearRecipes,
    updateRecipeVote,
    addCommentToRecipe,
    updateCommentVotes,
    deleteComment,
    updateCommentMessage,
} = recipeSlice.actions;
export default recipeSlice.reducer;
