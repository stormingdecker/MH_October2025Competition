export const ProgTaskType = {
  Destination: "Destination",
  TapToProgress: "TapToProgress",
  DragToProgress: "DragToProgress",
  Timed: "Timed",
  StopBurning: "StopBurning",
};

export const RecipeType = {
  EmptyRecipe: "empty_recipe",
  BurgerBasic: "burger_basic",
  HotDogBasic: "hotdog_basic",
};

export const RecipeCatalog = {
  [RecipeType.EmptyRecipe]: {
    recipeType: RecipeType.EmptyRecipe,
    name: "Empty Recipe",
    steps: [],
  },
  //region burger
  [RecipeType.BurgerBasic]: {
    recipeType: RecipeType.BurgerBasic,
    name: "Basic Burger",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Burger",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Basic Burger",
        description: "Drag in a circles",
      },
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Burger",
        description: "Go to oven",
      },
      {
        taskType: ProgTaskType.Timed,
        header: "Basic Burger",
        description: "Wait 5 seconds",
      },
      // {
      //   taskType: ProgTaskType.StopBurning,
      //   header: "Basic Burger",
      //   description: "Remove from oven",
      // },
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Burger",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.TapToProgress,
        header: "Basic Burger",
        description: "Tap to chop",
      },
    ],
  },
  //region hotdog
  [RecipeType.HotDogBasic]: {
    recipeType: RecipeType.HotDogBasic,
    name: "Basic Hot Dog",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Hot Dog",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.TapToProgress,
        header: "Basic Hot Dog",
        description: "Tap to chop",
      },
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Hot Dog",
        description: "Go to oven",
      },
      {
        taskType: ProgTaskType.Timed,
        header: "Basic Hot Dog",
        description: "Boil for 5 seconds",
      },
      {
        taskType: ProgTaskType.Destination,
        header: "Basic Burger",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Basic Hot Dog",
        description: "Drag back and forth",
      },
    ],
  },
};
