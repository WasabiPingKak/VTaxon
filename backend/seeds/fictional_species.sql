-- ============================================================
-- Fictional Species Seed Data
-- Run this in Supabase SQL Editor after init.sql
-- ============================================================

-- === Eastern Mythology ===

-- Japanese Mythology
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Dragon (Eastern)', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Dragon', 'Japanese dragon (Ryū), associated with water and weather'),
('Kitsune', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Kitsune', 'Fox spirit with shapeshifting abilities'),
('Tanuki', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Tanuki', 'Raccoon dog spirit known for mischief'),
('Oni', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Oni', 'Demon or ogre from Japanese folklore'),
('Tengu', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Tengu', 'Bird-like supernatural being'),
('Nekomata', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Nekomata', 'Fork-tailed cat spirit'),
('Kappa', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Kappa', 'Water spirit resembling a turtle-like creature'),
('Bakeneko', 'Eastern Mythology', 'Japanese Mythology', 'Eastern Mythology|Japanese Mythology|Bakeneko', 'Supernatural cat with shapeshifting powers');

-- Chinese Mythology
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Dragon (Chinese)', 'Eastern Mythology', 'Chinese Mythology', 'Eastern Mythology|Chinese Mythology|Dragon', 'Chinese long dragon, symbol of power and good fortune'),
('Phoenix (Fenghuang)', 'Eastern Mythology', 'Chinese Mythology', 'Eastern Mythology|Chinese Mythology|Phoenix', 'Fenghuang, king of birds'),
('Qilin', 'Eastern Mythology', 'Chinese Mythology', 'Eastern Mythology|Chinese Mythology|Qilin', 'Auspicious chimeric beast'),
('Jiangshi', 'Eastern Mythology', 'Chinese Mythology', 'Eastern Mythology|Chinese Mythology|Jiangshi', 'Reanimated corpse that hops'),
('Pixiu', 'Eastern Mythology', 'Chinese Mythology', 'Eastern Mythology|Chinese Mythology|Pixiu', 'Winged lion creature that attracts wealth');

-- === Western Mythology ===

-- Greek Mythology
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Phoenix (Western)', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Phoenix', 'Firebird that is reborn from ashes'),
('Centaur', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Centaur', 'Half-human, half-horse creature'),
('Minotaur', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Minotaur', 'Bull-headed humanoid'),
('Harpy', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Harpy', 'Wind spirit with bird body and human face'),
('Siren', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Siren', 'Enchanting sea creature with alluring voice'),
('Cerberus', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Cerberus', 'Three-headed dog guarding the underworld'),
('Medusa', 'Western Mythology', 'Greek Mythology', 'Western Mythology|Greek Mythology|Medusa', 'Snake-haired gorgon');

-- Norse Mythology
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Dragon (Norse)', 'Western Mythology', 'Norse Mythology', 'Western Mythology|Norse Mythology|Dragon', 'Norse dragon like Níðhöggr'),
('Elf (Norse)', 'Western Mythology', 'Norse Mythology', 'Western Mythology|Norse Mythology|Elf', 'Light or dark elf from Norse mythology'),
('Dwarf (Norse)', 'Western Mythology', 'Norse Mythology', 'Western Mythology|Norse Mythology|Dwarf', 'Master craftsmen of Norse legend'),
('Fenrir', 'Western Mythology', 'Norse Mythology', 'Western Mythology|Norse Mythology|Fenrir', 'Monstrous wolf'),
('Valkyrie', 'Western Mythology', 'Norse Mythology', 'Western Mythology|Norse Mythology|Valkyrie', 'Chooser of the slain, divine warrior maiden');

-- European Folklore
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Dragon (Western)', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Dragon', 'Fire-breathing winged dragon'),
('Vampire', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Vampire', 'Undead creature that feeds on blood'),
('Werewolf', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Werewolf', 'Human that transforms into a wolf'),
('Fairy', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Fairy', 'Small magical winged being'),
('Unicorn', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Unicorn', 'Horse with a single spiraling horn'),
('Griffin', 'Western Mythology', 'European Folklore', 'Western Mythology|European Folklore|Griffin', 'Lion body with eagle head and wings');

-- === Fantasy/Modern ===
INSERT INTO fictional_species (name, origin, sub_origin, category_path, description) VALUES
('Angel', 'Fantasy', 'General', 'Fantasy|General|Angel', 'Divine winged celestial being'),
('Demon (Fantasy)', 'Fantasy', 'General', 'Fantasy|General|Demon', 'Dark supernatural entity'),
('Slime', 'Fantasy', 'General', 'Fantasy|General|Slime', 'Amorphous gelatinous creature'),
('Succubus', 'Fantasy', 'General', 'Fantasy|General|Succubus', 'Seductive demonic entity'),
('Lich', 'Fantasy', 'General', 'Fantasy|General|Lich', 'Undead sorcerer'),
('Golem', 'Fantasy', 'General', 'Fantasy|General|Golem', 'Animated construct'),
('Mermaid', 'Fantasy', 'General', 'Fantasy|General|Mermaid', 'Half-human, half-fish aquatic being'),
('Elf (Fantasy)', 'Fantasy', 'General', 'Fantasy|General|Elf', 'Pointy-eared magical humanoid');
