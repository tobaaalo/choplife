import type { StarterRecipe } from './types'
export const PART_1: Record<string, StarterRecipe> = {
  'bread-and-egg': {
    ingredients: [
      ['Bread slices', 3, '', 'bakery'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Tomato', 0.5, '', 'veg_fruit'],
      ['Vegetable oil', 1, 'tbsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
      ['Black pepper', 1, 'pinch', 'pantry'],
      ['Butter', 1, 'tsp', 'dairy_eggs'],
    ],
    steps:
      '1. Ask an adult to help with the knife and the hot pan.\n2. Chop the onion and tomato into very small pieces.\n3. Crack the eggs into a bowl. Add the onion, tomato, salt and pepper. Beat with a fork until mixed.\n4. Heat the oil in a frying pan on medium heat for 1 minute.\n5. Pour in the egg mix. Let it cook for 2 minutes, then flip it over and cook 1 more minute. It should be golden and firm.\n6. Spread a little butter on the bread. Serve the egg on the side or inside the bread.',
  },
  'bread-and-suya': {
    ingredients: [
      ['Bread slices', 3, '', 'bakery'],
      ['Beef steak, thinly sliced', 150, 'g', 'protein'],
      ['Suya spice (yaji)', 1, 'tbsp', 'pantry'],
      ['Groundnut (peanut) oil', 1, 'tbsp', 'pantry'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife and the hot grill or pan.\n2. Cut the beef into thin strips. Put it in a bowl.\n3. Add the suya spice, oil, crushed stock cube and salt. Rub it in well. Leave it for 10 minutes.\n4. Slice the onion and tomato.\n5. Heat a dry frying pan or grill on high heat. Cook the beef for 4 to 5 minutes on each side. It should be brown with no pink inside.\n6. Sprinkle a little more suya spice on top.\n7. Serve the suya with the bread, onion and tomato.',
  },
  'tea-egg-and-bread': {
    ingredients: [
      ['Bread slices', 3, '', 'bakery'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Tea bag', 1, '', 'pantry'],
      ['Milk', 50, 'ml', 'dairy_eggs'],
      ['Sugar', 1, 'tsp', 'pantry'],
      ['Vegetable oil', 1, 'tbsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
      ['Butter', 1, 'tsp', 'dairy_eggs'],
    ],
    steps:
      '1. Ask an adult to help with boiling water and the hot pan.\n2. Boil water in a kettle. Put the tea bag in a cup and pour in the hot water. Wait 3 minutes.\n3. Take the tea bag out. Add the milk and sugar and stir.\n4. Beat the eggs with the salt in a bowl.\n5. Heat the oil in a pan. Pour in the eggs and stir gently for 2 minutes until soft and set.\n6. Spread butter on the bread.\n7. Serve the eggs with the bread and the tea.',
  },
  'toast-with-egg-sausage-and-tea': {
    ingredients: [
      ['Bread slices', 2, '', 'bakery'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Pork sausages', 2, '', 'protein'],
      ['Butter', 1, 'tsp', 'dairy_eggs'],
      ['Vegetable oil', 1, 'tsp', 'pantry'],
      ['Tea bag', 1, '', 'pantry'],
      ['Milk', 50, 'ml', 'dairy_eggs'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the hot pan and boiling water.\n2. Heat the oil in a frying pan on medium heat. Add the sausages.\n3. Cook the sausages for 10 to 12 minutes, turning them often. They should be brown all over with no pink inside.\n4. Push the sausages to the side. Crack in the eggs and cook for 3 minutes until the white is firm.\n5. Toast the bread until golden, then spread on the butter.\n6. Make the tea. Pour hot water on the tea bag, wait 3 minutes, take it out and add the milk.\n7. Put the toast, eggs and sausages on a plate with a little salt.',
  },
  'cereal-and-fruit': {
    ingredients: [
      ['Breakfast cereal', 40, 'g', 'grains'],
      ['Milk', 150, 'ml', 'dairy_eggs'],
      ['Banana', 1, '', 'veg_fruit'],
      ['Apple', 0.5, '', 'veg_fruit'],
      ['Honey', 1, 'tsp', 'pantry'],
      ['Sultanas', 1, 'tbsp', 'pantry'],
    ],
    steps:
      '1. Wash your hands and the fruit.\n2. Peel the banana and cut it into round slices.\n3. Ask an adult to help cut the apple into small pieces.\n4. Pour the cereal into a bowl.\n5. Pour the cold milk over the cereal.\n6. Put the fruit and sultanas on top and add a little honey. Eat right away so the cereal stays crunchy.',
  },
  'oatmeal-and-boiled-eggs': {
    ingredients: [
      ['Rolled oats', 50, 'g', 'grains'],
      ['Water', 250, 'ml', 'other'],
      ['Milk', 100, 'ml', 'dairy_eggs'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Sugar or honey', 1, 'tsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the boiling water.\n2. Put the eggs in a small pot and cover them with cold water. Bring to the boil, then cook for 9 minutes.\n3. Put the eggs in cold water for 2 minutes, then peel off the shells.\n4. In another pot, put the oats, the water and a pinch of salt.\n5. Cook on medium heat for 5 minutes, stirring often. It should be thick and soft.\n6. Stir in the milk and sugar or honey. Cook 1 more minute.\n7. Serve the oatmeal in a bowl with the boiled eggs on the side.',
  },
  'oats-with-plantain-and-egg-sauce': {
    ingredients: [
      ['Rolled oats', 50, 'g', 'grains'],
      ['Ripe plantain', 1, '', 'tubers'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 2, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Cook the oats in 250 ml of water with a pinch of salt for 5 minutes, stirring. It should be thick and soft. Set aside.\n3. Peel the plantain and cut it into slices. Fry in 1 tablespoon of hot oil for 2 minutes on each side until golden. Put on a plate.\n4. Chop the tomato, onion and pepper.\n5. Heat 1 tablespoon of oil. Fry the onion for 2 minutes, then add the tomato, pepper and crushed stock cube. Cook for 5 minutes until soft.\n6. Beat the eggs and pour them into the sauce. Stir for 2 minutes until set.\n7. Serve the oats with the plantain and egg sauce.',
  },
  pancakes: {
    ingredients: [
      ['Plain flour', 60, 'g', 'grains'],
      ['Egg', 1, '', 'dairy_eggs'],
      ['Milk', 100, 'ml', 'dairy_eggs'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Baking powder', 0.5, 'tsp', 'pantry'],
      ['Butter, melted', 1, 'tbsp', 'dairy_eggs'],
      ['Vegetable oil', 1, 'tsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the hot pan.\n2. Put the flour, sugar, baking powder and salt in a bowl and mix.\n3. Make a hole in the middle. Add the egg, milk and melted butter.\n4. Whisk until smooth with no lumps. Leave it for 5 minutes.\n5. Heat a non-stick pan on medium heat with a few drops of oil.\n6. Pour in a small ladle of batter. Cook for 2 minutes until bubbles show on top.\n7. Flip it and cook for 1 more minute until golden.\n8. Repeat with the rest of the batter. Stack and serve warm.',
  },
  'pap-with-moi-moi': {
    ingredients: [
      ['Pap (ogi) paste', 60, 'g', 'grains'],
      ['Water', 300, 'ml', 'other'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Milk', 50, 'ml', 'dairy_eggs'],
      ['Black-eyed beans for moi moi', 60, 'g', 'beans'],
      ['Egg', 1, '', 'dairy_eggs'],
      ['Palm oil', 1, 'tbsp', 'pantry'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with boiling water and the blender.\n2. Soak the beans in water for 15 minutes, rub off the skins and rinse.\n3. Blend the beans with the onion and a little water until smooth. Stir in the palm oil, salt and egg.\n4. Pour into a heatproof pot or foil cup, cover, and steam for 40 minutes until firm.\n5. For the pap, mix the pap paste with 100 ml of cold water until smooth.\n6. Pour in 200 ml of boiling water and stir fast for 1 minute. It should thicken and turn smooth and glossy.\n7. Add the sugar and milk. Serve hot with a slice of moi moi.',
  },
  'pap-and-akara': {
    ingredients: [
      ['Pap (ogi) paste', 60, 'g', 'grains'],
      ['Water', 300, 'ml', 'other'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Milk', 50, 'ml', 'dairy_eggs'],
      ['Black-eyed beans', 80, 'g', 'beans'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil for frying', 200, 'ml', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the blender, hot oil and boiling water.\n2. Soak the beans for 15 minutes. Rub them to take off the skins and rinse until the water is clear.\n3. Blend the beans with the onion, pepper and a very small amount of water. It should be thick and fluffy. Add the salt and whip it with a spoon for 2 minutes.\n4. Heat the oil in a deep pan until a drop of batter sizzles.\n5. Spoon the batter into the oil. Fry for 3 to 4 minutes, turning once, until deep golden brown. Drain on paper.\n6. For the pap, mix the paste with 100 ml of cold water. Pour in 200 ml of boiling water and stir fast until thick and smooth.\n7. Add the sugar and milk. Serve with the akara.',
  },
  'custard-and-akara': {
    ingredients: [
      ['Custard powder', 3, 'tbsp', 'pantry'],
      ['Milk', 150, 'ml', 'dairy_eggs'],
      ['Water', 150, 'ml', 'other'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Black-eyed beans', 80, 'g', 'beans'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil for frying', 200, 'ml', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the blender, hot oil and boiling water.\n2. Soak the beans for 15 minutes. Rub off the skins and rinse well.\n3. Blend the beans with the onion, pepper and a little water until thick and smooth. Add salt and whip with a spoon for 2 minutes.\n4. Heat the oil in a deep pan. Spoon in the batter and fry for 3 to 4 minutes, turning once, until deep golden. Drain on paper.\n5. Mix the custard powder and sugar with 3 tablespoons of cold water into a smooth paste.\n6. Heat the milk and water until almost boiling. Pour it onto the paste and stir fast.\n7. It should be thick and creamy. Serve hot with the akara.',
  },
  'tapioca-with-coconut-and-akara': {
    ingredients: [
      ['Tapioca (sago pearls)', 50, 'g', 'grains'],
      ['Water', 400, 'ml', 'other'],
      ['Coconut, grated or chunks', 50, 'g', 'veg_fruit'],
      ['Milk', 100, 'ml', 'dairy_eggs'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Black-eyed beans', 80, 'g', 'beans'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Vegetable oil for frying', 200, 'ml', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the blender, hot oil and boiling water.\n2. Soak the beans for 15 minutes, rub off the skins and rinse.\n3. Blend the beans with the onion and a little water until thick. Add the salt and whip for 2 minutes.\n4. Fry spoonfuls of batter in hot oil for 3 to 4 minutes until deep golden. Drain on paper.\n5. Boil the water in a pot. Add the tapioca and stir. Cook for 12 to 15 minutes, stirring now and then, until the pearls look clear and soft.\n6. Stir in the milk and sugar. Cook 2 more minutes.\n7. Serve the tapioca in a bowl with the coconut on top and the akara on the side.',
  },
  'tapioca-and-moi-moi': {
    ingredients: [
      ['Tapioca (sago pearls)', 50, 'g', 'grains'],
      ['Water', 400, 'ml', 'other'],
      ['Milk', 100, 'ml', 'dairy_eggs'],
      ['Sugar', 1, 'tbsp', 'pantry'],
      ['Black-eyed beans', 60, 'g', 'beans'],
      ['Egg', 1, '', 'dairy_eggs'],
      ['Palm oil', 1, 'tbsp', 'pantry'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the blender and boiling water.\n2. Soak the beans for 15 minutes, rub off the skins and rinse.\n3. Blend the beans with the onion and a little water until smooth. Stir in the palm oil, salt and egg.\n4. Pour into a foil cup or heatproof dish, cover and steam for 40 minutes. It should be firm in the middle.\n5. Meanwhile, boil the water in a pot. Add the tapioca and stir.\n6. Cook for 12 to 15 minutes, stirring now and then, until the pearls look clear and soft.\n7. Stir in the milk and sugar. Serve the tapioca with the moi moi.',
  },
  'moi-moi': {
    ingredients: [
      ['Black-eyed beans', 120, 'g', 'beans'],
      ['Red bell pepper', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Palm oil or vegetable oil', 2, 'tbsp', 'pantry'],
      ['Egg', 1, '', 'dairy_eggs'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the blender and the hot steamer.\n2. Soak the beans in water for 15 minutes. Rub them in your hands to take off the skins. Rinse until clean.\n3. Blend the beans with the peppers, onion and a little water. It should be smooth and thick.\n4. Pour into a bowl. Add the oil, crushed stock cube, crayfish and salt. Stir well.\n5. Spoon the mix into foil cups or a heatproof dish. Drop an egg in the middle if you like (slice it when cooked).\n6. Cover well. Steam in a pot with a little boiling water for 45 to 60 minutes.\n7. It is done when a knife comes out clean and the moi moi is firm.',
  },
  'boli-and-fish': {
    ingredients: [
      ['Ripe plantain', 1, '', 'tubers'],
      ['Mackerel or tilapia', 150, 'g', 'protein'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Groundnut oil', 1, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Ground pepper', 1, 'tsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the hot grill or oven and the knife.\n2. Clean the fish and cut small slits in the sides. Rub it with crushed stock cube, ground pepper, salt, oil and chopped onion. Leave for 10 minutes.\n3. Turn on the oven or grill to a high heat (220 C).\n4. Cook the fish for 10 to 12 minutes on each side. It should be golden and flake easily.\n5. Roast the unpeeled plantain on the grill or in the oven for 15 to 20 minutes, turning once. The skin should be black in spots and the plantain soft.\n6. Peel the plantain and slice it.\n7. Serve the boli with the fish and a little fresh pepper and onion.',
  },
  'boiled-plantain-and-mackerel-sauce': {
    ingredients: [
      ['Ripe plantain', 1, '', 'tubers'],
      ['Mackerel, smoked or fresh', 100, 'g', 'protein'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 2, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Cut the ends off the plantain, slit the skin and peel it. Cut into thick pieces.\n3. Put the plantain in a pot with water and a pinch of salt. Boil for 15 to 20 minutes until a fork goes in easily.\n4. Chop the tomato, onion and pepper. Remove the bones and skin from the mackerel and flake it.\n5. Heat the oil. Fry the onion for 2 minutes. Add the tomato, pepper and crushed stock cube.\n6. Cook for 8 minutes until the sauce is thick and the oil rises on top.\n7. Add the mackerel and stir for 3 minutes.\n8. Drain the plantain and serve with the sauce.',
  },
  'roasted-plantain-with-fish': {
    ingredients: [
      ['Ripe plantain', 1, '', 'tubers'],
      ['Mackerel or tilapia', 150, 'g', 'protein'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Groundnut oil', 1, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the hot oven or grill and the knife.\n2. Heat the oven to 220 C.\n3. Clean the fish and cut small slits in its sides. Rub it with oil, crushed stock cube, salt and a little chopped pepper.\n4. Put the fish on a tray. Cook for 12 minutes on each side until golden and it flakes easily.\n5. Put the plantain (skin on) on the tray. Roast for 20 minutes, turning once, until the skin is dark and the inside is soft.\n6. Chop the tomato, onion and the rest of the pepper to make a fresh relish.\n7. Peel the plantain, slice it and serve with the fish and relish.',
  },
  'fried-plantain-and-egg': {
    ingredients: [
      ['Ripe plantain', 1, '', 'tubers'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Tomato', 0.5, '', 'veg_fruit'],
      ['Vegetable oil', 4, 'tbsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
      ['Black pepper', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife and hot oil.\n2. Peel the plantain and cut it into slanted slices about as thick as your finger. Sprinkle with a little salt.\n3. Heat 3 tablespoons of oil in a frying pan on medium heat.\n4. Fry the plantain for 2 to 3 minutes on each side until deep golden. Put on paper to drain.\n5. Chop the onion and tomato small. Beat the eggs with the salt, pepper, onion and tomato.\n6. Heat the last tablespoon of oil. Pour in the eggs. Cook for 3 minutes, turning once, until set.\n7. Serve the egg with the fried plantain.',
  },
  'boiled-yam-and-egg-sauce': {
    ingredients: [
      ['Yam', 250, 'g', 'tubers'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 2, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Peel the yam, wash it and cut it into thick pieces.\n3. Put the yam in a pot with water and a pinch of salt. Boil for 15 to 20 minutes until a fork goes in easily.\n4. Chop the tomato, onion and pepper.\n5. Heat the oil. Fry the onion for 2 minutes. Add the tomato, pepper and crushed stock cube. Cook for 6 minutes until thick.\n6. Beat the eggs and pour them in. Stir for 2 to 3 minutes until set.\n7. Drain the yam and serve with the egg sauce.',
  },
  'yam-and-fish-sauce': {
    ingredients: [
      ['Yam', 250, 'g', 'tubers'],
      ['Fish (mackerel or tilapia)', 150, 'g', 'protein'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 3, 'tbsp', 'pantry'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Peel the yam, wash it and cut it into thick pieces. Boil in salted water for 15 to 20 minutes until soft. Drain.\n3. Season the fish with salt and half the crushed stock cube.\n4. Heat 2 tablespoons of oil. Fry the fish for 4 minutes on each side until golden. Put it on a plate.\n5. Chop the tomato, onion and pepper. In the same pan, add 1 tablespoon of oil and fry the onion for 2 minutes.\n6. Add the tomato, pepper and rest of the stock cube. Cook for 8 minutes until thick.\n7. Put the fish back in and simmer for 3 minutes.\n8. Serve the fish sauce with the yam.',
  },
  'fried-yam-and-fried-eggs': {
    ingredients: [
      ['Yam', 250, 'g', 'tubers'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Vegetable oil', 5, 'tbsp', 'pantry'],
      ['Salt', 1, 'tsp', 'pantry'],
      ['Black pepper', 1, 'pinch', 'pantry'],
      ['Tomato', 0.5, '', 'veg_fruit'],
      ['Onion', 0.25, '', 'veg_fruit'],
    ],
    steps:
      '1. Ask an adult to help with the knife and hot oil.\n2. Peel the yam, wash it and cut it into finger-thick slices.\n3. Put the yam in a pot with water and half the salt. Boil for 5 minutes. Drain and let it dry for 2 minutes.\n4. Heat 4 tablespoons of oil in a frying pan on medium heat.\n5. Fry the yam for 4 to 5 minutes on each side until golden. Put on paper to drain.\n6. Heat the last tablespoon of oil. Crack in the eggs, add salt and pepper, and fry for 3 minutes until the white is firm.\n7. Slice the tomato and onion. Serve everything together.',
  },
  'yam-and-beef-sauce': {
    ingredients: [
      ['Yam', 250, 'g', 'tubers'],
      ['Beef, cubed', 120, 'g', 'protein'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 2, 'tbsp', 'pantry'],
      ['Stock cube', 1, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Put the beef in a pot with half the onion, the stock cube and salt. Add a little water. Cook for 25 minutes until soft.\n3. Peel the yam, wash it and cut it into thick pieces. Boil in salted water for 15 to 20 minutes until soft. Drain.\n4. Chop the tomato, pepper and the rest of the onion.\n5. Heat the oil. Fry the onion for 2 minutes. Add the tomato and pepper and cook for 8 minutes until thick.\n6. Add the beef and a few spoons of the beef stock. Simmer for 5 minutes.\n7. Serve the beef sauce over the yam.',
  },
  'agoyin-with-yam': {
    ingredients: [
      ['Brown beans', 100, 'g', 'beans'],
      ['Yam', 250, 'g', 'tubers'],
      ['Palm oil', 3, 'tbsp', 'pantry'],
      ['Dried chilli flakes', 1, 'tsp', 'pantry'],
      ['Onion', 1, '', 'veg_fruit'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, hot oil and boiling water.\n2. Wash the beans. Boil them in plenty of water for 40 to 50 minutes until very soft and mashed a little. Drain well, with no water left.\n3. Peel the yam and cut into thick pieces. Boil in salted water for 15 to 20 minutes until soft.\n4. Slice the onion. Heat the palm oil in a pan on medium heat for 2 minutes.\n5. Fry half the onion for 3 minutes until brown. Add the chilli, crayfish and crushed stock cube. Stir for 2 minutes. This is the agoyin sauce.\n6. Fry the other half of the onion in a little oil until dark and sweet.\n7. Serve the soft beans with the sauce on top, with the yam beside it.',
  },
  'beans-porridge-with-agege-bread': {
    ingredients: [
      ['Brown or black-eyed beans', 100, 'g', 'beans'],
      ['Agege bread', 3, '', 'bakery'],
      ['Palm oil', 2, 'tbsp', 'pantry'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Wash the beans. Put them in a pot with plenty of water.\n3. Boil for 40 to 50 minutes until very soft. Add more hot water if it gets dry.\n4. Chop the onion, tomato and pepper. Blend the tomato and pepper for a smooth mix.\n5. Add the onion, palm oil, blended mix, crayfish, crushed stock cube and salt to the beans.\n6. Mash a few beans against the side of the pot to make it thick. Simmer for 10 minutes.\n7. It should be thick, soft and orange-red. Serve hot with the bread.',
  },
  'beans-porridge-and-plantain': {
    ingredients: [
      ['Brown or black-eyed beans', 100, 'g', 'beans'],
      ['Ripe plantain', 1, '', 'tubers'],
      ['Palm oil', 2, 'tbsp', 'pantry'],
      ['Vegetable oil for frying', 3, 'tbsp', 'pantry'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Wash the beans. Boil them in plenty of water for 40 to 50 minutes until very soft. Add hot water if it gets dry.\n3. Chop the onion and pepper.\n4. Add the palm oil, onion, pepper, crayfish, crushed stock cube and salt to the beans.\n5. Mash a few beans on the side of the pot. Simmer for 10 minutes until thick.\n6. Peel the plantain and cut it into slices. Fry in hot oil for 2 to 3 minutes on each side until golden. Drain on paper.\n7. Serve the beans in a bowl with the fried plantain on the side.',
  },
  'tortilla-and-egg-wrap': {
    ingredients: [
      ['Flour tortilla wrap', 1, '', 'bakery'],
      ['Eggs', 2, '', 'dairy_eggs'],
      ['Tomato', 0.5, '', 'veg_fruit'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Cheddar cheese, grated', 20, 'g', 'dairy_eggs'],
      ['Vegetable oil', 1, 'tsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
      ['Black pepper', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife and the hot pan.\n2. Chop the tomato and onion into small pieces.\n3. Beat the eggs with the salt and pepper in a bowl.\n4. Heat the oil in a pan on medium heat. Fry the onion for 1 minute.\n5. Add the tomato and the eggs. Stir for 2 minutes until the egg is soft and set.\n6. Warm the tortilla in a dry pan for 20 seconds on each side.\n7. Put the egg and cheese in the middle. Fold in the sides and roll it up. Eat while warm.',
  },
  'stir-fry-spaghetti-with-grilled-chicken-and-plantain': {
    ingredients: [
      ['Spaghetti', 90, 'g', 'grains'],
      ['Chicken breast or thigh', 150, 'g', 'protein'],
      ['Ripe plantain', 1, '', 'tubers'],
      ['Carrot', 0.5, '', 'veg_fruit'],
      ['Green beans', 30, 'g', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Vegetable oil', 3, 'tbsp', 'pantry'],
      ['Curry powder', 1, 'tsp', 'pantry'],
      ['Stock cube', 1, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water, hot oil and the grill.\n2. Rub the chicken with salt, half the curry powder and half the crushed stock cube. Leave for 10 minutes.\n3. Grill or bake the chicken at 200 C for 20 to 25 minutes, turning once. It should be golden with no pink inside.\n4. Boil the spaghetti in salted water for 9 to 10 minutes until soft. Drain.\n5. Slice the carrot, beans and onion thinly. Heat 1 tablespoon of oil and stir-fry them for 3 minutes.\n6. Add the spaghetti, the rest of the curry and stock cube. Stir for 3 minutes.\n7. Peel and slice the plantain. Fry in 2 tablespoons of oil for 2 minutes on each side until golden.\n8. Serve the spaghetti with sliced chicken and plantain.',
  },
  'guinea-fowl-sauce-with-fried-yam': {
    ingredients: [
      ['Guinea fowl pieces', 200, 'g', 'protein'],
      ['Yam', 250, 'g', 'tubers'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Red bell pepper', 0.5, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Vegetable oil', 5, 'tbsp', 'pantry'],
      ['Stock cube', 1, '', 'pantry'],
      ['Thyme and curry powder', 1, 'tsp', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Put the guinea fowl in a pot with half the onion, the stock cube, thyme, curry and salt. Add a little water.\n3. Cook on medium heat for 35 to 40 minutes until the meat is tender. Keep the stock.\n4. Blend the tomato, bell pepper and scotch bonnet. Cook this in a pot with 1 tablespoon of oil for 10 minutes to remove the sour taste.\n5. Fry the guinea fowl in 2 tablespoons of hot oil until brown, then add it to the sauce with a little stock. Simmer for 10 minutes.\n6. Peel the yam, cut it into slices and fry in 2 tablespoons of oil for 4 to 5 minutes on each side until golden.\n7. Serve the sauce with the fried yam.',
  },
  'ram-stew-and-plain-rice-with-plantain': {
    ingredients: [
      ['Long grain rice', 80, 'g', 'grains'],
      ['Ram (mutton) meat', 150, 'g', 'protein'],
      ['Ripe plantain', 1, '', 'tubers'],
      ['Tomato', 2, '', 'veg_fruit'],
      ['Red bell pepper', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Vegetable oil', 4, 'tbsp', 'pantry'],
      ['Stock cube', 1, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Put the ram meat in a pot with half the onion, the stock cube and salt. Add a little water. Cook for 40 to 45 minutes until tender. Keep the stock.\n3. Blend the tomatoes, bell pepper, scotch bonnet and the rest of the onion.\n4. Heat 3 tablespoons of oil. Pour in the blended mix. Cook for 15 minutes, stirring now and then, until thick and the oil floats on top.\n5. Add the meat and some stock. Simmer for 10 minutes.\n6. Wash the rice. Boil it in plenty of water for 12 minutes until soft. Drain.\n7. Peel and slice the plantain. Fry in 1 tablespoon of oil for 2 minutes on each side until golden.\n8. Serve the rice with the stew and plantain.',
  },
  'bread-and-beans': {
    ingredients: [
      ['Bread slices', 3, '', 'bakery'],
      ['Beans (tinned baked beans)', 200, 'g', 'beans'],
      ['Onion', 0.25, '', 'veg_fruit'],
      ['Tomato', 0.5, '', 'veg_fruit'],
      ['Vegetable oil', 1, 'tbsp', 'pantry'],
      ['Stock cube', 0.25, '', 'pantry'],
      ['Black pepper', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, the can and the hot pan.\n2. Chop the onion and tomato small.\n3. Heat the oil in a pot on medium heat. Fry the onion for 2 minutes until soft.\n4. Add the tomato and cook for 3 minutes.\n5. Pour in the beans. Add the crushed stock cube and pepper.\n6. Stir and cook for 5 minutes until hot and bubbling.\n7. Serve the beans with the bread, or put it on toast.',
  },
  'beans-and-macaroni': {
    ingredients: [
      ['Brown or black-eyed beans', 80, 'g', 'beans'],
      ['Macaroni', 70, 'g', 'grains'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Palm oil', 2, 'tbsp', 'pantry'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Wash the beans. Boil them in plenty of water for 35 to 40 minutes until soft.\n3. Boil the macaroni in salted water for 8 to 10 minutes until soft. Drain.\n4. Chop the tomato, onion and pepper.\n5. Heat the palm oil for 1 minute. Fry the onion for 2 minutes. Add the tomato and pepper and cook for 5 minutes.\n6. Add the crayfish and crushed stock cube. Stir for 1 minute.\n7. Mix in the beans and macaroni. Stir and cook for 3 minutes. It should be soft and orange.',
  },
  'rice-and-beans': {
    ingredients: [
      ['Long grain rice', 80, 'g', 'grains'],
      ['Brown or black-eyed beans', 50, 'g', 'beans'],
      ['Palm oil or vegetable oil', 2, 'tbsp', 'pantry'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Tomato', 1, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Ground crayfish', 1, 'tbsp', 'protein'],
      ['Stock cube', 0.5, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Wash the beans. Boil them in water for 30 to 40 minutes until almost soft. Keep the water.\n3. Wash the rice well in a sieve.\n4. Blend the tomato and pepper. Chop the onion.\n5. Heat the oil. Fry the onion for 2 minutes. Add the blended mix, crayfish, crushed stock cube and salt. Cook for 8 minutes.\n6. Add the beans with about 200 ml of their water. Then add the rice. The water should just cover the rice.\n7. Cover with a lid. Cook on low heat for 20 minutes without lifting the lid too much.\n8. Fluff with a fork. The rice should be soft and dry, not wet.',
  },
  'rice-and-beans-with-fish-sauce': {
    ingredients: [
      ['Long grain rice', 80, 'g', 'grains'],
      ['Brown or black-eyed beans', 50, 'g', 'beans'],
      ['Fish (mackerel or tilapia)', 120, 'g', 'protein'],
      ['Palm oil or vegetable oil', 3, 'tbsp', 'pantry'],
      ['Onion', 0.5, '', 'veg_fruit'],
      ['Tomato', 2, '', 'veg_fruit'],
      ['Scotch bonnet pepper', 0.25, '', 'veg_fruit'],
      ['Stock cube', 1, '', 'pantry'],
      ['Salt', 1, 'pinch', 'pantry'],
    ],
    steps:
      '1. Ask an adult to help with the knife, boiling water and hot oil.\n2. Wash the beans. Boil for 30 to 40 minutes until almost soft. Keep the water.\n3. Add 1 tablespoon of oil to a pot. Fry half the onion for 2 minutes. Add the washed rice, 200 ml of bean water, the beans, half the stock cube and salt.\n4. Cover and cook on low heat for 20 minutes until the rice is soft and dry.\n5. Blend the tomatoes and pepper. Chop the rest of the onion.\n6. Heat 2 tablespoons of oil. Fry the onion for 2 minutes. Add the blended mix and the rest of the stock cube. Cook for 10 minutes until thick.\n7. Season the fish with salt. Add it to the sauce. Simmer for 6 to 8 minutes until it flakes easily.\n8. Serve the fish sauce over the rice and beans.',
  },
}
