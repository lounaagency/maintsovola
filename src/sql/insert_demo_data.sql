
-- Script de génération de données de démonstration pour Maintsovola
-- 100 projets agricoles avec données complètes
-- Mot de passe uniforme: test$619
-- Régions privilégiées: Menabe, Antsimo Andrefana et Sofia

-- Réinitialiser les séquences si nécessaire
ALTER SEQUENCE terrain_id_terrain_seq RESTART WITH 1000;
ALTER SEQUENCE projet_id_projet_seq RESTART WITH 1000;
ALTER SEQUENCE investissement_id_investissement_seq RESTART WITH 1000;
ALTER SEQUENCE message_id_message_seq RESTART WITH 1000;
ALTER SEQUENCE commentaire_id_commentaire_seq RESTART WITH 1000;
ALTER SEQUENCE conversation_id_conversation_seq RESTART WITH 1000;

-- 1. Insertion des utilisateurs
-- 50 agriculteurs (id_role = 1)
INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, id_role, photo_profil, photo_couverture)
VALUES
  ('farmer1', 'Rakoto', 'Jean', 'rakoto.jean@example.com', 1, 'https://i.pravatar.cc/150?img=1', 'https://picsum.photos/800/200?random=1'),
  ('farmer2', 'Rabe', 'Marie', 'rabe.marie@example.com', 1, 'https://i.pravatar.cc/150?img=2', 'https://picsum.photos/800/200?random=2'),
  ('farmer3', 'Rabemananjara', 'Hery', 'rabemananjara.hery@example.com', 1, 'https://i.pravatar.cc/150?img=3', 'https://picsum.photos/800/200?random=3'),
  ('farmer4', 'Razanadrakoto', 'Soa', 'razanadrakoto.soa@example.com', 1, 'https://i.pravatar.cc/150?img=4', 'https://picsum.photos/800/200?random=4'),
  ('farmer5', 'Rafaralahy', 'Patrick', 'rafaralahy.patrick@example.com', 1, 'https://i.pravatar.cc/150?img=5', 'https://picsum.photos/800/200?random=5'),
  ('farmer6', 'Rakotonirina', 'Hanitra', 'rakotonirina.hanitra@example.com', 1, 'https://i.pravatar.cc/150?img=6', 'https://picsum.photos/800/200?random=6'),
  ('farmer7', 'Andrianaivo', 'Michel', 'andrianaivo.michel@example.com', 1, 'https://i.pravatar.cc/150?img=7', 'https://picsum.photos/800/200?random=7'),
  ('farmer8', 'Rasoamanarivo', 'Lalao', 'rasoamanarivo.lalao@example.com', 1, 'https://i.pravatar.cc/150?img=8', 'https://picsum.photos/800/200?random=8'),
  ('farmer9', 'Razafindrakoto', 'Mamy', 'razafindrakoto.mamy@example.com', 1, 'https://i.pravatar.cc/150?img=9', 'https://picsum.photos/800/200?random=9'),
  ('farmer10', 'Andriamahefa', 'Paul', 'andriamahefa.paul@example.com', 1, 'https://i.pravatar.cc/150?img=10', 'https://picsum.photos/800/200?random=10'),
  ('farmer11', 'Rakotondrabe', 'Aimé', 'rakotondrabe.aime@example.com', 1, 'https://i.pravatar.cc/150?img=11', 'https://picsum.photos/800/200?random=11'),
  ('farmer12', 'Randriamanana', 'Voahangy', 'randriamanana.voahangy@example.com', 1, 'https://i.pravatar.cc/150?img=12', 'https://picsum.photos/800/200?random=12'),
  ('farmer13', 'Razafindratsima', 'Toky', 'razafindratsima.toky@example.com', 1, 'https://i.pravatar.cc/150?img=13', 'https://picsum.photos/800/200?random=13'),
  ('farmer14', 'Rakotoarison', 'Hanta', 'rakotoarison.hanta@example.com', 1, 'https://i.pravatar.cc/150?img=14', 'https://picsum.photos/800/200?random=14'),
  ('farmer15', 'Raharison', 'Misa', 'raharison.misa@example.com', 1, 'https://i.pravatar.cc/150?img=15', 'https://picsum.photos/800/200?random=15'),
  ('farmer16', 'Andriantsoa', 'Diary', 'andriantsoa.diary@example.com', 1, 'https://i.pravatar.cc/150?img=16', 'https://picsum.photos/800/200?random=16'),
  ('farmer17', 'Rajaonarison', 'Liva', 'rajaonarison.liva@example.com', 1, 'https://i.pravatar.cc/150?img=17', 'https://picsum.photos/800/200?random=17'),
  ('farmer18', 'Rasoanirina', 'Fanja', 'rasoanirina.fanja@example.com', 1, 'https://i.pravatar.cc/150?img=18', 'https://picsum.photos/800/200?random=18'),
  ('farmer19', 'Rakotomalala', 'Njaka', 'rakotomalala.njaka@example.com', 1, 'https://i.pravatar.cc/150?img=19', 'https://picsum.photos/800/200?random=19'),
  ('farmer20', 'Randrianarivony', 'Sahondra', 'randrianarivony.sahondra@example.com', 1, 'https://i.pravatar.cc/150?img=20', 'https://picsum.photos/800/200?random=20'),
  ('farmer21', 'Ranaivo', 'Zo', 'ranaivo.zo@example.com', 1, 'https://i.pravatar.cc/150?img=21', 'https://picsum.photos/800/200?random=21'),
  ('farmer22', 'Andriamampionona', 'Tiana', 'andriamampionona.tiana@example.com', 1, 'https://i.pravatar.cc/150?img=22', 'https://picsum.photos/800/200?random=22'),
  ('farmer23', 'Rafanomezana', 'Mamitiana', 'rafanomezana.mamitiana@example.com', 1, 'https://i.pravatar.cc/150?img=23', 'https://picsum.photos/800/200?random=23'),
  ('farmer24', 'Andriamaro', 'Fetra', 'andriamaro.fetra@example.com', 1, 'https://i.pravatar.cc/150?img=24', 'https://picsum.photos/800/200?random=24'),
  ('farmer25', 'Randriamihaingo', 'Nirina', 'randriamihaingo.nirina@example.com', 1, 'https://i.pravatar.cc/150?img=25', 'https://picsum.photos/800/200?random=25'),
  ('farmer26', 'Ramaroson', 'Mialy', 'ramaroson.mialy@example.com', 1, 'https://i.pravatar.cc/150?img=26', 'https://picsum.photos/800/200?random=26'),
  ('farmer27', 'Razafimahatratra', 'Olivier', 'razafimahatratra.olivier@example.com', 1, 'https://i.pravatar.cc/150?img=27', 'https://picsum.photos/800/200?random=27'),
  ('farmer28', 'Rasolonjatovo', 'Andry', 'rasolonjatovo.andry@example.com', 1, 'https://i.pravatar.cc/150?img=28', 'https://picsum.photos/800/200?random=28'),
  ('farmer29', 'Rakotovao', 'Haingotiana', 'rakotovao.haingotiana@example.com', 1, 'https://i.pravatar.cc/150?img=29', 'https://picsum.photos/800/200?random=29'),
  ('farmer30', 'Rabarison', 'Manitra', 'rabarison.manitra@example.com', 1, 'https://i.pravatar.cc/150?img=30', 'https://picsum.photos/800/200?random=30'),
  ('farmer31', 'Andrianjaka', 'Henintsoa', 'andrianjaka.henintsoa@example.com', 1, 'https://i.pravatar.cc/150?img=31', 'https://picsum.photos/800/200?random=31'),
  ('farmer32', 'Rakotonomenjanahary', 'Feno', 'rakotonomenjanahary.feno@example.com', 1, 'https://i.pravatar.cc/150?img=32', 'https://picsum.photos/800/200?random=32'),
  ('farmer33', 'Ravoajanahary', 'Rado', 'ravoajanahary.rado@example.com', 1, 'https://i.pravatar.cc/150?img=33', 'https://picsum.photos/800/200?random=33'),
  ('farmer34', 'Randrianirina', 'Hasina', 'randrianirina.hasina@example.com', 1, 'https://i.pravatar.cc/150?img=34', 'https://picsum.photos/800/200?random=34'),
  ('farmer35', 'Ravololona', 'Lalatiana', 'ravololona.lalatiana@example.com', 1, 'https://i.pravatar.cc/150?img=35', 'https://picsum.photos/800/200?random=35'),
  ('farmer36', 'Rafidinarivo', 'Seheno', 'rafidinarivo.seheno@example.com', 1, 'https://i.pravatar.cc/150?img=36', 'https://picsum.photos/800/200?random=36'),
  ('farmer37', 'Ramarson', 'Lanto', 'ramarson.lanto@example.com', 1, 'https://i.pravatar.cc/150?img=37', 'https://picsum.photos/800/200?random=37'),
  ('farmer38', 'Randriambololona', 'Ny Aina', 'randriambololona.nyaina@example.com', 1, 'https://i.pravatar.cc/150?img=38', 'https://picsum.photos/800/200?random=38'),
  ('farmer39', 'Rakotondrasoa', 'Tahina', 'rakotondrasoa.tahina@example.com', 1, 'https://i.pravatar.cc/150?img=39', 'https://picsum.photos/800/200?random=39'),
  ('farmer40', 'Ramanantsoa', 'Mino', 'ramanantsoa.mino@example.com', 1, 'https://i.pravatar.cc/150?img=40', 'https://picsum.photos/800/200?random=40'),
  ('farmer41', 'Randrianasolo', 'Naly', 'randrianasolo.naly@example.com', 1, 'https://i.pravatar.cc/150?img=41', 'https://picsum.photos/800/200?random=41'),
  ('farmer42', 'Andriamihaja', 'Dina', 'andriamihaja.dina@example.com', 1, 'https://i.pravatar.cc/150?img=42', 'https://picsum.photos/800/200?random=42'),
  ('farmer43', 'Raharisoa', 'Mihaja', 'raharisoa.mihaja@example.com', 1, 'https://i.pravatar.cc/150?img=43', 'https://picsum.photos/800/200?random=43'),
  ('farmer44', 'Randriamanantena', 'Rojo', 'randriamanantena.rojo@example.com', 1, 'https://i.pravatar.cc/150?img=44', 'https://picsum.photos/800/200?random=44'),
  ('farmer45', 'Rajaonarivelo', 'Noro', 'rajaonarivelo.noro@example.com', 1, 'https://i.pravatar.cc/150?img=45', 'https://picsum.photos/800/200?random=45'),
  ('farmer46', 'Rakotoarimanana', 'Tantely', 'rakotoarimanana.tantely@example.com', 1, 'https://i.pravatar.cc/150?img=46', 'https://picsum.photos/800/200?random=46'),
  ('farmer47', 'Ravonimanantsoa', 'Tsilavina', 'ravonimanantsoa.tsilavina@example.com', 1, 'https://i.pravatar.cc/150?img=47', 'https://picsum.photos/800/200?random=47'),
  ('farmer48', 'Razafimbelo', 'Nomena', 'razafimbelo.nomena@example.com', 1, 'https://i.pravatar.cc/150?img=48', 'https://picsum.photos/800/200?random=48'),
  ('farmer49', 'Andrianjafy', 'Solo', 'andrianjafy.solo@example.com', 1, 'https://i.pravatar.cc/150?img=49', 'https://picsum.photos/800/200?random=49'),
  ('farmer50', 'Rakotomanana', 'Haja', 'rakotomanana.haja@example.com', 1, 'https://i.pravatar.cc/150?img=50', 'https://picsum.photos/800/200?random=50');

