/* Données de référence : exercices, programme PPL, niveaux, missions. */
window.T = window.T || {};

T.EX = {
  incline_db_press: { n: 'Développé incliné haltères', t: 'c', m: 'Pectoraux (haut), épaules avant, triceps', cues: ['Banc à 30°, omoplates serrées et basses', 'Descends les haltères jusqu’au niveau du haut des pecs, coudes à ~45°', 'Pousse en rapprochant légèrement les haltères, sans les cogner'] },
  chest_press: { n: 'Chest press', t: 'c', m: 'Pectoraux, triceps', cues: ['Règle le siège : poignées à hauteur du milieu des pecs', 'Garde le dos collé au dossier et la poitrine sortie', 'Contrôle 2 s au retour, étirement sans perdre la tension'] },
  machine_shoulder_press: { n: 'Développé épaules machine', t: 'c', m: 'Deltoïdes avant et moyens, triceps', cues: ['Poignées à hauteur du menton au départ', 'Gainage abdominal, pas de cambrure excessive', 'Pousse sans verrouiller brutalement les coudes'] },
  lateral_raise: { n: 'Élévations latérales', t: 'i', m: 'Deltoïdes moyens', cues: ['Buste légèrement penché, coudes très légèrement fléchis', 'Monte jusqu’à l’horizontale en menant avec les coudes', 'Pas d’élan : charge légère, descente lente'] },
  tri_rope: { n: 'Triceps poulie corde', t: 'i', m: 'Triceps', cues: ['Coudes collés au corps et fixes', 'Écarte la corde en bas du mouvement', 'Remonte jusqu’à 90° environ, sans bouger les épaules'] },
  overhead_tri_ext: { n: 'Extension triceps au-dessus de la tête', t: 'i', m: 'Triceps (longue portion)', cues: ['Coudes pointés vers l’avant, proches de la tête', 'Descends derrière la tête pour un étirement complet', 'Tends les bras sans cambrer le bas du dos'] },
  lat_pulldown: { n: 'Tirage vertical', t: 'c', m: 'Grand dorsal, biceps', cues: ['Prise un peu plus large que les épaules', 'Tire la barre vers le haut des pecs en abaissant les épaules', 'Pense « coudes vers les hanches », remonte en contrôle'] },
  chest_supported_row: { n: 'Rowing poitrine appuyée', t: 'c', m: 'Haut du dos, grand dorsal, arrière d’épaules', cues: ['Poitrine plaquée contre l’appui', 'Tire les coudes vers l’arrière et serre les omoplates', 'Pause d’une seconde en contraction'] },
  seated_cable_row: { n: 'Rowing poulie basse', t: 'c', m: 'Dos (épaisseur), grand dorsal', cues: ['Buste droit, légère inclinaison maximum', 'Tire vers le nombril, omoplates serrées', 'Laisse les épaules s’étirer vers l’avant au retour'] },
  reverse_pec_deck: { n: 'Reverse pec deck', t: 'i', m: 'Deltoïdes postérieurs, haut du dos', cues: ['Bras presque tendus, poignées à hauteur d’épaules', 'Ouvre les bras en arc, sans serrer fort les omoplates', 'Charge modérée, mouvement fluide'] },
  db_curl: { n: 'Curl haltères', t: 'i', m: 'Biceps', cues: ['Coudes fixes le long du corps', 'Supination : tourne les paumes vers le haut en montant', 'Descente contrôlée jusqu’à l’extension complète'] },
  preacher_curl: { n: 'Curl pupitre', t: 'i', m: 'Biceps (partie basse)', cues: ['Aisselles calées en haut du pupitre', 'Descends presque à l’extension, sans relâcher', 'Monte sans décoller les bras du pupitre'] },
  hack_squat: { n: 'Hack squat', t: 'c', m: 'Quadriceps, fessiers', cues: ['Pieds largeur d’épaules, milieu de plateforme', 'Descends le plus bas possible en gardant le dos plaqué', 'Pousse par tout le pied, genoux dans l’axe des orteils'] },
  rdl: { n: 'Soulevé de terre roumain', t: 'c', m: 'Ischio-jambiers, fessiers, lombaires', cues: ['Genoux légèrement fléchis et fixes', 'Pousse les hanches vers l’arrière, barre collée aux jambes', 'Dos neutre ; remonte en serrant les fessiers'] },
  leg_extension: { n: 'Leg extension', t: 'i', m: 'Quadriceps', cues: ['Genou aligné avec l’axe de la machine', 'Tends complètement, contraction d’une seconde', 'Descente lente sur 2–3 s'] },
  seated_leg_curl: { n: 'Leg curl assis', t: 'i', m: 'Ischio-jambiers', cues: ['Bassin bien calé, buste légèrement penché en avant', 'Fléchis au maximum', 'Contrôle le retour jusqu’à l’étirement'] },
  standing_calf: { n: 'Mollets debout', t: 'i', m: 'Mollets (gastrocnémiens)', cues: ['Sur une marche ou un disque, un haltère dans la main (unilatéral possible)', 'Jambes tendues, descends en étirement complet, pause d’une seconde', 'Monte le plus haut possible sur la pointe'] },
  cable_crunch: { n: 'Crunch poulie', t: 'a', m: 'Grand droit de l’abdomen', cues: ['À genoux, corde derrière la tête', 'Enroule la colonne : côtes vers le bassin', 'Les hanches ne bougent pas, ce sont les abdos qui tirent'] },
  knee_raise: { n: 'Relevés de genoux', t: 'a', m: 'Abdominaux (bas), fléchisseurs de hanche', cues: ['Suspendu ou sur chaise romaine', 'Monte les genoux en enroulant le bassin', 'Pas de balancier, descente contrôlée'], bw: true },
  db_bench: { n: 'Développé couché haltères', t: 'c', m: 'Pectoraux, triceps, épaules avant', cues: ['Omoplates serrées, pieds ancrés au sol', 'Descends jusqu’à un bon étirement des pecs', 'Pousse vers le haut et légèrement vers l’intérieur'] },
  incline_machine_press: { n: 'Développé incliné machine', t: 'c', m: 'Pectoraux (haut), épaules avant', cues: ['Siège réglé pour pousser vers le haut des pecs', 'Poitrine sortie, épaules basses', 'Retour contrôlé, amplitude complète'] },
  cable_fly: { n: 'Écartés poulie', t: 'i', m: 'Pectoraux', cues: ['Coudes légèrement fléchis et fixes', 'Ramène les mains en arc devant la poitrine', 'Étirement contrôlé, sans dépasser l’alignement des épaules'] },
  cable_lateral: { n: 'Élévations latérales poulie', t: 'i', m: 'Deltoïdes moyens', cues: ['Poulie basse, câble passant devant ou derrière le corps', 'Monte jusqu’à l’horizontale', 'Tension constante, aucune pause en bas'], side: true },
  db_shoulder_press: { n: 'Développé épaules haltères', t: 'c', m: 'Deltoïdes, triceps', cues: ['Assis, dossier presque vertical', 'Haltères à hauteur des oreilles au départ', 'Pousse sans cambrer, coudes légèrement vers l’avant'] },
  cable_tri_ext: { n: 'Extension triceps poulie', t: 'i', m: 'Triceps', cues: ['Barre ou poignée, coudes fixes', 'Extension complète en bas', 'Remonte lentement jusqu’à 90°'] },
  neutral_pulldown: { n: 'Tirage vertical prise neutre', t: 'c', m: 'Grand dorsal, biceps, brachial', cues: ['Paumes face à face', 'Tire vers le haut des pecs, buste légèrement incliné', 'Étire bien les dorsaux en haut'] },
  single_arm_cable_row: { n: 'Rowing unilatéral poulie', t: 'c', m: 'Grand dorsal', cues: ['Tire le coude vers la hanche', 'Légère rotation du buste autorisée en étirement', 'Même nombre de reps de chaque côté'], side: true },
  high_row: { n: 'High row machine', t: 'c', m: 'Haut du dos, grand dorsal', cues: ['Poitrine contre l’appui', 'Tire vers le bas et l’arrière', 'Serre les omoplates en fin de mouvement'] },
  face_pull: { n: 'Face pull', t: 'i', m: 'Deltoïdes postérieurs, coiffe des rotateurs', cues: ['Poulie à hauteur du visage, corde', 'Tire vers le front en écartant les mains', 'Finis en rotation externe, pouces vers l’arrière'] },
  incline_curl: { n: 'Curl incliné', t: 'i', m: 'Biceps (longue portion)', cues: ['Banc à 45–60°, bras pendants', 'Coudes immobiles derrière le buste', 'Monte sans avancer les épaules'] },
  hammer_curl: { n: 'Curl marteau', t: 'i', m: 'Brachial, brachio-radial, biceps', cues: ['Prise neutre, pouces vers le haut', 'Coudes fixes', 'Descente lente'] },
  leg_press: { n: 'Presse à cuisses', t: 'c', m: 'Quadriceps, fessiers', cues: ['Pieds milieu de plateforme, largeur d’épaules', 'Descends jusqu’à ce que le bassin reste collé au siège', 'Ne verrouille pas les genoux en haut'] },
  bulgarian: { n: 'Bulgarian split squat', t: 'c', m: 'Quadriceps, fessiers', cues: ['Pied arrière posé sur un banc', 'Descends verticalement, genou avant au-dessus du pied', 'Buste légèrement penché pour plus de fessiers'], side: true },
  hip_thrust: { n: 'Hip thrust', t: 'c', m: 'Fessiers, ischio-jambiers', cues: ['Haut du dos sur le banc, barre au pli de hanche', 'Menton rentré, pousse par les talons', 'Verrouille en contractant fort les fessiers'] },
  lying_leg_curl: { n: 'Leg curl allongé', t: 'i', m: 'Ischio-jambiers', cues: ['Hanches plaquées sur le banc', 'Fléchis au maximum', 'Retour lent'] },
  seated_calf: { n: 'Mollets assis', t: 'i', m: 'Mollets (soléaire)', cues: ['Assis sur le banc, haltères ou barre posés sur les genoux', 'Pointes de pied sur un disque pour l’amplitude', 'Pause d’une seconde en haut'] },
  crunch: { n: 'Crunch', t: 'a', m: 'Grand droit de l’abdomen', cues: ['Bas du dos au sol', 'Enroule le haut du dos, regard vers le plafond', 'Expire en montant'], bw: true },
  /* Exercices maison : banc réglable, haltères, barre et disques */
  pushup: { n: 'Pompes', t: 'c', m: 'Pectoraux, triceps, épaules avant', cues: ['Mains un peu plus larges que les épaules, corps gainé', 'Descends la poitrine à 2–3 cm du sol, coudes à ~45°', 'Trop facile : pieds sur le banc ou tempo lent 3 s en descente'], bw: true },
  floor_press: { n: 'Floor press barre', t: 'c', m: 'Pectoraux, triceps', cues: ['Allongé au sol, genoux fléchis, barre au-dessus de la poitrine', 'Descends jusqu’à poser les triceps au sol, pause d’une seconde', 'Sans rack ni partenaire, c’est la façon sûre de pousser lourd à la barre'] },
  db_fly: { n: 'Écarté couché haltères', t: 'i', m: 'Pectoraux', cues: ['Banc plat ou légèrement incliné, coudes un peu fléchis et fixes', 'Ouvre en arc jusqu’à un étirement confortable', 'Remonte en serrant les pecs, sans cogner les haltères'] },
  ohp: { n: 'Développé militaire barre debout', t: 'c', m: 'Deltoïdes, triceps, gainage', cues: ['Monte la barre aux épaules en deux temps : cuisses puis clavicules', 'Fessiers et abdos serrés, pousse la barre au-dessus de la tête', 'Passe la tête sous la barre en fin de mouvement, sans cambrer'] },
  db_skull: { n: 'Extension triceps couché haltères', t: 'i', m: 'Triceps', cues: ['Allongé sur le banc, haltères bras tendus, prise neutre', 'Fléchis seulement les coudes, haltères de chaque côté de la tête', 'Coudes pointés vers le plafond, ils ne s’écartent pas'] },
  bench_dip: { n: 'Dips sur banc', t: 'i', m: 'Triceps, pectoraux bas', cues: ['Mains au bord du banc, jambes tendues ou fléchies', 'Descends jusqu’à 90° aux coudes, épaules basses', 'Plus dur : un disque sur les cuisses'], bw: true },
  barbell_row: { n: 'Rowing barre buste penché', t: 'c', m: 'Dos (épaisseur), grand dorsal, arrière d’épaules', cues: ['Buste penché à ~45°, dos plat, genoux fléchis', 'Tire la barre vers le bas du ventre, coudes le long du corps', 'Contrôle la descente, le buste ne se relève pas'] },
  underhand_row: { n: 'Rowing barre prise inversée', t: 'c', m: 'Grand dorsal, biceps', cues: ['Paumes vers le haut, largeur d’épaules', 'Buste penché, tire vers le nombril', 'Pense « coudes vers les hanches » pour viser les dorsaux'] },
  db_row: { n: 'Rowing unilatéral haltère', t: 'c', m: 'Grand dorsal, haut du dos', cues: ['Main et genou en appui sur le banc plat, dos plat', 'Tire l’haltère vers la hanche, pas vers l’épaule', 'Laisse l’épaule s’étirer en bas à chaque rep'], side: true },
  incline_db_row: { n: 'Rowing haltères buste appuyé', t: 'c', m: 'Haut du dos, arrière d’épaules', cues: ['Banc incliné à ~30°, ventre contre le dossier', 'Tire les deux haltères en serrant les omoplates', 'Aucun élan possible : vise une contraction propre'] },
  db_pullover: { n: 'Pull-over haltère', t: 'i', m: 'Grand dorsal, pectoraux', cues: ['Haut du dos en travers ou allongé sur le banc, un haltère tenu à deux mains', 'Descends derrière la tête bras presque tendus, bassin bas', 'Ramène au-dessus de la poitrine en pensant à tirer avec les dorsaux'] },
  rear_delt_fly: { n: 'Oiseau buste appuyé', t: 'i', m: 'Deltoïdes postérieurs, haut du dos', cues: ['Ventre sur le banc incliné, haltères légers', 'Ouvre les bras sur les côtés, petits doigts vers le haut', 'Monte jusqu’à l’horizontale, descente lente'] },
  db_shrug: { n: 'Shrugs haltères', t: 'i', m: 'Trapèzes', cues: ['Debout, haltères le long du corps', 'Monte les épaules vers les oreilles, pause d’une seconde', 'Ne roule pas les épaules'] },
  barbell_curl: { n: 'Curl barre', t: 'i', m: 'Biceps', cues: ['Prise largeur d’épaules, coudes collés au corps', 'Monte sans balancer le buste', 'Descends jusqu’à l’extension complète'] },
  concentration_curl: { n: 'Curl concentré', t: 'i', m: 'Biceps', cues: ['Assis sur le banc, coude calé contre l’intérieur de la cuisse', 'Monte en tournant le petit doigt vers le haut', 'Contraction d’une seconde en haut'], side: true },
  goblet_squat: { n: 'Squat goblet', t: 'c', m: 'Quadriceps, fessiers', cues: ['Un haltère tenu verticalement contre la poitrine', 'Descends entre les talons, buste droit, genoux vers l’extérieur', 'Charge maximale atteinte : tempo 3 s en descente + pause en bas'] },
  walking_lunge: { n: 'Fentes haltères', t: 'c', m: 'Quadriceps, fessiers', cues: ['Un haltère dans chaque main, grand pas en avant', 'Genou arrière presque au sol, buste droit', 'Pousse par le talon avant pour revenir ou avancer'], side: true },
  deadlift: { n: 'Soulevé de terre barre', t: 'c', m: 'Chaîne postérieure, dos, fessiers', cues: ['Barre au-dessus du milieu du pied, tibias proches', 'Dos plat, poitrine sortie, pousse le sol avec les jambes', 'Verrouille en serrant les fessiers, sans te pencher en arrière'] },
  db_leg_curl: { n: 'Leg curl haltère allongé', t: 'i', m: 'Ischio-jambiers', cues: ['À plat ventre sur le banc, un haltère serré entre les pieds', 'Fléchis les genoux jusqu’à la verticale', 'Charge légère au début : l’haltère doit rester bien calé'] },
  step_up: { n: 'Montées sur banc', t: 'c', m: 'Quadriceps, fessiers', cues: ['Banc en position plate et stable, haltères en main', 'Pose tout le pied sur le banc, pousse sans t’aider de la jambe du bas', 'Redescends lentement'], side: true },
  decline_crunch: { n: 'Crunch décliné', t: 'a', m: 'Grand droit de l’abdomen', cues: ['Banc en déclinaison, pieds calés sous les boudins', 'Enroule le buste sans tirer sur la nuque', 'Plus dur : un disque contre la poitrine'], bw: true },
  lying_leg_raise: { n: 'Relevés de jambes sur banc', t: 'a', m: 'Abdominaux (bas)', cues: ['Allongé sur le banc, mains derrière la tête agrippées au banc', 'Monte les jambes tendues jusqu’à la verticale puis décolle le bassin', 'Descends lentement sans cambrer'], bw: true },
  pullup: { n: 'Tractions', t: 'c', m: 'Grand dorsal, biceps', cues: ['Nécessite une barre de traction', 'Pars bras tendus, tire la poitrine vers la barre', 'Trop dur : négatives lentes de 4–5 s'], bw: true },
  plank: { n: 'Gainage', t: 'a', m: 'Sangle abdominale', cues: ['Coudes sous les épaules', 'Corps aligné, fessiers serrés', 'Respire calmement, bassin ni haut ni bas'], bw: true, unit: 'sec' },
};

