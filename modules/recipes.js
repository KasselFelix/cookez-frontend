const recipes=[
    {
      "name": "Tacos Al Pastor",
      "origin": "Mexique",
      "ingredients": [
        {
          "name": "Porc",
          "image": "porc.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 1.3, "glycemic_index": 0, "calories": 242 }
        },
        {
          "name": "Ananas",
          "image": "ananas.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 3, "vitamine_B": 0.1, "glycemic_index": 66, "calories": 50 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Tacos_Al_Pastor.jpg",
      "preparationTime": 60,
      "description": "Un plat traditionnel mexicain avec du porc mariné et de l'ananas.",
      "steps": [
        "Mariner le porc avec les épices.",
        "Faire cuire le porc et l'ananas.",
        "Servir dans des tortillas chaudes."
      ]
    },
    {
      "name": "Ceviche",
      "origin": "Pérou",
      "ingredients": [
        {
          "name": "Poisson blanc",
          "image": "poisson_blanc.jpg",
          "quantity": 400,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 0, "calories": 140 }
        },
        {
          "name": "Citron vert",
          "image": "citron_vert.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 22, "vitamine_B": 0.1, "glycemic_index": 20, "calories": 30 }
        }
      ],
      "difficulty": 2,
      "note": 5,
      "picture": "Ceviche.jpg",
      "preparationTime": 30,
      "description": "Un plat péruvien à base de poisson cru mariné dans du jus de citron vert.",
      "steps": [
        "Couper le poisson en dés.",
        "Mariner avec le jus de citron vert.",
        "Ajouter les oignons, la coriandre et le piment.",
        "Servir frais."
      ]
    },
    {
      "name": "Feijoada",
      "origin": "Brésil",
      "ingredients": [
        {
          "name": "Haricots noirs",
          "image": "haricots_noirs.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 30, "calories": 340 }
        },
        {
          "name": "Porc",
          "image": "porc.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 1.3, "glycemic_index": 0, "calories": 242 }
        }
      ],
      "difficulty": 4,
      "note": 5,
      "picture": "Feijoada.jpg",
      "preparationTime": 120,
      "description": "Un ragoût brésilien traditionnel de haricots noirs et de viande de porc.",
      "steps": [
        "Cuire les haricots noirs.",
        "Ajouter la viande de porc et les saucisses.",
        "Servir avec du riz et du chou vert."
      ]
    },
    {
      "name": "Arepas",
      "origin": "Venezuela",
      "ingredients": [
        {
          "name": "Farine de maïs",
          "image": "farine_de_mais.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 70, "calories": 360 }
        },
        {
          "name": "Fromage",
          "image": "fromage.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 300, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 400 }
        }
      ],
      "difficulty": 2,
      "note": 4,
      "picture": "Arepas.jpg",
      "preparationTime": 40,
      "description": "Des galettes de maïs vénézuéliennes farcies de fromage et d'avocat.",
      "steps": [
        "Mélanger la farine de maïs, l'eau et le sel.",
        "Former des galettes.",
        "Cuire à la poêle.",
        "Farcir de fromage et d'avocat."
      ]
    },
    {
      "name": "Empanadas",
      "origin": "Argentine",
      "ingredients": [
        {
          "name": "Pâte à empanadas",
          "image": "pate_a_empanadas.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 70, "calories": 400 }
        },
        {
          "name": "Bœuf",
          "image": "boeuf.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 250 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Empanadas.jpg",
      "preparationTime": 90,
      "description": "Des chaussons argentins farcis de bœuf et d'oignons.",
      "steps": [
        "Préparer la pâte.",
        "Faire revenir le bœuf et les oignons.",
        "Farcir la pâte.",
        "Cuire au four."
      ]
    },
    {
      "name": "Pupusas",
      "origin": "Salvador",
      "ingredients": [
        {
          "name": "Farine de maïs",
          "image": "farine_de_mais.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 70, "calories": 360 }
        },
        {
          "name": "Fromage",
          "image": "fromage.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 300, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 400 }
        }
      ],
      "difficulty": 3,
      "note": 4,
      "picture": "Pupusas.jpg",
      "preparationTime": 50,
      "description": "Des galettes de maïs salvadoriennes farcies de fromage et de haricots rouges.",
      "steps": [
        "Mélanger la farine de maïs.",
        "Farcir de fromage et de haricots rouges.",
        "Cuire à la poêle.",
        "Servir avec du curtido."
      ]
    },
    {
      "name": "Moqueca",
      "origin": "Brésil",
      "ingredients": [
        {
          "name": "Poisson",
          "image": "poisson.jpg",
          "quantity": 400,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 0, "calories": 140 }
        },
        {
          "name": "Lait de coco",
          "image": "lait_de_coco.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.1, "glycemic_index": 0, "calories": 230 }
        }
      ],
      "difficulty": 4,
      "note": 5,
      "picture": "Moqueca.jpg",
      "preparationTime": 60,
      "description": "Un ragoût brésilien de poisson au lait de coco.",
      "steps": [
        "Cuire le poisson avec le lait de coco.",
        "Ajouter les tomates et les poivrons.",
        "Garnir de coriandre.",
        "Servir chaud."
      ]
    },
    {
      "name": "Tostones",
      "origin": "Puerto Rico",
      "ingredients": [
        {
          "name": "Plantains verts",
          "image": "plantains_verts.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 55, "calories": 360 }
        }
      ],
      "difficulty": 2,
      "note": 4,
      "picture": "Tostones.jpg",
      "preparationTime": 30,
      "description": "Des plantains frits portoricains.",
      "steps": [
        "Peler et couper les plantains.",
        "Frire les plantains.",
        "Écraser et frire à nouveau.",
        "Assaisonner de sel et d'ail."
      ]
    },
    {
      "name": "Chimichurri",
      "origin": "Argentine",
      "ingredients": [
        {
          "name": "Persil",
          "image": "persil.jpg",
          "quantity": 50,
          "nutrition": { "vitamine_A": 421, "vitamine_B": 0.2, "glycemic_index": 0, "calories": 36 }
        },
        {
          "name": "Ail",
          "image": "ail.jpg",
          "quantity": 10,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 0, "calories": 4 }
        }
      ],
      "difficulty": 1,
      "note": 5,
      "picture": "Chimichurri.jpg",
      "preparationTime": 15,
      "description": "Une sauce argentine à base de persil et d'ail.",
      "steps": [
        "Mélanger le persil, l'ail, le vinaigre, l'huile d'olive et le piment rouge.",
        "Servir avec de la viande grillée."
      ]
    },
    {
      "name": "Ropa Vieja",
      "origin": "Cuba",
      "ingredients": [
        {
          "name": "Bœuf effiloché",
          "image": "boeuf_effiloche.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 250 }
        },
        {
          "name": "Tomates",
          "image": "tomates.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 42, "vitamine_B": 0.1, "glycemic_index": 15, "calories": 18 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Ropa_Vieja.jpg",
      "preparationTime": 120,
      "description": "Un plat cubain de bœuf effiloché en sauce tomate.",
      "steps": [
        "Cuire le bœuf et l'effilocher.",
        "Faire revenir avec les tomates, poivrons et oignons.",
        "Laisser mijoter.",
        "Servir chaud."
      ]
    },
    {
      "name": "Cachapa",
      "origin": "Venezuela",
      "ingredients": [
        {
          "name": "Maïs",
          "image": "mais.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 214, "vitamine_B": 0.1, "glycemic_index": 52, "calories": 86 }
        },
        {
          "name": "Fromage",
          "image": "fromage.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 300, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 400 }
        }
      ],
      "difficulty": 2,
      "note": 4,
      "picture": "Cachapa.jpg",
      "preparationTime": 45,
      "description": "Des crêpes de maïs vénézuéliennes garnies de fromage.",
      "steps": [
        "Mélanger le maïs, le lait, les œufs et le sucre.",
        "Cuire à la poêle.",
        "Garnir de fromage."
      ]
    },
    {
      "name": "Pozole",
      "origin": "Mexique",
      "ingredients": [
        {
          "name": "Maïs hominy",
          "image": "mais_hominy.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 70, "calories": 119 }
        },
        {
          "name": "Poulet",
          "image": "poulet.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 1.1, "glycemic_index": 0, "calories": 239 }
        }
      ],
      "difficulty": 4,
      "note": 5,
      "picture": "Pozole.jpg",
      "preparationTime": 150,
      "description": "Un ragoût mexicain de maïs hominy et de poulet.",
      "steps": [
        "Cuire le maïs hominy.",
        "Ajouter le poulet et les épices.",
        "Servir avec de la laitue, des radis et des oignons."
      ]
    },
    {
      "name": "Tamales",
      "origin": "Mexique",
      "ingredients": [
        {
          "name": "Farine de maïs",
          "image": "farine_de_mais.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.5, "glycemic_index": 70, "calories": 360 }
        },
        {
          "name": "Porc",
          "image": "porc.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 1.3, "glycemic_index": 0, "calories": 242 }
        }
      ],
      "difficulty": 4,
      "note": 5,
      "picture": "Tamales.jpg",
      "preparationTime": 120,
      "description": "Des pâtisseries de farine de maïs mexicaines farcies de porc.",
      "steps": [
        "Préparer la pâte de farine de maïs.",
        "Farcir avec du porc mariné.",
        "Cuire à la vapeur dans des feuilles de maïs."
      ]
    },
    {
      "name": "Lomo Saltado",
      "origin": "Pérou",
      "ingredients": [
        {
          "name": "Bœuf",
          "image": "boeuf.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 250 }
        },
        {
          "name": "Tomates",
          "image": "tomates.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 42, "vitamine_B": 0.1, "glycemic_index": 15, "calories": 18 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Lomo_Saltado.jpg",
      "preparationTime": 45,
      "description": "Un sauté péruvien de bœuf avec des tomates et des oignons.",
      "steps": [
        "Faire sauter le bœuf avec les oignons et les tomates.",
        "Assaisonner avec des épices péruviennes.",
        "Servir avec du riz et des frites."
      ]
    },
    {
      "name": "Churrasco",
      "origin": "Brésil",
      "ingredients": [
        {
          "name": "Bœuf",
          "image": "boeuf.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 250 }
        },
        {
          "name": "Sel",
          "image": "sel.jpg",
          "quantity": 10,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0, "glycemic_index": 0, "calories": 0 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Churrasco.jpg",
      "preparationTime": 30,
      "description": "Du bœuf brésilien grillé assaisonné simplement avec du sel.",
      "steps": [
        "Assaisonner le bœuf avec du sel.",
        "Griller à haute température.",
        "Servir avec du farofa et de la vinaigrette."
      ]
    },
    {
      "name": "Ajiaco",
      "origin": "Colombie",
      "ingredients": [
        {
          "name": "Poulet",
          "image": "poulet.jpg",
          "quantity": 500,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 1.1, "glycemic_index": 0, "calories": 239 }
        },
        {
          "name": "Pommes de terre",
          "image": "pommes_de_terre.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.1, "glycemic_index": 78, "calories": 77 }
        }
      ],
      "difficulty": 4,
      "note": 5,
      "picture": "Ajiaco.jpg",
      "preparationTime": 90,
      "description": "Une soupe colombienne de poulet et de pommes de terre.",
      "steps": [
        "Cuire le poulet avec des herbes.",
        "Ajouter les pommes de terre et le maïs.",
        "Servir avec de la crème et des câpres."
      ]
    },
    {
      "name": "Picarones",
      "origin": "Pérou",
      "ingredients": [
        {
          "name": "Patates douces",
          "image": "patates_douces.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 19218, "vitamine_B": 0.3, "glycemic_index": 70, "calories": 86 }
        },
        {
          "name": "Farine",
          "image": "farine.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 70, "calories": 364 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Picarones.jpg",
      "preparationTime": 60,
      "description": "Des beignets péruviens de patates douces et de courges.",
      "steps": [
        "Cuire les patates douces et les écraser.",
        "Mélanger avec la farine, le sucre et la levure.",
        "Former des anneaux.",
        "Frire jusqu'à doré.",
        "Servir avec du sirop de chancaca."
      ]
    },
    {
      "name": "Patacones",
      "origin": "Colombie",
      "ingredients": [
        {
          "name": "Plantains verts",
          "image": "plantains_verts.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 55, "calories": 360 }
        },
        {
          "name": "Sel",
          "image": "sel.jpg",
          "quantity": 10,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0, "glycemic_index": 0, "calories": 0 }
        }
      ],
      "difficulty": 2,
      "note": 4,
      "picture": "Patacones.jpg",
      "preparationTime": 30,
      "description": "Des tranches de plantains verts frits.",
      "steps": [
        "Peler et couper les plantains.",
        "Frire les plantains.",
        "Écraser et frire à nouveau.",
        "Assaisonner de sel."
      ]
    },
    {
      "name": "Pão de Queijo",
      "origin": "Brésil",
      "ingredients": [
        {
          "name": "Farine de tapioca",
          "image": "farine_de_tapioca.jpg",
          "quantity": 250,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 85, "calories": 358 }
        },
        {
          "name": "Fromage",
          "image": "fromage.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 300, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 400 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Pão_de_Queijo.jpg",
      "preparationTime": 40,
      "description": "Des petits pains au fromage brésiliens.",
      "steps": [
        "Mélanger la farine de tapioca, le lait, l'huile et le fromage.",
        "Former des petites boules.",
        "Cuire au four jusqu'à doré."
      ]
    },
    {
      "name": "Gallo Pinto",
      "origin": "Costa Rica",
      "ingredients": [
        {
          "name": "Riz",
          "image": "riz.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.1, "glycemic_index": 73, "calories": 130 }
        },
        {
          "name": "Haricots noirs",
          "image": "haricots_noirs.jpg",
          "quantity": 200,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 30, "calories": 340 }
        }
      ],
      "difficulty": 2,
      "note": 4,
      "picture": "Gallo_Pinto.jpg",
      "preparationTime": 30,
      "description": "Un mélange costaricien de riz et de haricots noirs.",
      "steps": [
        "Cuire le riz.",
        "Mélanger avec les haricots noirs cuits.",
        "Faire revenir avec des oignons et des poivrons.",
        "Servir chaud."
      ]
    },
    {
      "name": "Milanesa",
      "origin": "Argentine",
      "ingredients": [
        {
          "name": "Bœuf",
          "image": "boeuf.jpg",
          "quantity": 300,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.4, "glycemic_index": 0, "calories": 250 }
        },
        {
          "name": "Chapelure",
          "image": "chapelure.jpg",
          "quantity": 100,
          "nutrition": { "vitamine_A": 0, "vitamine_B": 0.2, "glycemic_index": 70, "calories": 364 }
        }
      ],
      "difficulty": 3,
      "note": 5,
      "picture": "Milanesa.jpg",
      "preparationTime": 45,
      "description": "Une escalope de bœuf panée et frite.",
      "steps": [
        "Tremper le bœuf dans l'œuf battu.",
        "Enrober de chapelure.",
        "Frire jusqu'à doré.",
        "Servir avec du citron."
      ]
    }
  ]

  export default recipes;