import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader, } from './views/base';

/** Global state of the app
 * Search object
 * Current list
 * Liked recipes
 */

const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
  // 1. Get query from view
  const query = searchView.getInput();

  // 2. New search
  if(query) {
    state.search = new Search(query);

    // 3. Prepare from UI
    searchView.clearInput();
    searchView.clearResult();
    renderLoader(elements.searchRes);

    try {
      // 4. Search from recipes
      await state.search.getResults();

      // 5. Render result
      clearLoader();
      searchView.renderResult(state.search.results);
      
    } catch (error) {
      console.log(error);
      clearLoader();
    }
  }

};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();

  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');

  if(btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResult();
    searchView.renderResult(state.search.results, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
  //Get id from url
  const id = window.location.hash.replace('#', '');

  if(id) {
    //Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    searchView.highlightSelected(id);

    //Create new recipe obj
    state.recipe = new Recipe(id);

    try {
      //Get recipe data
      await state.recipe.getResults();
      state.recipe.parseIngredients();

      //Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
      
    } catch (error) {
      console.log(error);
    }
  }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
  if(!state.list) state.list = new List();

  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);

    listView.renderItem(item);
  });
}

elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  if(e.target.matches('.shopping__delete, .shopping__delete *')) {
    state.list.deleteItem(id);

    listView.deleteItem(id);
  } else if(e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value);

    if(val > 0) state.list.updateCount(id, val);
  }
});

/**
 * LIKE CONTROLLER
 */
const controlLike = () => {
  if(!state.likes) state.likes = new Likes();

  const currentID = state.recipe.id;
  if(!state.likes.isLiked(currentID)) {
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    likesView.toggleLikeBtn(true);

    likesView.renderLike(newLike);
  } else {
    state.likes.deleteLike(currentID);

    likesView.toggleLikeBtn(false);

    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', () => {
  state.likes = new Likes();

  state.likes.readStorage();

  likesView.toggleLikeMenu(state.likes.getNumLikes());

  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//buttons click
elements.recipe.addEventListener('click', e => {
  if(e.target.matches('.btn-decrease, .btn-decrease *')) {
    if(state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }

  } else if(e.target.matches('.btn-increase, .btn-increase *')) {
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    controlList();
  } else if(e.target.matches('.recipe__love, .recipe__love *')) {
    controlLike();
  }
});