/* [id exercice, séries, reps min, reps max] — programme maison : banc réglable, haltères, barre */
T.TPL = {
  pushA: { name: 'Push A', focus: 'Pectoraux · Épaules · Triceps', ex: [['incline_db_press', 3, 8, 12], ['db_bench', 3, 8, 12], ['db_shoulder_press', 3, 8, 12], ['lateral_raise', 4, 12, 20], ['overhead_tri_ext', 3, 10, 15], ['pushup', 2, 8, 20]] },
  pullA: { name: 'Pull A', focus: 'Dos · Arrière d’épaules · Biceps', ex: [['barbell_row', 3, 8, 12], ['db_row', 3, 10, 12], ['db_pullover', 3, 10, 15], ['rear_delt_fly', 3, 12, 20], ['barbell_curl', 3, 8, 12], ['hammer_curl', 2, 10, 15]] },
  legsA: { name: 'Legs A + abdos', focus: 'Quadriceps · Ischios · Mollets · Abdos', ex: [['goblet_squat', 3, 10, 15], ['rdl', 3, 8, 12], ['walking_lunge', 3, 10, 12], ['db_leg_curl', 3, 10, 15], ['standing_calf', 4, 12, 20], ['decline_crunch', 3, 12, 15], ['lying_leg_raise', 3, 10, 15]] },
  pushB: { name: 'Push B', focus: 'Pectoraux · Épaules · Triceps', ex: [['floor_press', 3, 6, 10], ['incline_db_press', 3, 8, 12], ['db_fly', 2, 10, 15], ['ohp', 3, 6, 10], ['lateral_raise', 3, 12, 20], ['db_skull', 3, 10, 12], ['bench_dip', 2, 10, 20]] },
  pullB: { name: 'Pull B', focus: 'Dos · Trapèzes · Biceps', ex: [['incline_db_row', 3, 8, 12], ['underhand_row', 3, 8, 12], ['db_pullover', 2, 12, 15], ['rear_delt_fly', 3, 12, 20], ['db_shrug', 3, 10, 15], ['incline_curl', 3, 10, 12], ['concentration_curl', 2, 10, 15]] },
  legsB: { name: 'Legs B + abdos', focus: 'Quadriceps · Fessiers · Ischios · Abdos', ex: [['bulgarian', 3, 8, 12], ['hip_thrust', 3, 8, 12], ['deadlift', 3, 5, 8], ['step_up', 3, 10, 12], ['seated_calf', 4, 15, 20], ['crunch', 3, 15, 20], ['plank', 3, 45, 60]] },
};