-- 15 techniciens (id_role = 2)  
INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, id_role, photo_profil, photo_couverture)
VALUES
  ('tech1', 'Rasolofo', 'Eric', 'rasolofo.eric@example.com', 2, 'https://i.pravatar.cc/150?img=51', 'https://picsum.photos/800/200?random=51'),
  ('tech2', 'Razafimaharo', 'Julie', 'razafimaharo.julie@example.com', 2, 'https://i.pravatar.cc/150?img=52', 'https://picsum.photos/800/200?random=52'),
  ('tech3', 'Randriatiana', 'Fidy', 'randriatiana.fidy@example.com', 2, 'https://i.pravatar.cc/150?img=53', 'https://picsum.photos/800/200?random=53'),
  ('tech4', 'Rakotozafy', 'Miarisoa', 'rakotozafy.miarisoa@example.com', 2, 'https://i.pravatar.cc/150?img=54', 'https://picsum.photos/800/200?random=54'),
  ('tech5', 'Rasoanandrasana', 'Thierry', 'rasoanandrasana.thierry@example.com', 2, 'https://i.pravatar.cc/150?img=55', 'https://picsum.photos/800/200?random=55'),
  ('tech6', 'Ranaivoson', 'Volatiana', 'ranaivoson.volatiana@example.com', 2, 'https://i.pravatar.cc/150?img=56', 'https://picsum.photos/800/200?random=56'),
  ('tech7', 'Rakotonanahary', 'Justin', 'rakotonanahary.justin@example.com', 2, 'https://i.pravatar.cc/150?img=57', 'https://picsum.photos/800/200?random=57'),
  ('tech8', 'Rabeharisoa', 'Jenny', 'rabeharisoa.jenny@example.com', 2, 'https://i.pravatar.cc/150?img=58', 'https://picsum.photos/800/200?random=58'),
  ('tech9', 'Andriatsiferana', 'Manda', 'andriatsiferana.manda@example.com', 2, 'https://i.pravatar.cc/150?img=59', 'https://picsum.photos/800/200?random=59'),
  ('tech10', 'Ranaivomanana', 'Prisca', 'ranaivomanana.prisca@example.com', 2, 'https://i.pravatar.cc/150?img=60', 'https://picsum.photos/800/200?random=60'),
  ('tech11', 'Ranaivosoa', 'Ando', 'ranaivosoa.ando@example.com', 2, 'https://i.pravatar.cc/150?img=61', 'https://picsum.photos/800/200?random=61'),
  ('tech12', 'Razakamahefa', 'Onja', 'razakamahefa.onja@example.com', 2, 'https://i.pravatar.cc/150?img=62', 'https://picsum.photos/800/200?random=62'),
  ('tech13', 'Ralambomanana', 'Tojo', 'ralambomanana.tojo@example.com', 2, 'https://i.pravatar.cc/150?img=63', 'https://picsum.photos/800/200?random=63'),
  ('tech14', 'Rambeloson', 'Mahery', 'rambeloson.mahery@example.com', 2, 'https://i.pravatar.cc/150?img=64', 'https://picsum.photos/800/200?random=64'),
  ('tech15', 'Randrianarisoa', 'Naivo', 'randrianarisoa.naivo@example.com', 2, 'https://i.pravatar.cc/150?img=65', 'https://picsum.photos/800/200?random=65');

