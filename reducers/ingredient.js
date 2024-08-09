import { createSlice} from '@reduxjs/toolkit';

const initialState={
  ingredient: [],
};

export const ingredientSlice = createSlice({
  name: 'ingredient',
  initialState,
  reducers: {
    addIngredientToStore: (state, action) => {
      state.ingredient.push(action.payload);
    },
    removeIngredientToStore: (state, action) => {
      state.ingredient= state.ingredient.filter((e) => e.data.display_name !== action.payload.data.display_name);
    },
    removeAllIngredientToStore: (state, action) =>{
      state.ingredient=[];
    }
  },
});

export const { addIngredientToStore, removeIngredientToStore, removeAllIngredientToStore } = ingredientSlice.actions;
export default ingredientSlice.reducer;