/* Programme salle de sport d’origine, disponible comme modèle */
T.PRESET_GYM = {
  pushA: { name: 'Push A', focus: 'Pectoraux · Épaules · Triceps', ex: [['incline_db_press', 3, 8, 12], ['chest_press', 3, 8, 12], ['machine_shoulder_press', 3, 8, 12], ['lateral_raise', 4, 12, 20], ['tri_rope', 3, 10, 15], ['overhead_tri_ext', 2, 10, 15]] },
  pullA: { name: 'Pull A', focus: 'Dos · Arrière d’épaules · Biceps', ex: [['lat_pulldown', 3, 8, 12], ['chest_supported_row', 3, 8, 12], ['seated_cable_row', 3, 10, 12], ['reverse_pec_deck', 3, 12, 20], ['db_curl', 3, 10, 12], ['preacher_curl', 2, 10, 15]] },
  legsA: { name: 'Legs A + abdos', focus: 'Quadriceps · Ischios · Mollets · Abdos', abs: true, ex: [['hack_squat', 3, 8, 12], ['rdl', 3, 8, 12], ['leg_extension', 3, 10, 15], ['seated_leg_curl', 3, 10, 15], ['standing_calf', 4, 12, 20], ['cable_crunch', 3, 12, 15], ['knee_raise', 3, 10, 15]] },
  pushB: { name: 'Push B', focus: 'Pectoraux · Épaules · Triceps', ex: [['db_bench', 3, 8, 12], ['incline_machine_press', 3, 8, 12], ['cable_fly', 2, 12, 15], ['cable_lateral', 4, 12, 20], ['db_shoulder_press', 2, 8, 12], ['cable_tri_ext', 3, 10, 15]] },
  pullB: { name: 'Pull B', focus: 'Dos · Arrière d’épaules · Biceps', ex: [['neutral_pulldown', 3, 8, 12], ['single_arm_cable_row', 3, 10, 12], ['high_row', 3, 8, 12], ['face_pull', 3, 12, 20], ['incline_curl', 3, 10, 12], ['hammer_curl', 2, 10, 15]] },
  legsB: { name: 'Legs B + abdos', focus: 'Quadriceps · Fessiers · Ischios · Abdos', abs: true, ex: [['leg_press', 3, 10, 12], ['bulgarian', 3, 8, 10], ['hip_thrust', 3, 8, 12], ['lying_leg_curl', 3, 10, 15], ['seated_calf', 4, 12, 20], ['crunch', 3, 15, 20], ['plank', 3, 45, 60]] },
};
T.TPL_ORDER = ['pushA', 'pullA', 'legsA', 'pushB', 'pullB', 'legsB'];