-- 10 superviseurs (id_role = 3)
INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, id_role, photo_profil, photo_couverture)
VALUES
  ('sup1', 'Rakotomanga', 'Andry', 'rakotomanga.andry@example.com', 3, 'https://i.pravatar.cc/150?img=66', 'https://picsum.photos/800/200?random=66'),
  ('sup2', 'Andrianomenjanahary', 'Clara', 'andrianomenjanahary.clara@example.com', 3, 'https://i.pravatar.cc/150?img=67', 'https://picsum.photos/800/200?random=67'),
  ('sup3', 'Randriamampianina', 'Bruno', 'randriamampianina.bruno@example.com', 3, 'https://i.pravatar.cc/150?img=68', 'https://picsum.photos/800/200?random=68'),
  ('sup4', 'Razafimandimby', 'Vonjy', 'razafimandimby.vonjy@example.com', 3, 'https://i.pravatar.cc/150?img=69', 'https://picsum.photos/800/200?random=69'),
  ('sup5', 'Raharimanana', 'Tovo', 'raharimanana.tovo@example.com', 3, 'https://i.pravatar.cc/150?img=70', 'https://picsum.photos/800/200?random=70'),
  ('sup6', 'Rabenantenaina', 'Vero', 'rabenantenaina.vero@example.com', 3, 'https://i.pravatar.cc/150?img=71', 'https://picsum.photos/800/200?random=71'),
  ('sup7', 'Rakotovao', 'Diamondra', 'rakotovao.diamondra@example.com', 3, 'https://i.pravatar.cc/150?img=72', 'https://picsum.photos/800/200?random=72'),
  ('sup8', 'Andrianiaina', 'José', 'andrianiaina.jose@example.com', 3, 'https://i.pravatar.cc/150?img=73', 'https://picsum.photos/800/200?random=73'),
  ('sup9', 'Rahantanirina', 'Ony', 'rahantanirina.ony@example.com', 3, 'https://i.pravatar.cc/150?img=74', 'https://picsum.photos/800/200?random=74'),
  ('sup10', 'Rajaonarivony', 'Hary', 'rajaonarivony.hary@example.com', 3, 'https://i.pravatar.cc/150?img=75', 'https://picsum.photos/800/200?random=75');

-- 20 investisseurs (id_role = 4) 
INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, id_role, photo_profil, photo_couverture)
VALUES
  ('inv1', 'Andriamanantsoa', 'Georges', 'andriamanantsoa.georges@example.com', 4, 'https://i.pravatar.cc/150?img=76', 'https://picsum.photos/800/200?random=76'),
  ('inv2', 'Razakamanana', 'Soafara', 'razakamanana.soafara@example.com', 4, 'https://i.pravatar.cc/150?img=77', 'https://picsum.photos/800/200?random=77'),
  ('inv3', 'Ramananandro', 'Haja', 'ramananandro.haja@example.com', 4, 'https://i.pravatar.cc/150?img=78', 'https://picsum.photos/800/200?random=78'),
  ('inv4', 'Rasamoelina', 'Emma', 'rasamoelina.emma@example.com', 4, 'https://i.pravatar.cc/150?img=79', 'https://picsum.photos/800/200?random=79'),
  ('inv5', 'Randriamanampisoa', 'Rindra', 'randriamanampisoa.rindra@example.com', 4, 'https://i.pravatar.cc/150?img=80', 'https://picsum.photos/800/200?random=80'),
  ('inv6', 'Rainivoandriananja', 'Tsiry', 'rainivoandriananja.tsiry@example.com', 4, 'https://i.pravatar.cc/150?img=81', 'https://picsum.photos/800/200?random=81'),
  ('inv7', 'Andriamanantena', 'Fitia', 'andriamanantena.fitia@example.com', 4, 'https://i.pravatar.cc/150?img=82', 'https://picsum.photos/800/200?random=82'),
  ('inv8', 'Randrianavalona', 'Hajaniaina', 'randrianavalona.hajaniaina@example.com', 4, 'https://i.pravatar.cc/150?img=83', 'https://picsum.photos/800/200?random=83'),
  ('inv9', 'Rakotozafy', 'Sedera', 'rakotozafy.sedera@example.com', 4, 'https://i.pravatar.cc/150?img=84', 'https://picsum.photos/800/200?random=84'),
  ('inv10', 'Razafindravoavy', 'Hoby', 'razafindravoavy.hoby@example.com', 4, 'https://i.pravatar.cc/150?img=85', 'https://picsum.photos/800/200?random=85'),
  ('inv11', 'Ramarolahy', 'Njiva', 'ramarolahy.njiva@example.com', 4, 'https://i.pravatar.cc/150?img=86', 'https://picsum.photos/800/200?random=86'),
  ('inv12', 'Rakotoniaina', 'Bako', 'rakotoniaina.bako@example.com', 4, 'https://i.pravatar.cc/150?img=87', 'https://picsum.photos/800/200?random=87'),
  ('inv13', 'Randriamanalina', 'Ndriana', 'randriamanalina.ndriana@example.com', 4, 'https://i.pravatar.cc/150?img=88', 'https://picsum.photos/800/200?random=88'),
  ('inv14', 'Razafimahefa', 'Nantenaina', 'razafimahefa.nantenaina@example.com', 4, 'https://i.pravatar.cc/150?img=89', 'https://picsum.photos/800/200?random=89'),
  ('inv15', 'Andriatsitoaina', 'Sarobidy', 'andriatsitoaina.sarobidy@example.com', 4, 'https://i.pravatar.cc/150?img=90', 'https://picsum.photos/800/200?random=90'),
  ('inv16', 'Rasoamahenina', 'Aline', 'rasoamahenina.aline@example.com', 4, 'https://i.pravatar.cc/150?img=91', 'https://picsum.photos/800/200?random=91'),
  ('inv17', 'Rabemanantsoa', 'Fy', 'rabemanantsoa.fy@example.com', 4, 'https://i.pravatar.cc/150?img=92', 'https://picsum.photos/800/200?random=92'),
  ('inv18', 'Randriambololontsoa', 'Liva', 'randriambololontsoa.liva@example.com', 4, 'https://i.pravatar.cc/150?img=93', 'https://picsum.photos/800/200?random=93'),
  ('inv19', 'Rasoanirina', 'Tsanta', 'rasoanirina.tsanta@example.com', 4, 'https://i.pravatar.cc/150?img=94', 'https://picsum.photos/800/200?random=94'),
  ('inv20', 'Randrianandrasana', 'Mirindra', 'randrianandrasana.mirindra@example.com', 4, 'https://i.pravatar.cc/150?img=95', 'https://picsum.photos/800/200?random=95');

-- Insertion des numéros de téléphone (format 034 XX XXX XX)
-- Agriculteurs
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
SELECT 
  'farmer' || i, 
  '034' || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0') || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0') || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0'),
  'principal',
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  CASE WHEN RANDOM() > 0.7 THEN true ELSE false END
FROM generate_series(1, 50) i;

-- Techniciens
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
SELECT 
  'tech' || i, 
  '034' || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0') || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0') || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0'),
  'principal',
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  CASE WHEN RANDOM() > 0.7 THEN true ELSE false END
FROM generate_series(1, 15) i;

-- Superviseurs
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
SELECT 
  'sup' || i, 
  '034' || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0') || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0') || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0'),
  'principal',
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  CASE WHEN RANDOM() > 0.7 THEN true ELSE false END
FROM generate_series(1, 10) i;

-- Investisseurs
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
SELECT 
  'inv' || i, 
  '034' || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0') || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0') || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0'),
  'principal',
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  CASE WHEN RANDOM() > 0.7 THEN true ELSE false END
FROM generate_series(1, 20) i;

-- Ajouter un téléphone secondaire pour certains utilisateurs
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
SELECT 
  CASE 
    WHEN RANDOM() < 0.25 THEN 'farmer' || FLOOR(RANDOM() * 50 + 1)
    WHEN RANDOM() < 0.5 THEN 'tech' || FLOOR(RANDOM() * 15 + 1)
    WHEN RANDOM() < 0.75 THEN 'sup' || FLOOR(RANDOM() * 10 + 1)
    ELSE 'inv' || FLOOR(RANDOM() * 20 + 1)
  END,
  '034' || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0') || LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0') || LPAD(FLOOR(RANDOM() * 100)::text, 2, '0'),
  'mobile_banking',
  false,
  true
