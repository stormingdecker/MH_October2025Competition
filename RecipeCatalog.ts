export const ProgTaskType = {
  Destination: "Destination",
  TapToProgress: "TapToProgress",
  DragToProgress: "DragToProgress",
  Timed: "Timed",
  StopBurning: "StopBurning",
};

export const RecipeType = {
  applePie: "applePie",
  bananaPie: "bananaPie",
  cherryPie: "cherryPie",
  lemonPie: "lemonPie",
  orangePie: "orangePie",
  peachPie: "peachPie",
  pearPie: "pearPie",
  pineapplePie: "pineapplePie",
  pumpkinPie: "pumpkinPie",
  strawberryPie: "strawberryPie",
  fishPie: "fishPie",
  mushroomPie: "mushroomPie",
};

export const RecipeCatalog = {
  [RecipeType.applePie]: {
    recipeType: RecipeType.applePie,
    name: "Apple Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Apple Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Apple Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.bananaPie]: {
    recipeType: RecipeType.bananaPie,
    name: "Banana Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Banana Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Banana Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.cherryPie]: {
    recipeType: RecipeType.cherryPie,
    name: "Cherry Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Cherry Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Cherry Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.lemonPie]: {
    recipeType: RecipeType.lemonPie,
    name: "Lemon Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Lemon Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Lemon Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.orangePie]: {
    recipeType: RecipeType.orangePie,
    name: "Orange Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Orange Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Orange Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.peachPie]: {
    recipeType: RecipeType.peachPie,
    name: "Peach Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Peach Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Peach Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.pearPie]: {
    recipeType: RecipeType.pearPie,
    name: "Pear Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Pear Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Pear Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.pineapplePie]: {
    recipeType: RecipeType.pineapplePie,
    name: "Pineapple Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Pineapple Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Pineapple Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.pumpkinPie]: {
    recipeType: RecipeType.pumpkinPie,
    name: "Pumpkin Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Pumpkin Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Pumpkin Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.strawberryPie]: {
    recipeType: RecipeType.strawberryPie,
    name: "Strawberry Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Strawberry Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Strawberry Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.fishPie]: {
    recipeType: RecipeType.fishPie,
    name: "Fish Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Fish Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Fish Pie",
        description: "Drag in a circle",
      },
    ],
  },
  [RecipeType.mushroomPie]: {
    recipeType: RecipeType.mushroomPie,
    name: "Mushroom Pie",
    steps: [
      {
        taskType: ProgTaskType.Destination,
        header: "Mushroom Pie",
        description: "Go to kitchen",
      },
      {
        taskType: ProgTaskType.DragToProgress,
        header: "Mushroom Pie",
        description: "Drag in a circle",
      },
    ],
  },
  //region burger --- IGNORE ---
  // [RecipeType.BurgerBasic]: {
  //   recipeType: RecipeType.BurgerBasic,
  //   name: "Basic Burger",
  //   steps: [
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Burger",
  //       description: "Go to kitchen",
  //     },
  //     {
  //       taskType: ProgTaskType.DragToProgress,
  //       header: "Basic Burger",
  //       description: "Drag in a circle",
  //     },
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Burger",
  //       description: "Go to oven",
  //     },
  //     {
  //       taskType: ProgTaskType.Timed,
  //       header: "Basic Burger",
  //       description: "Wait 5 seconds",
  //     },
  //     {
  //       taskType: ProgTaskType.StopBurning,
  //       header: "Basic Burger",
  //       description: "Remove from oven",
  //     },
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Burger",
  //       description: "Go to kitchen",
  //     },
  //     {
  //       taskType: ProgTaskType.TapToProgress,
  //       header: "Basic Burger",
  //       description: "Tap to chop",
  //     },
  //   ],
  // },
  // [RecipeType.HotDogBasic]: {
  //   recipeType: RecipeType.HotDogBasic,
  //   name: "Basic Hot Dog",
  //   steps: [
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Hot Dog",
  //       description: "Go to kitchen",
  //     },
  //     {
  //       taskType: ProgTaskType.TapToProgress,
  //       header: "Basic Hot Dog",
  //       description: "Tap to chop",
  //     },
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Hot Dog",
  //       description: "Go to oven",
  //     },
  //     {
  //       taskType: ProgTaskType.Timed,
  //       header: "Basic Hot Dog",
  //       description: "Boil for 5 seconds",
  //     },
  //     {
  //       taskType: ProgTaskType.Destination,
  //       header: "Basic Burger",
  //       description: "Go to kitchen",
  //     },
  //     {
  //       taskType: ProgTaskType.DragToProgress,
  //       header: "Basic Hot Dog",
  //       description: "Drag back and forth",
  //     },
  //   ],
  // },
};
