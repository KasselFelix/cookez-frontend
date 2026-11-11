import { createSelector, createSlice } from "@reduxjs/toolkit";

// One table of every recipe the app knows (`value`, looked up by _id by
// RecipeScreen, the comments and Favorites), plus the order of the two lists
// that show them: the Dashboard catalog (GET /recipes/all) and the last
// ResultScreen search (POST /recipes/result). Each list writes its own ids, so
// a search never empties or replaces the Dashboard (plan 017, point 1) and a
// recipe opened from the profile never joins the results (point 26).
const initialState = {
    value: [],
    catalogIds: [],
    resultIds: [],
};

const isObject = (value) => typeof value === 'object' && value !== null;

// /recipes/all and /recipes/search send ingredient rows with bare ids;
// /recipes/result and /recipes/detail populate them. A thinner copy must not
// undo a richer one already in the table.
const hasPopulatedIngredients = (recipe) =>
    Array.isArray(recipe?.ingredients) &&
    recipe.ingredients.length > 0 &&
    recipe.ingredients.every((row) => isObject(row?.ingredient));

function mergeRecipe(existing, incoming) {
    const merged = { ...existing, ...incoming };
    if (hasPopulatedIngredients(existing) && !hasPopulatedIngredients(incoming)) {
        merged.ingredients = existing.ingredients;
    }
    return merged;
}

// Merges each recipe into the table by _id and returns the ids in the given
// order, duplicates dropped. A recipe without _id cannot be listed.
function upsertRecipes(state, recipes) {
    const indexById = new Map(state.value.map((r, i) => [String(r?._id), i]));
    const ids = [];
    const seen = new Set();
    for (const recipe of Array.isArray(recipes) ? recipes : []) {
        if (!recipe?._id) continue;
        const id = String(recipe._id);
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        const index = indexById.get(id);
        if (index === undefined) {
            indexById.set(id, state.value.length);
            state.value.push(recipe);
        } else {
            state.value[index] = mergeRecipe(state.value[index], recipe);
        }
    }
    return ids;
}

export const recipeSlice = createSlice({
    name: 'recipe',
    initialState,
    reducers: {
        // Stores a recipe without listing it (a Dashboard search hit about to
        // be opened, so RecipeScreen finds its votes and comments).
        addRecipe: (state, action) => {
            upsertRecipes(state, [action.payload]);
        },
        // GET /recipes/all: the Dashboard catalog (App.js boot, Dashboard mount).
        setCatalogRecipes: (state, action) => {
            state.catalogIds = upsertRecipes(state, action.payload);
        },
        // POST /recipes/result, or its offline cache: the ResultScreen list.
        setResultRecipes: (state, action) => {
            state.resultIds = upsertRecipes(state, action.payload);
        },
        // Full recipe from GET /recipes/detail/:id (plan 017): merged over the
        // copy already in the table, or stored when the screen that opened it
        // never did (profile tiles, CommentScreen). Listed nowhere.
        setRecipeDetail: (state, action) => {
            upsertRecipes(state, [action.payload]);
        },
        removeRecipe: (state, action) => {
            const id = String(action.payload?._id);
            state.value = state.value.filter((e) => String(e._id) !== id);
            state.catalogIds = state.catalogIds.filter((e) => e !== id);
            state.resultIds = state.resultIds.filter((e) => e !== id);
        },
        clearRecipes: () => initialState,
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
    setCatalogRecipes,
    setResultRecipes,
    setRecipeDetail,
    removeRecipe,
    clearRecipes,
    updateRecipeVote,
    addCommentToRecipe,
    updateCommentVotes,
    deleteComment,
    updateCommentMessage,
} = recipeSlice.actions;

// Each list resolved against the table. Memoized: the same arrays come back
// until the table or the list changes, so screens do not re-render for nothing.
const selectTable = (state) => state.recipe.value;
const pickByIds = (table, ids) => {
    const byId = new Map(table.map((r) => [String(r?._id), r]));
    return (ids ?? []).map((id) => byId.get(id)).filter(Boolean);
};

export const selectCatalogRecipes = createSelector(
    [selectTable, (state) => state.recipe.catalogIds],
    pickByIds
);

export const selectResultRecipes = createSelector(
    [selectTable, (state) => state.recipe.resultIds],
    pickByIds
);

export default recipeSlice.reducer;