FROM generate_series(1, 30) i;

-- 2. Insertion de terrains
-- Région Menabe (id_region = 7)
INSERT INTO terrain (id_terrain, id_region, id_district, id_commune, nom_terrain, surface_proposee, surface_validee, acces_eau, acces_route, statut, id_tantsaha, id_technicien, id_superviseur, date_validation, photos, geom, created_at, rapport_validation)
SELECT 
  1000 + i, 
  7, -- Menabe
  CASE WHEN i % 3 = 0 THEN 36 WHEN i % 3 = 1 THEN 37 ELSE 38 END, -- Districts de Menabe
  CASE 
    WHEN i % 15 = 0 THEN 471 
    WHEN i % 15 = 1 THEN 472
    WHEN i % 15 = 2 THEN 473
    WHEN i % 15 = 3 THEN 474
    WHEN i % 15 = 4 THEN 475
    WHEN i % 15 = 5 THEN 476
    WHEN i % 15 = 6 THEN 477
    WHEN i % 15 = 7 THEN 478
    WHEN i % 15 = 8 THEN 479
    WHEN i % 15 = 9 THEN 480
    WHEN i % 15 = 10 THEN 481
    WHEN i % 15 = 11 THEN 482
    WHEN i % 15 = 12 THEN 483
    WHEN i % 15 = 13 THEN 484
    ELSE 485
  END,
  'Terrain Menabe-' || i,
  1 + (RANDOM() * 9), -- surface entre 1 et 10 ha
  CASE WHEN RANDOM() < 0.7 THEN 1 + (RANDOM() * 9) ELSE NULL END, -- surface validée pour certains terrains
  CASE WHEN RANDOM() < 0.6 THEN true ELSE false END, -- accès eau
  CASE WHEN RANDOM() < 0.5 THEN true ELSE false END, -- accès route
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END, -- statut (validé ou non)
  'farmer' || (1 + FLOOR(RANDOM() * 50)), -- agriculteur aléatoire
  CASE WHEN RANDOM() < 0.8 THEN 'tech' || (1 + FLOOR(RANDOM() * 15)) ELSE NULL END, -- technicien aléatoire ou NULL
  CASE WHEN RANDOM() < 0.6 THEN 'sup' || (1 + FLOOR(RANDOM() * 10)) ELSE NULL END, -- superviseur aléatoire ou NULL
  CASE WHEN RANDOM() < 0.7 THEN (CURRENT_DATE - (RANDOM() * 365)::integer) ELSE NULL END, -- date de validation pour certains terrains
  CASE WHEN RANDOM() < 0.9 THEN 'https://picsum.photos/800/600?random=' || i || ',https://picsum.photos/800/600?random=' || (i+100) ELSE NULL END, -- photos
  ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(44.' || (100 + i % 900) || ' -20.' || (i % 900) || ', 44.' || (100 + i % 900 + 0.01) || ' -20.' || (i % 900) || ', 44.' || (100 + i % 900 + 0.01) || ' -20.' || (i % 900 + 0.01) || ', 44.' || (100 + i % 900) || ' -20.' || (i % 900 + 0.01) || ', 44.' || (100 + i % 900) || ' -20.' || (i % 900) || ')')), 4326), -- géométrie
  NOW() - (RANDOM() * 500)::integer * '1 day'::interval, -- date de création
  CASE WHEN RANDOM() < 0.6 THEN 'Terrain validé après inspection. La surface est conforme et le terrain est adapté à l''agriculture.' ELSE NULL END -- rapport de validation
FROM generate_series(1, 50) i;

-- Région Antsimo Andrefana (id_region = 6)
INSERT INTO terrain (id_terrain, id_region, id_district, id_commune, nom_terrain, surface_proposee, surface_validee, acces_eau, acces_route, statut, id_tantsaha, id_technicien, id_superviseur, date_validation, photos, geom, created_at, rapport_validation)
SELECT 
  1050 + i, 
  6, -- Antsimo Andrefana
  CASE WHEN i % 5 = 0 THEN 29 WHEN i % 5 = 1 THEN 30 WHEN i % 5 = 2 THEN 31 WHEN i % 5 = 3 THEN 32 ELSE 33 END, -- Districts d'Antsimo Andrefana
  CASE 
    WHEN i % 10 = 0 THEN 391 
    WHEN i % 10 = 1 THEN 392
    WHEN i % 10 = 2 THEN 393
    WHEN i % 10 = 3 THEN 394
    WHEN i % 10 = 4 THEN 395
    WHEN i % 10 = 5 THEN 396
    WHEN i % 10 = 6 THEN 397
    WHEN i % 10 = 7 THEN 398
    WHEN i % 10 = 8 THEN 399
    ELSE 400
  END,
  'Terrain Andrefana-' || i,
  1 + (RANDOM() * 9), -- surface entre 1 et 10 ha
  CASE WHEN RANDOM() < 0.7 THEN 1 + (RANDOM() * 9) ELSE NULL END, -- surface validée pour certains terrains
  CASE WHEN RANDOM() < 0.4 THEN true ELSE false END, -- accès eau
  CASE WHEN RANDOM() < 0.6 THEN true ELSE false END, -- accès route
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END, -- statut (validé ou non)
  'farmer' || (1 + FLOOR(RANDOM() * 50)), -- agriculteur aléatoire
  CASE WHEN RANDOM() < 0.8 THEN 'tech' || (1 + FLOOR(RANDOM() * 15)) ELSE NULL END, -- technicien aléatoire ou NULL
  CASE WHEN RANDOM() < 0.6 THEN 'sup' || (1 + FLOOR(RANDOM() * 10)) ELSE NULL END, -- superviseur aléatoire ou NULL
  CASE WHEN RANDOM() < 0.7 THEN (CURRENT_DATE - (RANDOM() * 365)::integer) ELSE NULL END, -- date de validation pour certains terrains
  CASE WHEN RANDOM() < 0.9 THEN 'https://picsum.photos/800/600?random=' || (i+200) || ',https://picsum.photos/800/600?random=' || (i+300) ELSE NULL END, -- photos
  ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(43.' || (800 + i % 900) || ' -22.' || (300 + i % 900) || ', 43.' || (800 + i % 900 + 0.01) || ' -22.' || (300 + i % 900) || ', 43.' || (800 + i % 900 + 0.01) || ' -22.' || (300 + i % 900 + 0.01) || ', 43.' || (800 + i % 900) || ' -22.' || (300 + i % 900 + 0.01) || ', 43.' || (800 + i % 900) || ' -22.' || (300 + i % 900) || ')')), 4326), -- géométrie
  NOW() - (RANDOM() * 500)::integer * '1 day'::interval, -- date de création
  CASE WHEN RANDOM() < 0.6 THEN 'Terrain validé après contrôle. Le sol est fertile et propice à la culture. Accès limité à l''eau mais zone de pluie suffisante.' ELSE NULL END -- rapport de validation
FROM generate_series(1, 50) i;

