-- ============================================================
-- 清理已移除的虛構物種：數據生命、量子生命、虛擬存在、突變體
-- 執行順序：先刪 traits（FK 依賴），再刪 species，最後刪孤立測試用戶
-- ============================================================

-- 1. 刪除關聯的 vtuber_traits
DELETE FROM vtuber_traits
WHERE fictional_species_id IN (
  SELECT id FROM fictional_species
  WHERE name IN ('Digital Life', 'Virtual Being', 'Quantum Entity', 'Mutant')
);

-- 2. 刪除 fictional_species 本體
DELETE FROM fictional_species
WHERE name IN ('Digital Life', 'Virtual Being', 'Quantum Entity', 'Mutant');

-- 3. 刪除對應的孤立測試用戶（數據精靈、虛擬偶像、量子貓）
--    這些用戶只有被刪除的 trait，刪除後不再有任何關聯
DELETE FROM users
WHERE id IN (
  '00000000-7e57-f009-0000-000000000003',
  '00000000-7e57-f009-0000-000000000004',
  '00000000-7e57-f009-0000-000000000005'
);