/* Index = getDay() : 0 dimanche … 6 samedi */
T.DEFAULT_SCHEDULE = ['legsB', 'pushA', 'pullA', 'legsA', 'rest', 'pushB', 'pullB'];
T.DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
T.DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

T.LEVELS = [
  [0, 'Initiation'], [400, 'Discipline'], [1100, 'Régularité'], [2300, 'Consistance'], [4000, 'Détermination'],
  [6500, 'Performance'], [10000, 'Maîtrise'], [14500, 'Élite'], [20000, 'Athlète'], [27000, 'Référence'],
];

T.CARDIO_TYPES = [['walk', 'Marche'], ['run', 'Course'], ['bike', 'Vélo'], ['swim', 'Natation'], ['incline', 'Tapis incliné'], ['other', 'Autre']];
T.MEALS = [['breakfast', 'Petit-déjeuner'], ['lunch', 'Déjeuner'], ['snack', 'Collation'], ['dinner', 'Dîner']];

/* Missions hebdomadaires : progression calculée à partir des données de la semaine. */
T.MISSIONS = {
  sessions4: { label: 'Effectuer 4 séances', target: 4, xp: 60, unit: 'séances' },
  ppl6: { label: 'Boucler les 6 séances du PPL', target: 6, xp: 120, unit: 'séances' },
  steps70k: { label: 'Cumuler 70 000 pas', target: 70000, xp: 60, unit: 'pas' },
  abs2: { label: 'Réaliser 2 séances avec abdos', target: 2, xp: 40, unit: 'séances' },
  food5: { label: 'Enregistrer 5 jours de nutrition', target: 5, xp: 50, unit: 'jours' },
  protein5: { label: 'Atteindre les protéines 5 jours', target: 5, xp: 60, unit: 'jours' },
  pr2: { label: 'Battre 2 records personnels', target: 2, xp: 60, unit: 'records' },
  cardio2: { label: 'Faire 2 séances de cardio', target: 2, xp: 50, unit: 'séances' },
  weigh3: { label: 'Te peser 3 fois', target: 3, xp: 30, unit: 'pesées' },
  water5: { label: 'Atteindre l’hydratation 5 jours', target: 5, xp: 40, unit: 'jours' },
  checkin5: { label: 'Faire 5 check-ins', target: 5, xp: 30, unit: 'check-ins' },
};

T.DEFAULT_REMINDERS = [
  { id: 'workout', label: 'Séance du jour', time: '17:30', on: true },
  { id: 'water', label: 'Hydratation (si objectif non atteint)', time: '15:00', on: true },
  { id: 'weigh', label: 'Pesée du matin', time: '08:00', on: false },
  { id: 'checkin', label: 'Check-in quotidien', time: '21:00', on: true },
  { id: 'prep', label: 'Préparer le sac de sport', time: '12:30', on: false },
  { id: 'sleep', label: 'Aller dormir', time: '23:00', on: false },
];

T.defaultSettings = () => ({
  name: '', sex: 'H', age: 21, height: 174, startWeight: 74,
  goals: { steps: 10000, kcal: 2200, protein: 150, water: 2500, sleep: 7.5 },
  rest: { c: 150, i: 90, a: 75 },
  schedule: T.DEFAULT_SCHEDULE.slice(),
  mobilityDays: [4],
  supplements: '',
  cardioGoal: 2,
  reminders: T.DEFAULT_REMINDERS.map(r => ({ ...r })),
  theme: 'dark',
  startDate: null,
});