-- Région Sofia (id_region = 4)
INSERT INTO terrain (id_terrain, id_region, id_district, id_commune, nom_terrain, surface_proposee, surface_validee, acces_eau, acces_route, statut, id_tantsaha, id_technicien, id_superviseur, date_validation, photos, geom, created_at, rapport_validation)
SELECT 
  1100 + i, 
  4, -- Sofia
  CASE WHEN i % 7 = 0 THEN 18 WHEN i % 7 = 1 THEN 19 WHEN i % 7 = 2 THEN 20 WHEN i % 7 = 3 THEN 21 WHEN i % 7 = 4 THEN 22 WHEN i % 7 = 5 THEN 23 ELSE 24 END, -- Districts de Sofia
  CASE 
    WHEN i % 10 = 0 THEN 191 
    WHEN i % 10 = 1 THEN 192
    WHEN i % 10 = 2 THEN 193
    WHEN i % 10 = 3 THEN 194
    WHEN i % 10 = 4 THEN 195
    WHEN i % 10 = 5 THEN 196
    WHEN i % 10 = 6 THEN 197
    WHEN i % 10 = 7 THEN 198
    WHEN i % 10 = 8 THEN 199
    ELSE 200
  END,
  'Terrain Sofia-' || i,
  1 + (RANDOM() * 9), -- surface entre 1 et 10 ha
  CASE WHEN RANDOM() < 0.7 THEN 1 + (RANDOM() * 9) ELSE NULL END, -- surface validée pour certains terrains
  CASE WHEN RANDOM() < 0.8 THEN true ELSE false END, -- accès eau
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END, -- accès route
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END, -- statut (validé ou non)
  'farmer' || (1 + FLOOR(RANDOM() * 50)), -- agriculteur aléatoire
  CASE WHEN RANDOM() < 0.8 THEN 'tech' || (1 + FLOOR(RANDOM() * 15)) ELSE NULL END, -- technicien aléatoire ou NULL
  CASE WHEN RANDOM() < 0.6 THEN 'sup' || (1 + FLOOR(RANDOM() * 10)) ELSE NULL END, -- superviseur aléatoire ou NULL
  CASE WHEN RANDOM() < 0.7 THEN (CURRENT_DATE - (RANDOM() * 365)::integer) ELSE NULL END, -- date de validation pour certains terrains
  CASE WHEN RANDOM() < 0.9 THEN 'https://picsum.photos/800/600?random=' || (i+400) || ',https://picsum.photos/800/600?random=' || (i+500) ELSE NULL END, -- photos
  ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(47.' || (i % 900) || ' -15.' || (i % 900) || ', 47.' || (i % 900 + 0.01) || ' -15.' || (i % 900) || ', 47.' || (i % 900 + 0.01) || ' -15.' || (i % 900 + 0.01) || ', 47.' || (i % 900) || ' -15.' || (i % 900 + 0.01) || ', 47.' || (i % 900) || ' -15.' || (i % 900) || ')')), 4326), -- géométrie
  NOW() - (RANDOM() * 500)::integer * '1 day'::interval, -- date de création
  CASE WHEN RANDOM() < 0.6 THEN 'Terrain validé. Bon emplacement, accès à l''eau disponible. Sol riche adapté à diverses cultures.' ELSE NULL END -- rapport de validation
FROM generate_series(1, 50) i;

-- 3. Insertion de projets agricoles
INSERT INTO projet (id_projet, id_terrain, id_tantsaha, id_region, id_district, id_commune, titre, description, surface_ha, statut, id_technicien, id_superviseur, photos, created_at, id_validateur, date_validation, rapport_validation, id_lanceur_production, date_debut_production)
WITH terrains_valides AS (
  SELECT 
    id_terrain, 
    id_tantsaha, 
    id_region, 
    id_district, 
    id_commune, 
    surface_validee, 
    COALESCE(surface_validee, surface_proposee) as surface_effective,
    id_technicien,
    id_superviseur
  FROM terrain 
  WHERE statut = true
  ORDER BY RANDOM()
  LIMIT 100
)
SELECT
  1000 + ROW_NUMBER() OVER (), -- id_projet
  t.id_terrain,
  t.id_tantsaha,
  t.id_region,
  t.id_district,
  t.id_commune,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Culture de riz à ' || (SELECT nom_commune FROM commune WHERE id_commune = t.id_commune LIMIT 1)
    WHEN RANDOM() < 0.5 THEN 'Projet de maïs et manioc'
    WHEN RANDOM() < 0.75 THEN 'Plantation d''arachides et haricots'
    ELSE 'Culture maraîchère diversifiée'
  END,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'Projet agricole visant à développer une production durable et rentable. L''objectif est d''améliorer la sécurité alimentaire locale tout en générant des revenus pour l''agriculteur.'
    WHEN RANDOM() < 0.66 THEN 'Développement d''une exploitation agricole moderne employant des techniques respectueuses de l''environnement. Ce projet cherche à maximiser les rendements tout en préservant la qualité des sols.'
    ELSE 'Culture mixte combinant plusieurs espèces pour optimiser l''utilisation du terrain et réduire les risques. Approche orientée vers une agriculture durable et économiquement viable.'
  END,
  t.surface_effective,
  CASE 
    WHEN ROW_NUMBER() OVER () % 10 = 0 THEN 'planifie'
    WHEN ROW_NUMBER() OVER () % 10 = 1 THEN 'valide'
    WHEN ROW_NUMBER() OVER () % 10 = 2 THEN 'rejete'
    WHEN ROW_NUMBER() OVER () % 10 = 3 THEN 'attente_financement'
    WHEN ROW_NUMBER() OVER () % 10 = 4 THEN 'finance'
    WHEN ROW_NUMBER() OVER () % 10 = 5 THEN 'en_cours'
    WHEN ROW_NUMBER() OVER () % 10 = 6 THEN 'en_cours'
    WHEN ROW_NUMBER() OVER () % 10 = 7 THEN 'en_pause'
    WHEN ROW_NUMBER() OVER () % 10 = 8 THEN 'termine'
    ELSE 'en_cours'
  END,
  t.id_technicien,
  t.id_superviseur,
  'https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER () + 600) || ',https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER () + 700),
  NOW() - (RANDOM() * 500)::integer * '1 day'::interval,
  CASE WHEN RANDOM() < 0.7 THEN 'sup' || (1 + FLOOR(RANDOM() * 10)) ELSE NULL END,
  CASE WHEN RANDOM() < 0.7 THEN (CURRENT_DATE - (RANDOM() * 300)::integer) ELSE NULL END,
  CASE WHEN RANDOM() < 0.7 THEN 'Projet validé après examen du dossier et visite sur site. Le projet est faisable et répond aux critères de rentabilité et de durabilité.' ELSE NULL END,
  CASE 
    WHEN ROW_NUMBER() OVER () % 10 IN (5, 6, 8, 9) THEN 'tech' || (1 + FLOOR(RANDOM() * 15)) 
    ELSE NULL 
  END,
  CASE 
    WHEN ROW_NUMBER() OVER () % 10 IN (5, 6, 8, 9) THEN (CURRENT_DATE - (RANDOM() * 200)::integer) 
    ELSE NULL 
  END
FROM terrains_valides t;

