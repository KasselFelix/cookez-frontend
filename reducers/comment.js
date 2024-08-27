import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    comment: [],
};

export const commentSlice = createSlice({
    name: 'comment',

    initialState,
    reducers: {
        addCommentToStore: (state, action) => {
            state.comment = action.payload;
        },
        removeCommentToStore: (state, action) => {
            state.comment = state.comment.filter((e) => e.comment !== action.payload.comment )
        },
    },
});

export const { addCommentToStore, removeCommentToStore } = commentSlice.actions;
export default commentSlice.reducer;