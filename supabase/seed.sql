-- =========================================================================
-- Seed de exemplo. É um RECORTE ilustrativo — o conjunto completo de dados
-- de demonstração está em src/lib/campaign-data.ts. Rode após schema.sql.
-- =========================================================================

insert into campanha (id, candidato, cargo, partido, numero, estado, data_eleicao, meta_votos, limite_gasto_tse)
values (1, 'Renato Pellizzari', 'Deputado Estadual', 'Partido (definir)', '10.123', 'Rio de Janeiro', '2026-10-04', 65000, 1150000);

insert into municipios (id, nome, regiao, eleitorado, meta_votos, votos_projetados, lideres) values
  ('rio',        'Rio de Janeiro',       'Metropolitana',      4800000, 12000, 8200, 14),
  ('niteroi',    'Niterói',              'Metropolitana',       400000,  4500, 3600,  6),
  ('cabo-frio',  'Cabo Frio',            'Região dos Lagos',    170000,  2600, 2700,  6),
  ('saquarema',  'Saquarema',            'Região dos Lagos',     75000,  1200, 1300,  3),
  ('caxias',     'Duque de Caxias',      'Baixada Fluminense',  640000,  3500, 2300,  5),
  ('campos',     'Campos dos Goytacazes','Norte Fluminense',    370000,  2400, 1500,  4);

insert into apoiadores (nome, tipo, municipio, regiao, telefone, meta_votos, votos_estimados, status, responsavel, ultimo_contato) values
  ('Marcos Tavares',  'Liderança',     'cabo-frio', 'Região dos Lagos', '(22) 99812-4471', 1200, 1340, 'Ativo',     'Coord. Lagos',   '2026-05-28'),
  ('Patrícia Gomes',  'Liderança',     'niteroi',   'Metropolitana',    '(21) 99654-7782', 1500, 1280, 'Ativo',     'Coord. Capital', '2026-05-30'),
  ('Jorge Almeida',   'Liderança',     'caxias',    'Baixada Fluminense','(21) 98119-5560', 1300,  870, 'Ativo',     'Coord. Baixada', '2026-05-18'),
  ('Aline Martins',   'Cabo eleitoral','campos',    'Norte Fluminense', '(21) 99710-4456',  500,  360, 'Potencial', 'Coord. Interior','2026-05-12');

insert into eventos (titulo, tipo, inicio, municipio, local, status, publico_estimado, responsavel) values
  ('Caminhada na orla',           'Caminhada', '2026-06-08 09:00-03', 'saquarema', 'Praia de Itaúna',       'Confirmado',  250, 'Coord. Lagos'),
  ('Comício de lançamento',       'Comício',   '2026-08-18 19:00-03', 'cabo-frio', 'Praça Porto Rocha',     'Agendado',   1500, 'Coord. Geral'),
  ('Plenária com voluntários',    'Reunião',   '2026-06-03 19:30-03', 'niteroi',   'Comitê Central',        'Confirmado',   90, 'Coord. Capital');

insert into receitas (data, origem, tipo, valor) values
  ('2026-02-25', 'Fundo Especial de Financiamento', 'Fundo partidário',        120000),
  ('2026-03-18', 'Rafael Costa',                    'Pessoa física',            15000),
  ('2026-04-22', 'Vaquinha online - 2ª rodada',     'Financiamento coletivo',   22100);

insert into despesas (data, descricao, categoria, fornecedor, valor, status) values
  ('2026-02-27', 'Produção de adesivos e bandeiras', 'Material de campanha', 'Gráfica Litoral',      22000, 'Pago'),
  ('2026-05-09', 'Impulsionamento de conteúdo',      'Marketing digital',    'Agência Onda Digital', 20000, 'Pago'),
  ('2026-05-30', 'Material gráfico - santinhos',     'Material de campanha', 'Gráfica Litoral',      24500, 'Pendente');