-- 4. Insertion des cultures pour les projets
INSERT INTO projet_culture (id_projet, id_culture, cout_exploitation_previsionnel, cout_exploitation_reel, rendement_previsionnel, rendement_reel, date_debut_previsionnelle, date_debut_reelle)
SELECT 
  p.id_projet,
  -- Attribution des cultures selon la région
  CASE 
    WHEN p.id_region = 7 THEN -- Menabe
      CASE 
        WHEN RANDOM() < 0.3 THEN 1 -- Riz
        WHEN RANDOM() < 0.6 THEN 2 -- Maïs
        WHEN RANDOM() < 0.9 THEN 3 -- Manioc
        ELSE 4 -- Café
      END
    WHEN p.id_region = 6 THEN -- Antsimo Andrefana
      CASE 
        WHEN RANDOM() < 0.3 THEN 5 -- Arachide
        WHEN RANDOM() < 0.6 THEN 6 -- Haricot blanc
        WHEN RANDOM() < 0.9 THEN 7 -- Pois bambara
        ELSE 3 -- Manioc
      END
    ELSE -- Sofia et autres
      CASE 
        WHEN RANDOM() < 0.4 THEN 1 -- Riz
        WHEN RANDOM() < 0.7 THEN 8 -- Autres cultures
        WHEN RANDOM() < 0.9 THEN 2 -- Maïs
        ELSE 4 -- Café
      END
  END,
  -- Coût d'exploitation prévisionnel
  ROUND((1000 + RANDOM() * 4000) * p.surface_ha),
  -- Coût réel (pour les projets terminés ou en cours avancés)
  CASE WHEN p.statut IN ('termine', 'en_cours') AND RANDOM() < 0.8 
    THEN ROUND((800 + RANDOM() * 5000) * p.surface_ha) 
    ELSE NULL 
  END,
  -- Rendement prévisionnel
  ROUND(RANDOM() * 8 + 2, 1),
  -- Rendement réel (pour certains projets terminés)
  CASE WHEN p.statut = 'termine' AND RANDOM() < 0.9 
    THEN ROUND(RANDOM() * 10 + 1, 1) 
    ELSE NULL 
  END,
  -- Date de début prévisionnelle
  COALESCE(p.date_validation, CURRENT_DATE) + (RANDOM() * 60 + 30)::integer,
  -- Date de début réelle (pour les projets en cours ou terminés)
  CASE WHEN p.statut IN ('en_cours', 'termine', 'en_pause') 
    THEN COALESCE(p.date_validation, CURRENT_DATE) + (RANDOM() * 90 + 20)::integer 
    ELSE NULL 
  END
FROM projet p
WHERE p.statut != 'rejete';

-- Certains projets ont plusieurs cultures
INSERT INTO projet_culture (id_projet, id_culture, cout_exploitation_previsionnel, cout_exploitation_reel, rendement_previsionnel, rendement_reel, date_debut_previsionnelle, date_debut_reelle)
SELECT 
  p.id_projet,
  -- Culture secondaire différente de la principale
  CASE 
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 1) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 2 ELSE 3 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 2) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 1 ELSE 6 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 3) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 5 ELSE 7 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 4) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 8 ELSE 1 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 5) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 6 ELSE 7 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 6) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 5 ELSE 2 END
    WHEN EXISTS (SELECT 1 FROM projet_culture pc WHERE pc.id_projet = p.id_projet AND pc.id_culture = 7) THEN 
      CASE WHEN RANDOM() < 0.5 THEN 5 ELSE 3 END
    ELSE 
      CASE WHEN RANDOM() < 0.5 THEN 1 ELSE 2 END
  END,
  -- Coût d'exploitation prévisionnel
  ROUND((500 + RANDOM() * 2000) * p.surface_ha),
  -- Coût réel (pour les projets terminés ou en cours avancés)
  CASE WHEN p.statut IN ('termine', 'en_cours') AND RANDOM() < 0.8 
    THEN ROUND((400 + RANDOM() * 2500) * p.surface_ha) 
    ELSE NULL 
  END,
  -- Rendement prévisionnel
  ROUND(RANDOM() * 5 + 1, 1),
  -- Rendement réel (pour certains projets terminés)
  CASE WHEN p.statut = 'termine' AND RANDOM() < 0.9 
    THEN ROUND(RANDOM() * 6 + 0.5, 1) 
    ELSE NULL 
  END,
  -- Date de début prévisionnelle
  COALESCE(p.date_validation, CURRENT_DATE) + (RANDOM() * 60 + 30)::integer,
  -- Date de début réelle (pour les projets en cours ou terminés)
  CASE WHEN p.statut IN ('en_cours', 'termine', 'en_pause') 
    THEN COALESCE(p.date_validation, CURRENT_DATE) + (RANDOM() * 90 + 20)::integer 
    ELSE NULL 
  END
FROM projet p
WHERE p.statut != 'rejete'
  AND RANDOM() < 0.4 -- 40% des projets ont une culture secondaire
  AND NOT EXISTS (
    SELECT 1 
    FROM projet_culture pc1 
    JOIN projet_culture pc2 ON pc1.id_projet = pc2.id_projet AND pc1.id_culture != pc2.id_culture
    WHERE pc1.id_projet = p.id_projet
  );

-- 5. Insertion des jalons pour les projets
INSERT INTO jalon_projet (id_projet, id_jalon_agricole, date_previsionnelle, date_reelle, rapport_jalon, photos_jalon, statut)
WITH culture_jalons AS (
  SELECT 
    pc.id_projet,
    ja.id_jalon_agricole,
    ja.delai_apres_lancement,
    p.statut as statut_projet,
    p.date_debut_production,
    pc.date_debut_reelle,
    ja.nom_jalon
  FROM projet_culture pc
  JOIN jalon_agricole ja ON pc.id_culture = ja.id_culture
  JOIN projet p ON pc.id_projet = p.id_projet
  WHERE p.statut != 'rejete'
)
SELECT
  cj.id_projet,
  cj.id_jalon_agricole,
  -- Date prévisionnelle = date début production + délai du jalon
  COALESCE(cj.date_debut_production, CURRENT_DATE) + cj.delai_apres_lancement,
  -- Date réelle (seulement pour certains jalons des projets en cours ou terminés)
  CASE 
    WHEN cj.statut_projet IN ('en_cours', 'termine') 
      AND cj.delai_apres_lancement < CASE WHEN cj.statut_projet = 'termine' THEN 10000 ELSE 60 END
      AND RANDOM() < 0.8
    THEN COALESCE(cj.date_debut_reelle, CURRENT_DATE) + cj.delai_apres_lancement + (RANDOM() * 10 - 5)::integer
    ELSE NULL
  END,
  -- Rapport (seulement pour les jalons réalisés)
  CASE
    WHEN cj.statut_projet IN ('en_cours', 'termine') 
      AND cj.delai_apres_lancement < CASE WHEN cj.statut_projet = 'termine' THEN 10000 ELSE 60 END
      AND RANDOM() < 0.8
    THEN 'Jalon ' || cj.nom_jalon || ' complété avec succès. ' || 
      CASE 
        WHEN RANDOM() < 0.3 THEN 'Les travaux ont été réalisés conformément au plan initial.'
        WHEN RANDOM() < 0.6 THEN 'Quelques ajustements ont été nécessaires mais le résultat est satisfaisant.'
        ELSE 'Les conditions météorologiques ont été favorables, ce qui a facilité les travaux.'
      END
    ELSE NULL
  END,
  -- Photos (seulement pour les jalons réalisés)
  CASE
    WHEN cj.statut_projet IN ('en_cours', 'termine') 
      AND cj.delai_apres_lancement < CASE WHEN cj.statut_projet = 'termine' THEN 10000 ELSE 60 END
      AND RANDOM() < 0.8
    THEN 'https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER() + 800) || ',https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER() + 900)
    ELSE NULL
  END,
  -- Statut du jalon
  CASE
    WHEN cj.statut_projet = 'termine' THEN 'Terminé'
    WHEN cj.statut_projet = 'en_cours' AND cj.delai_apres_lancement < 60 AND RANDOM() < 0.8 THEN 'Terminé'
    WHEN cj.statut_projet = 'en_cours' AND cj.delai_apres_lancement < 120 AND RANDOM() < 0.4 THEN 'En cours'
    WHEN cj.statut_projet = 'en_cours' AND cj.delai_apres_lancement >= 120 THEN 'Prévu'
    WHEN cj.statut_projet = 'finance' THEN 'Prévu'
    WHEN cj.statut_projet = 'attente_financement' THEN 'Prévu'
    WHEN cj.statut_projet = 'en_pause' AND cj.delai_apres_lancement < 60 AND RANDOM() < 0.5 THEN 'Terminé'
    WHEN cj.statut_projet = 'en_pause' THEN 'En pause'
    ELSE 'Prévu'
  END
FROM culture_jalons cj;

-- 6. Insertion des investissements
INSERT INTO investissement (id_investissement, id_projet, id_investisseur, montant, date_decision_investir, date_paiement, reference_paiement)
WITH projets_financement AS (
  SELECT 
    id_projet,
    surface_ha,
    statut,
    (
      SELECT COALESCE(SUM(cout_exploitation_previsionnel), 0)
      FROM projet_culture pc
      WHERE pc.id_projet = p.id_projet
    ) AS cout_total
  FROM projet p
  WHERE p.statut IN ('attente_financement', 'finance', 'en_cours', 'en_pause', 'termine')
)
SELECT
  1000 + ROW_NUMBER() OVER(),
  pf.id_projet,
  'inv' || (1 + floor(random() * 20)),
  -- Montant de l'investissement (en fonction du coût total et de la surface)
  CASE
    WHEN pf.statut IN ('finance', 'en_cours', 'termine') THEN
      -- Pour les projets financés, montants plus importants
      CASE
        WHEN RANDOM() < 0.3 THEN ROUND(pf.cout_total * 0.2 + RANDOM() * 500)
        WHEN RANDOM() < 0.6 THEN ROUND(pf.cout_total * 0.3 + RANDOM() * 1000)
        ELSE ROUND(pf.cout_total * 0.5 + RANDOM() * 2000)
      END
    ELSE
      -- Pour les projets en attente de financement, montants plus variables
      CASE
        WHEN RANDOM() < 0.4 THEN ROUND(pf.cout_total * 0.1 + RANDOM() * 300)
        WHEN RANDOM() < 0.7 THEN ROUND(pf.cout_total * 0.2 + RANDOM() * 500)
        ELSE ROUND(pf.cout_total * 0.3 + RANDOM() * 1000)
      END
  END,
  -- Date de décision d'investir
  CURRENT_DATE - (RANDOM() * 200)::integer,
  -- Date de paiement (un peu après la décision)
  CURRENT_DATE - (RANDOM() * 180)::integer,
  -- Référence de paiement
  'REF-' || LPAD(FLOOR(RANDOM() * 10000)::text, 5, '0') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 5, '0')
FROM projets_financement pf
WHERE RANDOM() < 0.9; -- 90% des projets éligibles reçoivent au moins un investissement

-- Ajout d'investissements supplémentaires pour certains projets
INSERT INTO investissement (id_investissement, id_projet, id_investisseur, montant, date_decision_investir, date_paiement, reference_paiement)
WITH projets_multi_investissement AS (
  SELECT 
    p.id_projet,
    p.surface_ha,
    p.statut,
    (
      SELECT COALESCE(SUM(cout_exploitation_previsionnel), 0)
      FROM projet_culture pc
      WHERE pc.id_projet = p.id_projet
    ) AS cout_total,
    (
      SELECT COUNT(*)
      FROM investissement i
      WHERE i.id_projet = p.id_projet
    ) AS nb_investissements
  FROM projet p
  WHERE p.statut IN ('finance', 'en_cours', 'en_pause', 'termine')
    AND EXISTS (SELECT 1 FROM investissement i WHERE i.id_projet = p.id_projet)
)
SELECT
  2000 + ROW_NUMBER() OVER(),
  pmi.id_projet,
  'inv' || (1 + floor(random() * 20)),
  -- Montant de l'investissement supplémentaire
  CASE
    WHEN RANDOM() < 0.3 THEN ROUND(pmi.cout_total * 0.15 + RANDOM() * 400)
    WHEN RANDOM() < 0.6 THEN ROUND(pmi.cout_total * 0.25 + RANDOM() * 800)
    ELSE ROUND(pmi.cout_total * 0.4 + RANDOM() * 1500)
  END,
  -- Date de décision d'investir
  CURRENT_DATE - (RANDOM() * 150)::integer,
  -- Date de paiement (un peu après la décision)
  CURRENT_DATE - (RANDOM() * 140)::integer,
  -- Référence de paiement
  'REF-' || LPAD(FLOOR(RANDOM() * 10000)::text, 5, '0') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 5, '0')
FROM projets_multi_investissement pmi
WHERE pmi.nb_investissements < 3 -- Limiter à 3 investissements max par projet
  AND RANDOM() < 0.6; -- 60% de chance d'avoir un investissement supplémentaire

-- 7. Insertion des "likes" sur les projets
INSERT INTO aimer_projet (id_projet, id_utilisateur)
WITH utilisateurs AS (
  SELECT id_utilisateur FROM utilisateur
),
projets AS (
  SELECT id_projet FROM projet
)
SELECT
  p.id_projet,
  u.id_utilisateur
FROM projets p
CROSS JOIN utilisateurs u
WHERE RANDOM() < 0.15 -- 15% des combinaisons possibles
  AND NOT EXISTS (
    SELECT 1 FROM aimer_projet ap 
    WHERE ap.id_projet = p.id_projet AND ap.id_utilisateur = u.id_utilisateur
  );

-- 8. Insertion des commentaires sur les projets
INSERT INTO commentaire (id_projet, id_utilisateur, contenu, date_creation)
WITH utilisateurs AS (
  SELECT id_utilisateur FROM utilisateur
),
projets AS (
  SELECT id_projet FROM projet
)
SELECT
  p.id_projet,
  u.id_utilisateur,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Projet très intéressant, j''aimerais en savoir plus sur les rendements attendus.'
    WHEN RANDOM() < 0.5 THEN 'Quelles cultures envisagez-vous pour la prochaine saison ?'
    WHEN RANDOM() < 0.75 THEN 'J''apprécie votre approche durable. Avez-vous envisagé d''ajouter des cultures supplémentaires ?'
    ELSE 'Félicitations pour ce beau projet ! Les résultats sont-ils conformes à vos attentes ?'
  END,
  NOW() - (RANDOM() * 90)::integer * '1 day'::interval
FROM projets p
CROSS JOIN utilisateurs u
WHERE RANDOM() < 0.05 -- 5% des combinaisons possibles
ORDER BY RANDOM()
LIMIT 200;

-- Ajout de réponses à certains commentaires
INSERT INTO commentaire (id_projet, id_utilisateur, id_parent_commentaire, contenu, date_creation)
SELECT
  c.id_projet,
  p.id_tantsaha, -- L'agriculteur répond généralement
  c.id_commentaire,
  CASE 
    WHEN RANDOM() < 0.33 THEN 'Merci pour votre intérêt ! Les rendements attendus sont d''environ 5 tonnes par hectare.'
    WHEN RANDOM() < 0.66 THEN 'Nous prévoyons de diversifier avec du maïs et des légumineuses pour la rotation des cultures.'
    ELSE 'Les résultats sont même au-delà de nos espérances. Nous sommes très satisfaits du développement du projet.'
  END,
  c.date_creation + (RANDOM() * 5)::integer * '1 day'::interval
FROM commentaire c
JOIN projet p ON c.id_projet = p.id_projet
WHERE c.id_parent_commentaire IS NULL
  AND RANDOM() < 0.4 -- 40% des commentaires reçoivent une réponse
LIMIT 80;

-- 9. Insertion des "likes" sur les commentaires
INSERT INTO aimer_commentaire (id_commentaire, id_utilisateur)
WITH utilisateurs AS (
  SELECT id_utilisateur FROM utilisateur
),
commentaires AS (
  SELECT id_commentaire FROM commentaire
)
SELECT
  c.id_commentaire,
  u.id_utilisateur
FROM commentaires c
CROSS JOIN utilisateurs u
WHERE RANDOM() < 0.03 -- 3% des combinaisons possibles
  AND NOT EXISTS (
    SELECT 1 FROM aimer_commentaire ac 
    WHERE ac.id_commentaire = c.id_commentaire AND ac.id_utilisateur = u.id_utilisateur
  )
LIMIT 300;

-- 10. Insertion des conversations
INSERT INTO conversation (id_conversation, id_utilisateur1, id_utilisateur2, derniere_activite, dernier_message)
WITH pairs AS (
  SELECT 
    CASE WHEN RANDOM() < 0.5 THEN a.id_utilisateur ELSE b.id_utilisateur END AS id_utilisateur1,
    CASE WHEN RANDOM() < 0.5 THEN b.id_utilisateur ELSE a.id_utilisateur END AS id_utilisateur2
  FROM 
    (SELECT id_utilisateur FROM utilisateur WHERE id_role = 1) a -- Agriculteurs
    CROSS JOIN 
    (SELECT id_utilisateur FROM utilisateur WHERE id_role IN (2, 3, 4)) b -- Techniciens, superviseurs, investisseurs
  WHERE a.id_utilisateur != b.id_utilisateur
  ORDER BY RANDOM()
  LIMIT 200
)
SELECT
  ROW_NUMBER() OVER() + 1000,
  p.id_utilisateur1,
  p.id_utilisateur2,
  NOW() - (RANDOM() * 60)::integer * '1 day'::interval,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Pouvez-vous me tenir informé des développements récents ?'
    WHEN RANDOM() < 0.5 THEN 'Merci pour ces informations, je vais les étudier.'
    WHEN RANDOM() < 0.75 THEN 'Quand pouvons-nous organiser une visite sur le terrain ?'
    ELSE 'Je vous enverrai les documents demandés d''ici demain.'
  END
FROM pairs p
WHERE NOT EXISTS (
  SELECT 1 FROM conversation c
  WHERE (c.id_utilisateur1 = p.id_utilisateur1 AND c.id_utilisateur2 = p.id_utilisateur2)
     OR (c.id_utilisateur1 = p.id_utilisateur2 AND c.id_utilisateur2 = p.id_utilisateur1)
);

-- 11. Insertion des messages
INSERT INTO message (id_conversation, id_expediteur, id_destinataire, contenu, date_envoi, lu)
WITH conversation_utilisateurs AS (
  SELECT 
    id_conversation, 
    id_utilisateur1, 
    id_utilisateur2,
    derniere_activite
  FROM conversation
)
SELECT
  cu.id_conversation,
  CASE WHEN RANDOM() < 0.5 THEN cu.id_utilisateur1 ELSE cu.id_utilisateur2 END,
  CASE WHEN RANDOM() < 0.5 THEN cu.id_utilisateur2 ELSE cu.id_utilisateur1 END,
  CASE 
    WHEN RANDOM() < 0.2 THEN 'Bonjour, j''aimerais avoir plus d''informations sur le projet agricole que vous menez actuellement.'
    WHEN RANDOM() < 0.4 THEN 'Nous avons analysé votre terrain et il présente un excellent potentiel pour la culture que vous envisagez.'
    WHEN RANDOM() < 0.6 THEN 'Je serais intéressé à investir dans votre projet. Pouvez-vous me fournir des détails sur les rendements attendus ?'
    WHEN RANDOM() < 0.8 THEN 'Les derniers résultats des analyses de sol sont très prometteurs. Nous pouvons commencer la plantation dès la semaine prochaine.'
    ELSE 'Merci pour votre soutien. Je vous tiendrai informé des développements du projet.'
  END,
  cu.derniere_activite - (RANDOM() * 20)::integer * '1 day'::interval,
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END
FROM conversation_utilisateurs cu
ORDER BY cu.id_conversation, RANDOM()
LIMIT 500;

-- 12. Insertion des notifications
INSERT INTO notification (id_expediteur, id_destinataire, titre, message, date_creation, entity_type, entity_id, type, lu)
WITH sources AS (
  SELECT 
    p.id_projet,
    p.id_tantsaha,
    p.id_technicien,
    p.id_superviseur,
    p.statut,
    i.id_investisseur
  FROM projet p
  LEFT JOIN investissement i ON p.id_projet = i.id_projet
)
SELECT
  -- Expéditeur (souvent système, technicien ou superviseur)
  CASE 
    WHEN RANDOM() < 0.5 THEN s.id_technicien
    WHEN RANDOM() < 0.8 THEN s.id_superviseur
    ELSE s.id_tantsaha
  END,
  -- Destinataire (dépend du type de notification)
  CASE 
    WHEN RANDOM() < 0.5 THEN s.id_tantsaha
    WHEN RANDOM() < 0.8 THEN s.id_investisseur
    ELSE s.id_technicien
  END,
  -- Titre
  CASE 
    WHEN s.statut = 'planifie' THEN 'Nouveau projet planifié'
    WHEN s.statut = 'valide' THEN 'Projet validé avec succès'
    WHEN s.statut = 'rejete' THEN 'Projet non approuvé'
    WHEN s.statut = 'attente_financement' THEN 'Projet en attente de financement'
    WHEN s.statut = 'finance' THEN 'Financement complété'
    WHEN s.statut = 'en_cours' THEN 'Mise à jour du projet'
    WHEN s.statut = 'en_pause' THEN 'Projet temporairement suspendu'
    ELSE 'Projet terminé avec succès'
  END,
  -- Message
  CASE 
    WHEN s.statut = 'planifie' THEN 'Un nouveau projet a été planifié et attend validation.'
    WHEN s.statut = 'valide' THEN 'Votre projet a été validé et peut maintenant passer à l''étape de financement.'
    WHEN s.statut = 'rejete' THEN 'Après examen, votre projet n''a pas été approuvé. Contactez votre technicien pour plus d''informations.'
    WHEN s.statut = 'attente_financement' THEN 'Votre projet est en attente de financement. Les investisseurs peuvent maintenant y contribuer.'
    WHEN s.statut = 'finance' THEN 'Félicitations ! Votre projet a atteint son objectif de financement et peut démarrer.'
    WHEN s.statut = 'en_cours' THEN 'Une mise à jour importante a été effectuée sur votre projet. Consultez les détails.'
    WHEN s.statut = 'en_pause' THEN 'Le projet a été temporairement suspendu. Contactez votre technicien pour plus d''informations.'
    ELSE 'Félicitations ! Votre projet est maintenant terminé avec succès.'
  END,
  -- Date de création
  NOW() - (RANDOM() * 90)::integer * '1 day'::interval,
  -- Type d'entité
  'projet',
  -- ID de l'entité
  s.id_projet,
  -- Type de notification
  CASE 
    WHEN s.statut IN ('rejete', 'en_pause') THEN 'warning'
    WHEN s.statut IN ('valide', 'finance', 'termine') THEN 'success'
    ELSE 'info'
  END,
  -- Lu
  CASE WHEN RANDOM() < 0.6 THEN true ELSE false END
FROM sources s
WHERE s.id_tantsaha IS NOT NULL
  AND s.id_technicien IS NOT NULL
  AND RANDOM() < 0.7
LIMIT 300;

-- Réinitialisation des séquences
SELECT setval('projet_id_projet_seq', (SELECT MAX(id_projet) FROM projet), true);
SELECT setval('terrain_id_terrain_seq', (SELECT MAX(id_terrain) FROM terrain), true);
SELECT setval('investissement_id_investissement_seq', (SELECT MAX(id_investissement) FROM investissement), true);
SELECT setval('commentaire_id_commentaire_seq', (SELECT MAX(id_commentaire) FROM commentaire), true);
SELECT setval('conversation_id_conversation_seq', (SELECT MAX(id_conversation) FROM conversation), true);
SELECT setval('message_id_message_seq', (SELECT MAX(id_message) FROM message), true);
